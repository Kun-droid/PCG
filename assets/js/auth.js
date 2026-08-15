import { supabase } from './supabaseClient.js';

// Predefined Admin Emails
const ADMIN_EMAILS = [
    'kjkirkjohnray@gmail.com',
    'admin@wvsu.edu.ph'
];

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

export async function logoutUser() {
    try {
        await supabase.auth.signOut();
    } catch (e) {
        console.error(e);
    }
    localStorage.removeItem('panayana_auth_user');
    window.location.href = '../index.html';
}