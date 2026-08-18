// ==========================================================================
// PANAYANA ABOUT US ADMIN CONTROLLER (SUPABASE STORAGE + ADVISER UPLOAD)
// ==========================================================================

import { supabase } from './supabaseClient.js';
import { getAboutContent, saveAboutContent, getAdvisers, addAdviser, updateAdviser, deleteAdviser } from './db.js';

let advisersList = [];

// Safe inline SVG fallback
const FALLBACK_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23e29532'%3E%3Cpath d='M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z'/%3E%3C/svg%3E";

// DOM References
const heroForm = document.getElementById('heroNarrativeForm');
const contactsForm = document.getElementById('contactsForm');
const advisersGrid = document.getElementById('adminAdvisersGrid');
const feedbackBanner = document.getElementById('saveFeedbackBanner');

// Adviser Modal DOM
const adviserModal = document.getElementById('adviserModal');
const openAddAdviserBtn = document.getElementById('openAddAdviserBtn');
const closeAdviserModalBtn = document.getElementById('closeAdviserModalBtn');
const cancelAdviserModalBtn = document.getElementById('cancelAdviserModalBtn');
const adviserManageForm = document.getElementById('adviserManageForm');
const adviserModalTitle = document.getElementById('adviserModalTitle');

const adviserNameInput = document.getElementById('adviserNameInput');
const adviserRoleInput = document.getElementById('adviserRoleInput');
const adviserTermInput = document.getElementById('adviserTermInput');
const adviserTagInput = document.getElementById('adviserTagInput');
const adviserBioInput = document.getElementById('adviserBioInput');
const adviserQuoteInput = document.getElementById('adviserQuoteInput');

// Photo Upload Elements
const uploadAdviserPhotoBtn = document.getElementById('uploadAdviserPhotoBtn');
const adviserPhotoInput = document.getElementById('adviserPhotoInput');
const adviserPhotoPreview = document.getElementById('adviserPhotoPreview');
const adviserImageUrl = document.getElementById('adviserImageUrl');

let activeEditAdviserId = null;
let pendingPhotoData = null;

// ==========================================
// 1. INITIALIZE & FETCH FROM SUPABASE
// ==========================================
export async function initAboutCMS() {
    const [content, advisers] = await Promise.all([getAboutContent(), getAdvisers()]);
    advisersList = advisers || [];

    if (content.about_hero) {
        document.getElementById('heroTagInput').value = content.about_hero.tag || '';
        document.getElementById('heroTitleInput').value = content.about_hero.title || '';
        document.getElementById('heroDescInput').value = content.about_hero.desc || '';
    }
    if (content.about_narratives) {
        document.getElementById('historyDescInput').value = content.about_narratives.history || '';
        document.getElementById('missionDescInput').value = content.about_narratives.mission || '';
    }

    if (content.about_contacts) {
        document.getElementById('contactEmailInput').value = content.about_contacts.email || '';
        document.getElementById('contactPhoneInput').value = content.about_contacts.phone || '';
        document.getElementById('contactLocationInput').value = content.about_contacts.location || '';
        document.getElementById('socialFbInput').value = content.about_contacts.facebook || '';
        document.getElementById('socialIgInput').value = content.about_contacts.instagram || '';
        document.getElementById('socialYtInput').value = content.about_contacts.youtube || '';
        document.getElementById('socialDriveInput').value = content.about_contacts.drive || '';
    }

    renderAdvisersGrid();
}

// ==========================================
// 2. RENDER ADVISERS DIRECTORY
// ==========================================
function renderAdvisersGrid() {
    if (!advisersGrid) return;
    advisersGrid.innerHTML = '';

    if (advisersList.length === 0) {
        advisersGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 24px; color: var(--text-muted);">
                No former advisers added yet. Click "+ Add Adviser" above.
            </div>
        `;
        return;
    }

    advisersList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'adviser-card';

        const photoSrc = (item.image_url && item.image_url.trim().length > 20) 
            ? item.image_url 
            : FALLBACK_AVATAR;

        card.innerHTML = `
            <div class="adviser-card-header-actions">
                <button type="button" class="action-circle-btn edit-adv-btn" data-id="${item.id}" title="Edit Adviser">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button type="button" class="action-circle-btn delete delete-adv-btn" data-id="${item.id}" title="Delete Adviser">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>

            <div class="adviser-avatar-wrapper">
                <img src="${photoSrc}" alt="${item.name}" class="adviser-avatar-img" onerror="this.onerror=null; this.src='${FALLBACK_AVATAR}';">
                <span class="adviser-role-pill">Adviser</span>
            </div>

            <div class="adviser-header-info">
                <h3>${item.name}</h3>
                <span class="adviser-designation">${item.role || 'Adviser & Artistic Mentor'}</span>
            </div>

            <div class="adviser-meta-pills">
                <span class="adviser-meta-item">
                    <i class="fa-regular fa-calendar-check"></i>
                    <span>Term: ${item.term}</span>
                </span>
                <span class="adviser-meta-item">
                    <i class="fa-solid fa-graduation-cap"></i>
                    <span>${item.tag || 'Master in Music'}</span>
                </span>
            </div>

            <div class="adviser-divider"></div>

            <p class="adviser-bio">${item.bio || 'Spearheaded musical direction and repertoire for over two decades.'}</p>

            ${item.quote ? `
                <div class="adviser-quote-box">
                    <i class="fa-solid fa-quote-left"></i>
                    <span>${item.quote}</span>
                </div>` : ''}
        `;

        card.querySelector('.edit-adv-btn').addEventListener('click', () => openEditAdviserModal(item));
        card.querySelector('.delete-adv-btn').addEventListener('click', async () => {
            if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                await deleteAdviser(item.id);
                advisersList = await getAdvisers();
                renderAdvisersGrid();
                showSavedToast();
            }
        });

        advisersGrid.appendChild(card);
    });
}

function showSavedToast() {
    if (!feedbackBanner) return;
    feedbackBanner.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
        feedbackBanner.style.display = 'none';
    }, 3500);
}

// ==========================================
// 3. CANVAS IMAGE COMPRESSOR
// ==========================================
function compressImageToDataUrl(file, maxDim = 250, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxDim) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    }
                } else {
                    if (height > maxDim) {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

async function saveAdviserImage(compressedDataUrl) {
    if (!compressedDataUrl || !compressedDataUrl.startsWith('data:image')) {
        return compressedDataUrl || FALLBACK_AVATAR;
    }

    try {
        const blob = dataURLtoBlob(compressedDataUrl);
        const fileName = `adv-${Date.now()}.jpg`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('advisers')
            .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
            .from('advisers')
            .getPublicUrl(filePath);

        return publicData?.publicUrl || compressedDataUrl;
    } catch (err) {
        console.warn('Supabase storage upload bypassed; saving optimized Data URL:', err.message);
        return compressedDataUrl;
    }
}

if (uploadAdviserPhotoBtn && adviserPhotoInput) {
    uploadAdviserPhotoBtn.addEventListener('click', () => adviserPhotoInput.click());

    adviserPhotoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressed = await compressImageToDataUrl(file);
                pendingPhotoData = compressed;
                if (adviserPhotoPreview) adviserPhotoPreview.src = compressed;
                if (adviserImageUrl) adviserImageUrl.value = compressed;
            } catch (err) {
                console.error('Image compression failed:', err);
            }
        }
    });
}

// ==========================================
// 4. MODAL INTERACTIONS & FORM SUBMISSION
// ==========================================
function openEditAdviserModal(item) {
    activeEditAdviserId = item.id;
    pendingPhotoData = null;
    if (adviserPhotoInput) adviserPhotoInput.value = '';
    
    adviserModalTitle.textContent = "Edit Former Adviser";
    adviserNameInput.value = item.name || '';
    adviserRoleInput.value = item.role || '';
    adviserTermInput.value = item.term || '';
    adviserTagInput.value = item.tag || '';
    if (adviserBioInput) adviserBioInput.value = item.bio || '';
    if (adviserQuoteInput) adviserQuoteInput.value = item.quote || '';

    const photo = (item.image_url && item.image_url.trim().length > 20) ? item.image_url : FALLBACK_AVATAR;
    if (adviserPhotoPreview) adviserPhotoPreview.src = photo;
    if (adviserImageUrl) adviserImageUrl.value = item.image_url || '';

    adviserModal.classList.add('active');
}

if (openAddAdviserBtn) {
    openAddAdviserBtn.addEventListener('click', () => {
        activeEditAdviserId = null;
        pendingPhotoData = null;
        if (adviserPhotoInput) adviserPhotoInput.value = '';
        
        adviserModalTitle.textContent = "Add Former Adviser";
        adviserManageForm.reset();
        if (adviserPhotoPreview) adviserPhotoPreview.src = FALLBACK_AVATAR;
        if (adviserImageUrl) adviserImageUrl.value = '';
        adviserModal.classList.add('active');
    });
}

if (adviserManageForm) {
    adviserManageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = adviserManageForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        const name = adviserNameInput.value.trim();
        const role = adviserRoleInput.value.trim();
        const term = adviserTermInput.value.trim();
        const tag = adviserTagInput.value.trim();
        const bio = adviserBioInput ? adviserBioInput.value.trim() : '';
        const quote = adviserQuoteInput ? adviserQuoteInput.value.trim() : '';
        
        let finalImageUrl = adviserImageUrl.value;
        if (pendingPhotoData) {
            finalImageUrl = await saveAdviserImage(pendingPhotoData);
        }

        if (!finalImageUrl || finalImageUrl.trim().length === 0) {
            finalImageUrl = FALLBACK_AVATAR;
        }

        let res;
        if (activeEditAdviserId) {
            res = await updateAdviser(activeEditAdviserId, name, role, term, tag, finalImageUrl, bio, quote);
        } else {
            res = await addAdviser(name, role, term, tag, finalImageUrl, bio, quote);
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Adviser';

        if (res && res.error) {
            alert(`Database error: ${res.error.message}`);
            return;
        }

        advisersList = await getAdvisers();
        renderAdvisersGrid();
        adviserModal.classList.remove('active');
        showSavedToast();
    });
}

[closeAdviserModalBtn, cancelAdviserModalBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', () => {
        pendingPhotoData = null;
        activeEditAdviserId = null;
        adviserModal.classList.remove('active');
    });
});

// ==========================================
// 5. NARRATIVES & CONTACTS FORMS
// ==========================================
if (heroForm) {
    heroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const heroPayload = {
            tag: document.getElementById('heroTagInput').value.trim(),
            title: document.getElementById('heroTitleInput').value.trim(),
            desc: document.getElementById('heroDescInput').value.trim()
        };
        const narrativePayload = {
            history: document.getElementById('historyDescInput').value.trim(),
            mission: document.getElementById('missionDescInput').value.trim()
        };
        await Promise.all([
            saveAboutContent('about_hero', heroPayload),
            saveAboutContent('about_narratives', narrativePayload)
        ]);
        showSavedToast();
    });
}

if (contactsForm) {
    contactsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const contactsPayload = {
            email: document.getElementById('contactEmailInput').value.trim(),
            phone: document.getElementById('contactPhoneInput').value.trim(),
            location: document.getElementById('contactLocationInput').value.trim(),
            facebook: document.getElementById('socialFbInput').value.trim(),
            instagram: document.getElementById('socialIgInput').value.trim(),
            youtube: document.getElementById('socialYtInput').value.trim(),
            drive: document.getElementById('socialDriveInput').value.trim()
        };
        await saveAboutContent('about_contacts', contactsPayload);
        showSavedToast();
    });
}

initAboutCMS();