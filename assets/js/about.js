import { getAboutContent, getAdvisers } from './db.js';

export async function loadAboutData() {
    const [content, advisers] = await Promise.all([getAboutContent(), getAdvisers()]);

    // 1. Populate Hero Content
    if (content.about_hero) {
        const heroTag = document.getElementById('aboutHeroTag');
        const heroTitle = document.getElementById('aboutHeroTitle');
        const heroDesc = document.getElementById('aboutHeroDesc');
        if (heroTag && content.about_hero.tag) heroTag.textContent = content.about_hero.tag;
        if (heroTitle && content.about_hero.title) heroTitle.textContent = content.about_hero.title;
        if (heroDesc && content.about_hero.desc) heroDesc.textContent = content.about_hero.desc;
    }

    // 2. Populate Narratives
    if (content.about_narratives) {
        const historyText = document.getElementById('aboutHistoryText');
        const missionText = document.getElementById('aboutMissionText');
        if (historyText && content.about_narratives.history) historyText.innerHTML = content.about_narratives.history;
        if (missionText && content.about_narratives.mission) missionText.innerHTML = content.about_narratives.mission;
    }

    // 3. Populate Contacts & Directory
    if (content.about_contacts) {
        const loc = document.getElementById('aboutLocationText');
        const emailLink = document.getElementById('aboutEmailLink');
        const phone = document.getElementById('aboutPhoneText');
        if (loc && content.about_contacts.location) loc.textContent = content.about_contacts.location;
        if (emailLink && content.about_contacts.email) {
            emailLink.textContent = content.about_contacts.email;
            emailLink.href = `mailto:${content.about_contacts.email}`;
        }
        if (phone && content.about_contacts.phone) phone.textContent = content.about_contacts.phone;
    }

    // 4. Populate Former Advisers Grid
    const advisersGrid = document.getElementById('aboutAdvisersGrid');
    if (advisersGrid && advisers && advisers.length > 0) {
        advisersGrid.innerHTML = advisers.map(item => `
            <div class="adviser-id-card">
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
            </div>
        `).join('');
    }
}

loadAboutData();