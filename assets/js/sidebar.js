import { getSchedules } from './db.js';
import { getCurrentUser } from './auth.js';
import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
    // =========================================================================
    // 0. LIVE MEMBER DATA SYNC (Top Header & Profile Modal)
    // =========================================================================
    let user = getCurrentUser() || {};

    const headerName = document.getElementById('headerUserName');
    const headerDesig = document.getElementById('headerUserDesignation');

    const updateHeader = (data) => {
        const displayName = data?.name || data?.full_name || '';
        const displayDesig = data?.designation || data?.suite || '';
        if (headerName && displayName) headerName.textContent = displayName;
        if (headerDesig && displayDesig) headerDesig.textContent = displayDesig;
    };

    updateHeader(user);

    // Live Database Sync via Supabase Auth & Profiles
    try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
            const { data: dbProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .maybeSingle();

            const realName = dbProfile?.full_name || 
                             dbProfile?.name || 
                             authData.user.user_metadata?.full_name || 
                             authData.user.user_metadata?.name || 
                             user.name || 
                             '';

            const realStudentId = dbProfile?.student_id || 
                                  authData.user.user_metadata?.student_id || 
                                  user.studentId || 
                                  '';

            const realDesignation = dbProfile?.designation || 
                                    authData.user.user_metadata?.designation || 
                                    user.designation || 
                                    'Performing Member';

            user = {
                id: authData.user.id,
                email: authData.user.email,
                name: realName,
                full_name: realName,
                studentId: realStudentId,
                student_id: realStudentId,
                designation: realDesignation,
                role: dbProfile?.role || authData.user.user_metadata?.role || user.role || 'member'
            };

            localStorage.setItem('panayana_auth_user', JSON.stringify(user));
            updateHeader(user);
        }
    } catch (err) {
        console.warn('Sidebar profile sync notice:', err);
    }

    // =========================================================================
    // 1. DYNAMIC MEMBER QR GENERATOR (COSTUME CHECKOUT — LEVEL L OVERFLOW FIX)
    // =========================================================================
    function generateMemberQR(userData) {
        const qrContainer = document.getElementById('memberQrContainer');
        if (!qrContainer) return;

        qrContainer.innerHTML = '';

        // Optimized payload to prevent byte capacity overflow
        const payload = JSON.stringify({
            id: userData?.id || '',
            studentId: userData?.studentId || userData?.student_id || '',
            name: userData?.name || userData?.full_name || ''
        });

        const render = () => {
            if (typeof window.QRCode !== 'undefined') {
                try {
                    new window.QRCode(qrContainer, {
                        text: payload,
                        width: 130,
                        height: 130,
                        colorDark: "#70131d",
                        colorLight: "#ffffff",
                        correctLevel: window.QRCode.CorrectLevel.L // Low error correction supports max payload size
                    });
                } catch (err) {
                    console.error("QR Render Error:", err);
                }
            } else {
                console.warn("QRCode library not loaded yet.");
            }
        };

        setTimeout(render, 50);
    }

    // =========================================================================
    // 2. Profile Modal Controller
    // =========================================================================
    const profTrigger = document.getElementById('profileTriggerBtn');
    const profModal = document.getElementById('profileModal');
    const closeProfBtn = document.getElementById('closeProfileBtn');
    const closeProfAction = document.getElementById('closeProfileActionBtn');

    function populateAndOpenProfile() {
        if (!profModal) return;

        const modalName = document.getElementById('modalProfName');
        const modalDesig = document.getElementById('modalProfDesignation');
        const modalStudentId = document.getElementById('modalProfStudentId');
        const modalEmail = document.getElementById('modalProfEmail');
        const modalSuite = document.getElementById('modalProfSuite');
        const modalStatus = document.getElementById('modalProfStatus');

        if (modalName) modalName.textContent = user.name || user.full_name || '';
        if (modalDesig) modalDesig.textContent = user.designation || '';
        if (modalStudentId) modalStudentId.textContent = user.studentId || user.student_id || '';
        if (modalEmail) modalEmail.textContent = user.email || '';
        if (modalSuite) modalSuite.textContent = user.designation || '';
        if (modalStatus) modalStatus.textContent = 'Active Performer';

        // 1. Make modal visible first
        profModal.classList.add('active');

        // 2. Draw QR code onto active container
        generateMemberQR(user);
    }

    if (profTrigger && profModal) {
        profTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            populateAndOpenProfile();
        });

        const closeProfile = () => profModal.classList.remove('active');

        if (closeProfBtn) closeProfBtn.addEventListener('click', closeProfile);
        if (closeProfAction) closeProfAction.addEventListener('click', closeProfile);

        profModal.addEventListener('click', (e) => {
            if (e.target === profModal) closeProfile();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && profModal.classList.contains('active')) {
                closeProfile();
            }
        });
    }

    // =========================================================================
    // 3. Sidebar Collapse Management
    // =========================================================================
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const container = document.getElementById('appContainer');

    const isCollapsed = localStorage.getItem('panayana_sidebar_collapsed') === 'true';
    if (isCollapsed) {
        if (sidebar) sidebar.classList.add('collapsed');
        if (container) container.classList.add('collapsed');
    }

    setTimeout(() => {
        if (sidebar) sidebar.style.transition = 'width 0.3s cubic-bezier(0.2, 0, 0, 1)';
    }, 50);

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            const willCollapse = !sidebar.classList.contains('collapsed');
            sidebar.classList.toggle('collapsed', willCollapse);
            if (container) container.classList.toggle('collapsed', willCollapse);
            document.documentElement.classList.toggle('sidebar-is-collapsed', willCollapse);
            localStorage.setItem('panayana_sidebar_collapsed', willCollapse);
        });
    }

    // =========================================================================
    // 4. Global Notification Engine
    // =========================================================================
    const notifBtn = document.getElementById('notificationTriggerBtn') || document.querySelector('.profile-icon');
    const notifModal = document.getElementById('notificationModal');
    const closeNotifBtn = document.getElementById('closeNotificationBtn');
    const dismissNotifBtn = document.getElementById('dismissNotificationsBtn');
    const badgeDot = document.querySelector('.badge-dot');
    const notifContainer = document.getElementById('notifDynamicList');

    let schedules = {};
    try {
        schedules = (await getSchedules()) || {};
    } catch {
        schedules = {};
    }

    const notifications = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    Object.keys(schedules).forEach(dateStr => {
        const item = schedules[dateStr];
        const eventDate = new Date(dateStr);
        eventDate.setHours(0, 0, 0, 0);

        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 3) {
            const dayText = diffDays === 0 ? "Today" : diffDays === 1 ? "Tomorrow" : `In ${diffDays} days`;
            notifications.push({
                type: 'urgent',
                icon: 'fa-calendar-check',
                theme: 'maroon',
                title: `Upcoming Event (${dayText})`,
                desc: `${item.title || 'Rehearsal'} scheduled at ${item.desc || 'Main Stage'} (${item.time || 'TBA'}).`,
                time: dayText,
                unread: true
            });
        } else if (diffDays > 3) {
            notifications.push({
                type: 'new-sched',
                icon: 'fa-calendar-plus',
                theme: 'gold',
                title: `New Schedule Posted: ${item.title || 'Event'}`,
                desc: `Scheduled for ${dateStr} at ${item.desc || 'Auditorium'}.`,
                time: 'Scheduled Announcement',
                unread: false
            });
        }
    });

    if (notifContainer && notifications.length > 0) {
        notifContainer.innerHTML = notifications.map(n => `
            <div class="notification-item ${n.unread ? 'unread' : ''}">
                <div class="notif-icon ${n.theme}">
                    <i class="fa-solid ${n.icon}"></i>
                </div>
                <div class="notif-content">
                    <strong>${n.title}</strong>
                    <p>${n.desc}</p>
                    <span class="notif-time"><i class="fa-regular fa-clock"></i> ${n.time}</span>
                </div>
            </div>
        `).join('');

        const hasUnread = notifications.some(n => n.unread);
        if (badgeDot) badgeDot.style.display = hasUnread ? 'block' : 'none';
    } else if (badgeDot) {
        badgeDot.style.display = 'none';
    }

    if (notifBtn && notifModal) {
        notifBtn.addEventListener('click', (e) => {
            e.preventDefault();
            notifModal.classList.add('active');
        });

        const closeNotification = () => notifModal.classList.remove('active');

        if (closeNotifBtn) closeNotifBtn.addEventListener('click', closeNotification);

        if (dismissNotifBtn) {
            dismissNotifBtn.addEventListener('click', () => {
                closeNotification();
                if (badgeDot) badgeDot.style.display = 'none';
                document.querySelectorAll('.notification-item.unread').forEach(item => {
                    item.classList.remove('unread');
                });
            });
        }

        notifModal.addEventListener('click', (e) => {
            if (e.target === notifModal) closeNotification();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && notifModal.classList.contains('active')) {
                closeNotification();
            }
        });
    }
});