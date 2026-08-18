import { supabase } from './supabaseClient.js';

// Predefined Admin Whitelist (lowercase)
const ADMIN_EMAILS = [
    'kjkirkjohnray@gmail.com',
    'kirkjohnray.menez@wvsu.edu.ph',
    'admin@wvsu.edu.ph'
];

// ==========================================
// 1. AUTHENTICATION (SIGN IN)
// ==========================================
export async function loginUser(email, password, selectedRole = 'member') {
    try {
        const cleanEmail = (email || '').trim().toLowerCase();

        // 1. Authenticate with Supabase Auth Engine
        const { data, error } = await supabase.auth.signInWithPassword({ 
            email: cleanEmail, 
            password 
        });
        
        if (error) return { user: null, profile: null, error };
        if (!data?.user) return { user: null, profile: null, error: new Error('User not found.') };

        // 2. Fetch Profile Record
        let profile = null;
        try {
            const { data: profData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .maybeSingle();
            profile = profData;
        } catch (dbErr) {
            console.warn('Could not read profiles table:', dbErr);
        }

        // 3. Strict Role Determination
        const isWhitelisted = ADMIN_EMAILS.includes(cleanEmail);
        const isDbAdmin = (profile?.role || '').toLowerCase().trim() === 'admin';
        const actualRole = (isWhitelisted || isDbAdmin) ? 'admin' : 'member';

        // 4. Strict Role Matching Validation
        if (selectedRole === 'admin' && actualRole !== 'admin') {
            await supabase.auth.signOut();
            localStorage.removeItem('panayana_auth_user');
            return {
                user: null,
                profile: null,
                error: new Error('Access Denied: You are not authorized as an Admin. Please select Member to sign in.')
            };
        }

        if (selectedRole === 'member' && actualRole === 'admin') {
            await supabase.auth.signOut();
            localStorage.removeItem('panayana_auth_user');
            return {
                user: null,
                profile: null,
                error: new Error('Notice: You are using an Admin account. Please switch to the Admin tab to access your console.')
            };
        }

        // 5. Construct & Save Validated Session
        const userSession = {
            id: data.user.id,
            email: data.user.email,
            name: profile?.full_name || cleanEmail.split('@')[0],
            studentId: profile?.student_id || '',
            role: actualRole,
            designation: profile?.designation || (actualRole === 'admin' ? 'Lead Custodian / Officer' : 'Troupe Member'),
            isLoggedIn: true
        };

        localStorage.setItem('panayana_auth_user', JSON.stringify(userSession));
        return { user: data.user, profile: userSession, error: null };

    } catch (err) {
        console.error('Fatal Login Error:', err);
        return { user: null, profile: null, error: err };
    }
}

// ==========================================
// 2. REGISTRATION (SIGN UP)
// ==========================================
export async function registerUser(fullName, email, password, suite = 'Troupe') {
    try {
        const cleanEmail = (email || '').trim().toLowerCase();
        const isAdmin = ADMIN_EMAILS.includes(cleanEmail);
        const assignedRole = isAdmin ? 'admin' : 'member';
        const studentId = `2026-${Date.now().toString().slice(-5)}`;

        const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
                data: { full_name: fullName, suite, role: assignedRole }
            }
        });

        if (error) return { user: null, error };

        if (data?.user) {
            try {
                await supabase.from('profiles').upsert([{
                    id: data.user.id,
                    full_name: fullName,
                    email: cleanEmail,
                    student_id: studentId,
                    role: assignedRole,
                    designation: assignedRole === 'admin' ? 'Lead Custodian / Officer' : `${suite} Troupe`
                }]);
            } catch (pErr) {
                console.warn('Profile table upsert skipped:', pErr);
            }
        }

        await supabase.auth.signOut();
        localStorage.removeItem('panayana_auth_user');

        return { user: data.user, error: null };

    } catch (err) {
        console.error('Fatal Register Error:', err);
        return { user: null, error: err };
    }
}

// ==========================================
// 3. SIGN OUT (LOGOUT)
// ==========================================
export async function logoutUser() {
    if (!window.confirm("Are you sure you want to sign out?")) return;

    try {
        await supabase.auth.signOut();
    } catch (e) {
        console.warn("Supabase signout notice:", e);
    }
    
    localStorage.removeItem('panayana_auth_user');

    const currentPath = window.location.pathname;
    if (currentPath.includes('/admin/')) {
        window.location.href = '../../index.html';
    } else {
        window.location.href = '../../index.html';
    }
}

// ==========================================
// 4. SESSION GETTER & HEADER SYNC
// ==========================================
export function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('panayana_auth_user') || 'null');
    } catch {
        return null;
    }
}

export function initHeaderAuth() {
    const user = getCurrentUser();

    // Populate Admin Header
    const adminHeaderName = document.getElementById('adminHeaderName');
    if (adminHeaderName && user) {
        adminHeaderName.textContent = user.name;
    }

    // Populate Member Header
    const headerUserName = document.getElementById('headerUserName');
    const headerUserDesignation = document.getElementById('headerUserDesignation');
    if (headerUserName && user) {
        headerUserName.textContent = user.name;
    }
    if (headerUserDesignation && user?.designation) {
        headerUserDesignation.textContent = user.designation;
    }

    // Bind Logout Button safely
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        const freshBtn = logoutBtn.cloneNode(true);
        logoutBtn.replaceWith(freshBtn);
        freshBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderAuth);
} else {
    initHeaderAuth();
}