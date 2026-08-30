// ==========================================================================
// PANAYANA MEMBER ABOUT US CONTROLLER (DYNAMIC CMS + ADVISER MODAL)
// ==========================================================================

import { getAboutContent, getAdvisers } from './db.js';

const FALLBACK_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23e29532'%3E%3Cpath d='M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z'/%3E%3C/svg%3E";

// Modal DOM References
const modal = document.getElementById('adviserDetailModal');
const closeBtn = document.getElementById('closeAdvDetailBtn');
const modalCloseActionBtn = document.getElementById('modalCloseActionBtn');
const modalAdvImage = document.getElementById('modalAdvImage');
const modalAdvFullName = document.getElementById('modalAdvFullName');
const modalAdvRole = document.getElementById('modalAdvRole');
const modalAdvTerm = document.getElementById('modalAdvTerm');
const modalAdvTag = document.getElementById('modalAdvTag');
const modalAdvBio = document.getElementById('modalAdvBio');
const modalAdvQuote = document.getElementById('modalAdvQuote');
const modalAdvQuoteBox = document.getElementById('modalAdvQuoteBox');

function cleanText(txt = '') {
    return txt.replace(/[\*\_\>\"“”]/g, '').trim();
}

export async function loadAboutData() {
    const [content, advisers] = await Promise.all([
        getAboutContent().catch(() => ({})),
        getAdvisers().catch(() => [])
    ]);

    // 1. Hero Content
    if (content.about_hero) {
        const heroTag = document.getElementById('aboutHeroTag');
        const heroTitle = document.getElementById('aboutHeroTitle');
        const heroDesc = document.getElementById('aboutHeroDesc');
        
        if (heroTag && content.about_hero.tag) heroTag.textContent = content.about_hero.tag;
        if (heroTitle && content.about_hero.title) heroTitle.textContent = content.about_hero.title;
        if (heroDesc && content.about_hero.desc) heroDesc.textContent = content.about_hero.desc;
    }

    // 2. Narratives (History & Mission)
    if (content.about_narratives) {
        const historyText = document.getElementById('aboutHistoryText');
        const missionText = document.getElementById('aboutMissionText');
        
        if (historyText && content.about_narratives.history) {
            historyText.innerHTML = content.about_narratives.history.replace(/\n/g, '<br>');
        }
        if (missionText && content.about_narratives.mission) {
            missionText.innerHTML = content.about_narratives.mission.replace(/\n/g, '<br>');
        }
    }

    // 3. Contacts & Social Media Links
    if (content.about_contacts) {
        const loc = document.getElementById('aboutLocationText');
        const emailLink = document.getElementById('aboutEmailLink');
        const phone = document.getElementById('aboutPhoneText');
        const fbLink = document.getElementById('aboutFbLink');
        const igLink = document.getElementById('aboutIgLink');
        const ytLink = document.getElementById('aboutYtLink');
        const driveLink = document.getElementById('aboutDriveLink');

        if (loc && content.about_contacts.location) loc.textContent = content.about_contacts.location;
        if (emailLink && content.about_contacts.email) {
            emailLink.textContent = content.about_contacts.email;
            emailLink.href = `mailto:${content.about_contacts.email}`;
        }
        if (phone && content.about_contacts.phone) phone.textContent = content.about_contacts.phone;

        if (fbLink && content.about_contacts.facebook) fbLink.href = content.about_contacts.facebook;
        if (igLink && content.about_contacts.instagram) igLink.href = content.about_contacts.instagram;
        if (ytLink && content.about_contacts.youtube) ytLink.href = content.about_contacts.youtube;
        if (driveLink && content.about_contacts.drive) driveLink.href = content.about_contacts.drive;
    }

    // 4. Advisers Grid
    const advisersGrid = document.getElementById('aboutAdvisersGrid') || document.getElementById('memberAdvisersGrid');
    if (advisersGrid) {
        if (!advisers || advisers.length === 0) {
            advisersGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted, #828292);">
                    <i class="fa-solid fa-user-graduate" style="font-size: 32px; margin-bottom: 8px; color: #cbd5e1; display: block;"></i>
                    <p>No adviser tributes published yet.</p>
                </div>`;
            return;
        }

        advisersGrid.innerHTML = '';

        advisers.forEach(item => {
            const photoSrc = item.image_url && item.image_url.trim().length > 20
                ? item.image_url
                : FALLBACK_AVATAR;

            const cleanedQuote = cleanText(item.quote || '');

            const card = document.createElement('div');
            card.className = 'adviser-card clickable-adviser-card';
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');

            card.innerHTML = `
                <div class="adviser-avatar-wrapper">
                    <img src="${photoSrc}" alt="${item.name}" class="adviser-avatar-img" onerror="this.onerror=null; this.src='${FALLBACK_AVATAR}';">
                    <span class="adviser-role-pill">Adviser</span>
                </div>

                <div class="adviser-header-info">
                    <h3>${item.name}</h3>
                    <span class="adviser-designation">${item.role || 'Adviser'}</span>
                </div>

                <div class="adviser-meta-pills">
                    <span class="adviser-meta-item">
                        <i class="fa-regular fa-calendar-check"></i>
                        <span>Term: ${item.term || 'N/A'}</span>
                    </span>
                    <span class="adviser-meta-item">
                        <i class="fa-solid fa-graduation-cap"></i>
                        <span>${item.tag || item.education || 'Master in Music'}</span>
                    </span>
                </div>

                ${cleanedQuote ? `
                    <div class="adviser-preview-quote">
                        <i class="fa-solid fa-quote-left"></i>
                        <span>&ldquo;${cleanedQuote}&rdquo;</span>
                    </div>` : ''}

                <span class="adviser-view-more">
                    <span>Read Full Tribute</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </span>
            `;

            card.addEventListener('click', () => openAdviserModal(item, photoSrc));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openAdviserModal(item, photoSrc);
                }
            });

            advisersGrid.appendChild(card);
        });
    }
}

function openAdviserModal(item, photoSrc) {
    if (!modal) return;
    if (modalAdvImage) modalAdvImage.src = photoSrc;
    if (modalAdvFullName) modalAdvFullName.textContent = item.name;
    if (modalAdvRole) modalAdvRole.textContent = item.role || 'Faculty Adviser & Artistic Mentor';
    if (modalAdvTerm) modalAdvTerm.textContent = `Term: ${item.term || 'N/A'}`;
    if (modalAdvTag) modalAdvTag.textContent = item.tag || item.education || 'Master in Music';
    
    if (modalAdvBio) {
        modalAdvBio.textContent = item.bio || 'Dedicated faculty mentor and artistic leader who contributed significantly to the cultural development of the WVSU Panayana Cultural Group.';
    }

    if (modalAdvQuoteBox && modalAdvQuote) {
        const cleanQuote = cleanText(item.quote || '');
        if (cleanQuote.length > 0) {
            modalAdvQuote.textContent = cleanQuote;
            modalAdvQuoteBox.style.display = 'flex';
        } else {
            modalAdvQuoteBox.style.display = 'none';
        }
    }

    modal.classList.add('active');
    
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) modalBody.scrollTop = 0;
}

function closeModal() {
    if (modal) modal.classList.remove('active');
}

[closeBtn, modalCloseActionBtn].forEach(btn => {
    btn?.addEventListener('click', closeModal);
});

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) {
        closeModal();
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAboutData);
} else {
    loadAboutData();
}