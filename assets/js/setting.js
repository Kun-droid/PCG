// ==========================================================================
// PANAYANA SETTINGS & PREFERENCES CONTROLLER
// ==========================================================================

const tabButtons = document.querySelectorAll('.settings-tab-btn');
const panes = document.querySelectorAll('.settings-pane');
const toast = document.getElementById('settingsToast');
const toastMsg = document.getElementById('settingsToastMsg');

// Profile Form Elements
const profileForm = document.getElementById('profileSettingsForm');
const profFullName = document.getElementById('profFullName');
const profStudentId = document.getElementById('profStudentId');
const profEmail = document.getElementById('profEmail');
const profRole = document.getElementById('profRole');

// Appearance Elements
const darkModeToggle = document.getElementById('darkModeToggle');
const sidebarCollapsedToggle = document.getElementById('sidebarCollapsedToggle');
const saveAppearanceBtn = document.getElementById('saveAppearanceBtn');

// Notification Elements
const notifyRehearsal = document.getElementById('notifyRehearsalToggle');
const notifyCostume = document.getElementById('notifyCostumeToggle');
const notifyAnnounce = document.getElementById('notifyAnnounceToggle');
const saveNotificationsBtn = document.getElementById('saveNotificationsBtn');

// Security Form
const securityForm = document.getElementById('securitySettingsForm');

function showToast(message) {
    if (!toast) return;
    toastMsg.textContent = message;
    toast.style.display = 'flex';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3500);
}

// 1. Tab Switching
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        tabButtons.forEach(b => b.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(`pane-${targetTab}`);
        if (targetPane) targetPane.classList.add('active');
    });
});

// 2. Load Saved Settings
function loadSettings() {
    const savedUser = JSON.parse(localStorage.getItem('panayana_auth_user') || '{}');
    if (savedUser.name && profFullName) profFullName.value = savedUser.name;
    if (savedUser.email && profEmail) profEmail.value = savedUser.email;
    if (savedUser.studentId && profStudentId) profStudentId.value = savedUser.studentId;

    if (darkModeToggle) {
        darkModeToggle.checked = localStorage.getItem('panayana_dark_mode') === 'true';
    }
    if (sidebarCollapsedToggle) {
        sidebarCollapsedToggle.checked = localStorage.getItem('panayana_sidebar_collapsed') === 'true';
    }

    const notifs = JSON.parse(localStorage.getItem('panayana_notif_prefs') || '{}');
    if (notifyRehearsal && notifs.rehearsal !== undefined) notifyRehearsal.checked = notifs.rehearsal;
    if (notifyCostume && notifs.costume !== undefined) notifyCostume.checked = notifs.costume;
    if (notifyAnnounce && notifs.announce !== undefined) notifyAnnounce.checked = notifs.announce;
}

// 3. Save Profile
if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentUser = JSON.parse(localStorage.getItem('panayana_auth_user') || '{}');
        currentUser.name = profFullName.value.trim();
        currentUser.email = profEmail.value.trim();
        currentUser.studentId = profStudentId.value.trim();
        currentUser.designation = profRole.value;

        localStorage.setItem('panayana_auth_user', JSON.stringify(currentUser));
        showToast("Profile details updated successfully.");
    });
}

// 4. Save Appearance
if (saveAppearanceBtn) {
    saveAppearanceBtn.addEventListener('click', () => {
        localStorage.setItem('panayana_dark_mode', darkModeToggle.checked);
        localStorage.setItem('panayana_sidebar_collapsed', sidebarCollapsedToggle.checked);
        
        if (sidebarCollapsedToggle.checked) {
            document.documentElement.classList.add('sidebar-is-collapsed');
        } else {
            document.documentElement.classList.remove('sidebar-is-collapsed');
        }
        
        showToast("Appearance preferences saved.");
    });
}

// 5. Save Notifications
if (saveNotificationsBtn) {
    saveNotificationsBtn.addEventListener('click', () => {
        const notifPrefs = {
            rehearsal: notifyRehearsal.checked,
            costume: notifyCostume.checked,
            announce: notifyAnnounce.checked
        };
        localStorage.setItem('panayana_notif_prefs', JSON.stringify(notifPrefs));
        showToast("Notification preferences updated.");
    });
}

// 6. Security / Password Submit
if (securityForm) {
    securityForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newPass = document.getElementById('secNewPass').value;
        const confirmPass = document.getElementById('secConfirmPass').value;

        if (newPass !== confirmPass) {
            alert("New password and confirm password do not match.");
            return;
        }

        securityForm.reset();
        showToast("Password updated successfully.");
    });
}

// Initialize
loadSettings();