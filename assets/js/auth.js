import { supabase } from './supabaseClient.js';

// Predefined Admin Whitelist (lowercase)[cite: 7]
const ADMIN_EMAILS = [
    'kjkirkjohnray@gmail.com',
    'kirkjohnray.menez@wvsu.edu.ph',
    'admin@wvsu.edu.ph'
];

// ==========================================
// 1. AUTHENTICATION (SIGN IN)
// ==========================================
export async function loginUser(identifier, password, selectedRole = 'member') {
    try {
        const cleanIdentifier = (identifier || '').trim().toLowerCase();
        let targetEmail = cleanIdentifier;

        // 1. Check if user typed a Student ID instead of an email[cite: 7]
        if (!cleanIdentifier.includes('@')) {
            const { data: profileByStudentId, error: queryErr } = await supabase
                .from('profiles')
                .select('email')
                .eq('student_id', cleanIdentifier)
                .maybeSingle();

            if (queryErr || !profileByStudentId?.email) {
                return {
                    user: null,
                    profile: null,
                    error: new Error(`No account found registered under Student ID: ${cleanIdentifier}`)
                };
            }
            targetEmail = profileByStudentId.email.toLowerCase().trim();
        }

        // 2. Authenticate with Supabase Auth Engine[cite: 7]
        const { data, error } = await supabase.auth.signInWithPassword({ 
            email: targetEmail, 
            password 
        });
        
        if (error) return { user: null, profile: null, error };
        if (!data?.user) return { user: null, profile: null, error: new Error('User not found.') };

        // 3. Fetch Live Profile Record from Database[cite: 7]
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

        // 4. Strict Role Determination[cite: 7]
        const isWhitelisted = ADMIN_EMAILS.includes(targetEmail);
        const isDbAdmin = (profile?.role || data.user.user_metadata?.role || '').toLowerCase().trim() === 'admin';
        const actualRole = (isWhitelisted || isDbAdmin) ? 'admin' : 'member';

        // 5. Strict Role Matching Validation[cite: 7]
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

        // 6. Resolve Registered Name Directly from DB / Metadata[cite: 7]
        const resolvedFullName = profile?.full_name || 
                                 profile?.name || 
                                 data.user.user_metadata?.full_name || 
                                 data.user.user_metadata?.name || 
                                 '';

        const resolvedStudentId = profile?.student_id || 
                                  data.user.user_metadata?.student_id || 
                                  '';

        const resolvedDesignation = profile?.designation || 
                                    data.user.user_metadata?.designation || 
                                    (actualRole === 'admin' ? 'Lead Custodian / Officer' : 'Performing Member');

        // 7. Construct & Save Validated Session[cite: 7]
        const userSession = {
            id: data.user.id,
            email: data.user.email,
            name: resolvedFullName,
            full_name: resolvedFullName,
            studentId: resolvedStudentId,
            student_id: resolvedStudentId,
            role: actualRole,
            designation: resolvedDesignation,
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
export async function registerUser(fullName, email, password, designation = 'Performing Member', studentId = '') {
    try {
        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanFullName = (fullName || '').trim();
        const isAdmin = ADMIN_EMAILS.includes(cleanEmail);
        const assignedRole = isAdmin ? 'admin' : 'member';
        const finalStudentId = (studentId && studentId.trim().length > 0)
            ? studentId.trim()
            : `2026-${Date.now().toString().slice(-5)}`;

        const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
                data: { 
                    full_name: cleanFullName,
                    name: cleanFullName,
                    student_id: finalStudentId,
                    designation, 
                    role: assignedRole 
                }
            }
        });

        if (error) return { user: null, error };

        if (data?.user) {
            try {
                await supabase.from('profiles').upsert([{
                    id: data.user.id,
                    name: cleanFullName,
                    full_name: cleanFullName,
                    email: cleanEmail,
                    student_id: finalStudentId,
                    role: assignedRole,
                    designation: assignedRole === 'admin' ? 'Lead Custodian / Officer' : designation
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
    } else if (currentPath.includes('/pages/')) {
        window.location.href = '../index.html';
    } else {
        window.location.href = 'index.html';
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

export async function initHeaderAuth() {
    // 1. First populate immediately from cached session[cite: 7]
    let user = getCurrentUser();

    const applyToUI = (userData) => {
        if (!userData) return;
        const displayName = userData.name || userData.full_name || '';

        const adminHeaderName = document.getElementById('adminHeaderName');
        if (adminHeaderName && displayName) {
            adminHeaderName.textContent = displayName;
        }

        const headerUserName = document.getElementById('headerUserName');
        const headerUserDesignation = document.getElementById('headerUserDesignation');
        if (headerUserName && displayName) {
            headerUserName.textContent = displayName;
        }
        if (headerUserDesignation && userData.designation) {
            headerUserDesignation.textContent = userData.designation;
        }
    };

    if (user) applyToUI(user);

    // 2. Fetch fresh live profile from Supabase to ensure accurate database data[cite: 7]
    try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
            const { data: dbProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .maybeSingle();

            const liveName = dbProfile?.full_name || 
                             dbProfile?.name || 
                             authData.user.user_metadata?.full_name || 
                             authData.user.user_metadata?.name || 
                             '';

            if (liveName) {
                user = {
                    ...user,
                    id: authData.user.id,
                    email: authData.user.email,
                    name: liveName,
                    full_name: liveName,
                    studentId: dbProfile?.student_id || authData.user.user_metadata?.student_id || user?.studentId || '',
                    designation: dbProfile?.designation || authData.user.user_metadata?.designation || user?.designation || ''
                };
                localStorage.setItem('panayana_auth_user', JSON.stringify(user));
                applyToUI(user);
            }
        }
    } catch (e) {
        console.warn('Live profile sync check notice:', e);
    }

    // 3. Bind Logout Button safely[cite: 7]
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