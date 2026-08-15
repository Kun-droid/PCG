// ==========================================================================
// PANAYANA ABOUT US ADMIN CONTROLLER & PERSISTENCE ENGINE
// ==========================================================================

const defaultAboutData = {
    hero: {
        tag: "Official Cultural Performing Arts Arm",
        title: "West Visayas State University Panayana Cultural Group",
        desc: "Preserving, promoting, and staging the rich cultural heritage of Western Visayas and the Philippines through world-class folk dancing, authentic indigenous instrumentation, and theatrical repertoires."
    },
    narratives: {
        history: "Founded at West Visayas State University in Iloilo City, the Panayana Cultural Group has served as a beacon of artistic excellence and Philippine folkloric heritage. From traditional Panay Bukidnon epic chanting and dances to Spanish-influenced suites, Maria Clara court dances, and Cordillera rituals, the troupe brings the authentic stories of the archipelago to university, regional, and national stages.",
        mission: "To cultivate disciplined student performers who embody the cultural soul of Ilonggo tradition and Philippine heritage. We champion cultural preservation by training young artists in accurate dance choreography, live rondalla musicianship, indigenous costume preservation, and dynamic stagecraft."
    },
    advisers: [
        {
            id: "ADV-01",
            name: "Prof. Corazon S. Solas",
            role: "Faculty Adviser & Artistic Founder",
            term: "1998 – 2008",
            tag: "Folk Dance Pioneer"
        },
        {
            id: "ADV-02",
            name: "Dr. Ramon L. Rivera",
            role: "Artistic Director & Choreographer",
            term: "2009 – 2017",
            tag: "Singkil Suite Master"
        },
        {
            id: "ADV-03",
            name: "Prof. Ma. Elena G. Diaz",
            role: "Faculty Adviser & Music Director",
            term: "2018 – 2024",
            tag: "Rondalla Ensemble Lead"
        }
    ],
    contacts: {
        email: "panayana@wvsu.edu.ph",
        phone: "+63 (033) 320 0870 loc. 1145",
        location: "Cultural Center, WVSU Main Campus, Luna St., La Paz, Iloilo City",
        facebook: "https://facebook.com",
        instagram: "https://instagram.com",
        youtube: "https://youtube.com",
        drive: "https://drive.google.com"
    }
};

// Load saved data or initialize defaults
let aboutData = JSON.parse(localStorage.getItem('panayana_about_data') || 'null');
if (!aboutData) {
    aboutData = defaultAboutData;
    localStorage.setItem('panayana_about_data', JSON.stringify(aboutData));
}

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

let activeEditAdviserId = null;

// ==========================================
// 1. POPULATE INITIAL FORM FIELDS
// ==========================================
function populateFormFields() {
    // Hero & Narratives
    document.getElementById('heroTagInput').value = aboutData.hero.tag;
    document.getElementById('heroTitleInput').value = aboutData.hero.title;
    document.getElementById('heroDescInput').value = aboutData.hero.desc;
    document.getElementById('historyDescInput').value = aboutData.narratives.history;
    document.getElementById('missionDescInput').value = aboutData.narratives.mission;

    // Contacts
    document.getElementById('contactEmailInput').value = aboutData.contacts.email;
    document.getElementById('contactPhoneInput').value = aboutData.contacts.phone;
    document.getElementById('contactLocationInput').value = aboutData.contacts.location;
    document.getElementById('socialFbInput').value = aboutData.contacts.facebook;
    document.getElementById('socialIgInput').value = aboutData.contacts.instagram;
    document.getElementById('socialYtInput').value = aboutData.contacts.youtube;
    document.getElementById('socialDriveInput').value = aboutData.contacts.drive;
}

// ==========================================
// 2. RENDER ADVISERS DIRECTORY
// ==========================================
function renderAdvisersGrid() {
    if (!advisersGrid) return;
    advisersGrid.innerHTML = '';

    if (aboutData.advisers.length === 0) {
        advisersGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 24px; color: var(--text-muted);">
                No former advisers added yet. Click "+ Add Adviser" above.
            </div>
        `;
        return;
    }

    aboutData.advisers.forEach(item => {
        const card = document.createElement('div');
        card.className = 'adviser-id-card';
        card.style.position = 'relative';

        card.innerHTML = `
            <div class="id-card-top-strip"></div>
            <div class="id-photo-frame">
                <img src="../assets/images/Panayana_logo.jpg" alt="${item.name}" class="adviser-photo">
                <span class="id-role-chip">Adviser</span>
            </div>
            <div class="id-details">
                <h4>${item.name}</h4>
                <span class="id-title">${item.role}</span>
                <div class="id-badge-info">
                    <span><i class="fa-regular fa-calendar-check"></i> Term: ${item.term}</span>
                    <span><i class="fa-solid fa-award"></i> ${item.tag}</span>
                </div>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid var(--border-light); padding-top: 12px; margin-top: 12px;">
                <button type="button" class="modal-btn secondary edit-adv-btn" data-id="${item.id}" style="padding: 5px 10px; font-size: 11px;">
                    <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
                <button type="button" class="modal-btn secondary delete-adv-btn" data-id="${item.id}" style="padding: 5px 10px; font-size: 11px; color: #b91c1c; border-color: #f9d8dd;">
                    <i class="fa-solid fa-trash-can"></i> Delete
                </button>
            </div>
        `;

        // Edit listener
        card.querySelector('.edit-adv-btn').addEventListener('click', () => openEditAdviserModal(item));

        // Delete listener
        card.querySelector('.delete-adv-btn').addEventListener('click', () => deleteAdviser(item.id));

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
// 3. SAVE HERO & NARRATIVES
// ==========================================
if (heroForm) {
    heroForm.addEventListener('submit', (e) => {
        e.preventDefault();

        aboutData.hero.tag = document.getElementById('heroTagInput').value.trim();
        aboutData.hero.title = document.getElementById('heroTitleInput').value.trim();
        aboutData.hero.desc = document.getElementById('heroDescInput').value.trim();
        aboutData.narratives.history = document.getElementById('historyDescInput').value.trim();
        aboutData.narratives.mission = document.getElementById('missionDescInput').value.trim();

        localStorage.setItem('panayana_about_data', JSON.stringify(aboutData));
        showSavedToast();
    });
}

// ==========================================
// 4. SAVE CONTACTS & SOCIALS
// ==========================================
if (contactsForm) {
    contactsForm.addEventListener('submit', (e) => {
        e.preventDefault();

        aboutData.contacts.email = document.getElementById('contactEmailInput').value.trim();
        aboutData.contacts.phone = document.getElementById('contactPhoneInput').value.trim();
        aboutData.contacts.location = document.getElementById('contactLocationInput').value.trim();
        aboutData.contacts.facebook = document.getElementById('socialFbInput').value.trim();
        aboutData.contacts.instagram = document.getElementById('socialIgInput').value.trim();
        aboutData.contacts.youtube = document.getElementById('socialYtInput').value.trim();
        aboutData.contacts.drive = document.getElementById('socialDriveInput').value.trim();

        localStorage.setItem('panayana_about_data', JSON.stringify(aboutData));
        showSavedToast();
    });
}

// ==========================================
// 5. ADVISER MODAL & CRUD
// ==========================================
function openEditAdviserModal(item) {
    activeEditAdviserId = item.id;
    adviserModalTitle.textContent = "Edit Former Adviser";
    adviserNameInput.value = item.name;
    adviserRoleInput.value = item.role;
    adviserTermInput.value = item.term;
    adviserTagInput.value = item.tag;
    adviserModal.classList.add('active');
}

function deleteAdviser(id) {
    aboutData.advisers = aboutData.advisers.filter(a => a.id !== id);
    localStorage.setItem('panayana_about_data', JSON.stringify(aboutData));
    renderAdvisersGrid();
    showSavedToast();
}

if (openAddAdviserBtn) {
    openAddAdviserBtn.addEventListener('click', () => {
        activeEditAdviserId = null;
        adviserModalTitle.textContent = "Add Former Adviser";
        adviserManageForm.reset();
        adviserModal.classList.add('active');
    });
}

if (adviserManageForm) {
    adviserManageForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = adviserNameInput.value.trim();
        const role = adviserRoleInput.value.trim();
        const term = adviserTermInput.value.trim();
        const tag = adviserTagInput.value.trim();

        if (activeEditAdviserId) {
            const adviser = aboutData.advisers.find(a => a.id === activeEditAdviserId);
            if (adviser) {
                adviser.name = name;
                adviser.role = role;
                adviser.term = term;
                adviser.tag = tag;
            }
        } else {
            aboutData.advisers.push({
                id: `ADV-${Date.now().toString().slice(-4)}`,
                name,
                role,
                term,
                tag
            });
        }

        localStorage.setItem('panayana_about_data', JSON.stringify(aboutData));
        renderAdvisersGrid();
        adviserModal.classList.remove('active');
        showSavedToast();
    });
}

[closeAdviserModalBtn, cancelAdviserModalBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', () => adviserModal.classList.remove('active'));
});

// Initialize View
populateFormFields();
renderAdvisersGrid();