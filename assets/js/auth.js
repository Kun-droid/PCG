import { supabase } from './supabaseClient.js';

// Predefined Admin Emails
const ADMIN_EMAILS = [
    'kjkirkjohnray@gmail.com',
    'kirkjohnray.menez@wvsu.edu.ph',
    'admin@wvsu.edu.ph'
];

// ==========================================
// 1. AUTHENTICATION & REGISTRATION
// ==========================================

export async function loginUser(email, password, selectedRole = 'member') {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };

    // Fetch user profile
    let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

    // Determine role (prioritize whitelist or profile)
    const assignedRole = ADMIN_EMAILS.includes(email.toLowerCase()) 
        ? 'admin' 
        : (profile?.role || selectedRole);

    const userSession = {
        id: data.user.id,
        email: data.user.email,
        name: profile?.full_name || email.split('@')[0],
        studentId: profile?.student_id || '',
        role: assignedRole,
        designation: profile?.designation || (assignedRole === 'admin' ? 'Lead Custodian / Officer' : 'Lead Folk Dancer'),
        isLoggedIn: true
    };

    localStorage.setItem('panayana_auth_user', JSON.stringify(userSession));
    return { user: data.user, profile: userSession };
}

export async function registerUser(fullName, email, password, suite) {
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
    const assignedRole = isAdmin ? 'admin' : 'member';

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName, suite, role: assignedRole }
        }
    });

    if (error) return { error };

    const studentId = `2026-${Date.now().toString().slice(-5)}`;

    if (data.user) {
        await supabase.from('profiles').upsert([{
            id: data.user.id,
            full_name: fullName,
            email,
            student_id: studentId,
            role: assignedRole,
            designation: isAdmin ? 'Lead Custodian / Officer' : `${suite} Troupe`
        }]);
    }

    const userSession = {
        id: data.user?.id,
        email,
        name: fullName,
        studentId,
        role: assignedRole,
        designation: isAdmin ? 'Lead Custodian / Officer' : `${suite} Troupe`,
        isLoggedIn: true
    };

    localStorage.setItem('panayana_auth_user', JSON.stringify(userSession));
    return { user: data.user, profile: userSession };
}

// ==========================================
// 2. SIGN OUT (SINGLE-PROMPT LOGOUT)
// ==========================================

export async function logoutUser() {
    const confirmed = window.confirm("Are you sure you want to sign out?");
    if (!confirmed) return;

    try {
        await supabase.auth.signOut();
    } catch (e) {
        console.error("Error during sign out:", e);
    }
    
    localStorage.removeItem('panayana_auth_user');
    window.location.href = '../../index.html';
}

// ==========================================
// 3. SESSION CHECK & ADMIN HEADER INJECTION
// ==========================================

export function getCurrentUser() {
    const userJson = localStorage.getItem('panayana_auth_user');
    if (!userJson) return null;
    try {
        return JSON.parse(userJson);
    } catch {
        return null;
    }
}

export function initAdminHeaderAuth() {
    const user = getCurrentUser();
    const adminHeaderName = document.getElementById('adminHeaderName');

    if (user && adminHeaderName) {
        adminHeaderName.textContent = user.name;
    }

    // Clone and replace the logout button node to remove duplicate listeners
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn && logoutBtn.parentNode) {
        const freshLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(freshLogoutBtn, logoutBtn);
        
        freshLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            logoutUser();
        });
    }
}

// Ensure clean execution on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminHeaderAuth, { once: true });
} else {
    initAdminHeaderAuth();
}