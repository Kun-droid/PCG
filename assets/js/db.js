import { supabase } from './supabaseClient.js';

// ==========================================
// 1. PROFILES & MEMBERS
// ==========================================
export async function getTotalMembersCount() {
    const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
    
    if (error) {
        console.error('Error fetching member count:', error);
        return 0;
    }
    return count || 0;
}

// ==========================================
// 2. COSTUME INVENTORY
// ==========================================
export async function getCostumes() {
    const { data, error } = await supabase
        .from('costumes')
        .select('*')
        .order('name', { ascending: true });
    if (error) console.error('Error fetching costumes:', error);
    return data || [];
}

export async function addCostume(name, quantity) {
    const { data, error } = await supabase
        .from('costumes')
        .insert([{ name, quantity, available: quantity }])
        .select();
    if (error) console.error('Error adding costume:', error);
    return { data, error };
}

export async function updateCostume(id, name, quantity) {
    const { data, error } = await supabase
        .from('costumes')
        .update({ name, quantity })
        .eq('id', id)
        .select();
    if (error) console.error('Error updating costume:', error);
    return { data, error };
}

// ==========================================
// 3. CIRCULATION & LOANS
// ==========================================
export async function getActiveLoans() {
    const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('returned', false)
        .order('created_at', { ascending: false });
    if (error) console.error('Error fetching loans:', error);
    return data || [];
}

export async function checkActiveLoanByStudentId(studentId) {
    const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('student_id', studentId.trim())
        .eq('returned', false)
        .maybeSingle();
    if (error) console.error('Error checking loan:', error);
    return data;
}

export async function checkoutCostume(studentId, borrowerName, costumeId, costumeName, suite) {
    const { data, error } = await supabase
        .from('loans')
        .insert([{
            student_id: studentId,
            borrower_name: borrowerName,
            costume_id: costumeId,
            costume_name: costumeName,
            suite: suite,
            issued_date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }])
        .select();

    if (!error && costumeId) {
        const { data: c } = await supabase.from('costumes').select('available').eq('id', costumeId).single();
        if (c && c.available > 0) {
            await supabase.from('costumes').update({ available: c.available - 1 }).eq('id', costumeId);
        }
    }
    return { data, error };
}

export async function returnCostume(loanId, costumeId) {
    const { data, error } = await supabase
        .from('loans')
        .update({ returned: true, returned_at: new Date().toISOString() })
        .eq('id', loanId)
        .select();

    if (!error && costumeId) {
        const { data: c } = await supabase.from('costumes').select('available, quantity').eq('id', costumeId).single();
        if (c && c.available < c.quantity) {
            await supabase.from('costumes').update({ available: c.available + 1 }).eq('id', costumeId);
        }
    }
    return { data, error };
}

// ==========================================
// 4. SCHEDULE MASTER & CALENDAR
// ==========================================
export async function getSchedules() {
    const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('event_date', { ascending: true });
    if (error) console.error('Error loading schedules:', error);
    
    const scheduleMap = {};
    (data || []).forEach(item => {
        scheduleMap[item.event_date] = {
            id: item.id,
            title: item.title,
            time: item.time_window,
            tag: item.tag,
            desc: item.location_details
        };
    });
    return scheduleMap;
}

export async function saveSchedule(eventDate, title, timeWindow, tag, locationDetails) {
    const { data, error } = await supabase
        .from('schedules')
        .upsert([{
            event_date: eventDate,
            title,
            time_window: timeWindow,
            tag,
            location_details: locationDetails
        }], { onConflict: 'event_date' })
        .select();
    return { data, error };
}

export async function deleteSchedule(eventDate) {
    const { data, error } = await supabase
        .from('schedules')
        .delete()
        .eq('event_date', eventDate);
    return { data, error };
}

// ==========================================
// 5. ABOUT US CONTENT & ADVISERS
// ==========================================
export async function getAboutContent() {
    const { data, error } = await supabase.from('site_content').select('*');
    if (error) console.error('Error fetching site_content:', error);
    const content = {};
    (data || []).forEach(row => {
        content[row.key] = row.data;
    });
    return content;
}

export async function saveAboutContent(key, dataObj) {
    const { data, error } = await supabase
        .from('site_content')
        .upsert([{ key, data: dataObj, updated_at: new Date().toISOString() }], { onConflict: 'key' })
        .select();
    if (error) console.error('Error saving site_content:', error);
    return { data, error };
}

export async function getAdvisers() {
    const { data, error } = await supabase
        .from('advisers')
        .select('*')
        .order('created_at', { ascending: true });
    if (error) console.error('Error fetching advisers:', error);
    return data || [];
}

export async function addAdviser(name, role, term, tag, image_url = null, bio = '', quote = '') {
    const payload = {
        name,
        role: role || 'Adviser',
        designation: role || 'Adviser & Artistic Mentor',
        term: term || '2004–2026',
        education: tag || 'Master in Music',
        tag: tag || 'Master in Music',
        image_url: image_url || '../../../assets/images/libutaque.jpg',
        bio: bio || '',
        quote: quote || ''
    };

    const { data, error } = await supabase
        .from('advisers')
        .insert([payload])
        .select();
    if (error) console.error('Error adding adviser:', error);
    return { data, error };
}

export async function updateAdviser(id, name, role, term, tag, image_url = null, bio = '', quote = '') {
    const payload = {
        name,
        role: role || 'Adviser',
        designation: role || 'Adviser & Artistic Mentor',
        term: term || '2004–2026',
        education: tag || 'Master in Music',
        tag: tag || 'Master in Music',
        image_url: image_url || '../../../assets/images/libutaque.jpg',
        bio: bio || '',
        quote: quote || ''
    };

    const { data, error } = await supabase
        .from('advisers')
        .update(payload)
        .eq('id', id)
        .select();
    if (error) console.error('Error updating adviser:', error);
    return { data, error };
}

export async function deleteAdviser(id) {
    const { data, error } = await supabase
        .from('advisers')
        .delete()
        .eq('id', id);
    if (error) console.error('Error deleting adviser:', error);
    return { data, error };
}