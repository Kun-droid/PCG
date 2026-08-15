import { supabase } from './supabaseClient.js';

export async function loginUser(email, password, selectedRole = 'member') {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };

    // Fetch user role profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

    const userSession = {
        id: data.user.id,
        email: data.user.email,
        name: profile?.full_name || email.split('@')[0],
        studentId: profile?.student_id || '',
        role: profile?.role || selectedRole,
        designation: profile?.designation || 'Lead Folk Dancer',
        isLoggedIn: true
    };

    localStorage.setItem('panayana_auth_user', JSON.stringify(userSession));
    return { user: data.user, profile: userSession };
}

export async function registerUser(fullName, email, password, suite) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName, suite }
        }
    });

    if (error) return { error };

    const studentId = `2026-${Date.now().toString().slice(-5)}`;

    // Create profile entry
    if (data.user) {
        await supabase.from('profiles').upsert([{
            id: data.user.id,
            full_name: fullName,
            email,
            student_id: studentId,
            role: 'member',
            designation: `${suite} Troupe`
        }]);
    }

    const userSession = {
        id: data.user?.id,
        email,
        name: fullName,
        studentId,
        role: 'member',
        designation: `${suite} Troupe`,
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