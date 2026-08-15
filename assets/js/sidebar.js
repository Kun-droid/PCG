import { logoutUser } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const container = document.getElementById('appContainer');
    const logoutBtn = document.getElementById('logout-btn');

    // Restore sidebar state[cite: 20]
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

    // Attach logout[cite: 20]
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await logoutUser();
        });
    }
});