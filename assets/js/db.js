import { supabase } from './supabaseClient.js';

// ==========================================
// COSTUME INVENTORY
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
// CIRCULATION & SCAN DISPATCH
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
    // 1. Log checkout
    const { data, error } = await supabase
        .from('loans')
        .insert([{
            student_id: studentId,
            borrower_name: borrowerName,
            costume_id: costumeId,
            costume_name: costumeName,
            suite: suite
        }])
        .select();

    // 2. Decrement available count in inventory
    if (!error && costumeId) {
        const { data: c } = await supabase.from('costumes').select('available').eq('id', costumeId).single();
        if (c && c.available > 0) {
            await supabase.from('costumes').update({ available: c.available - 1 }).eq('id', costumeId);
        }
    }
    return { data, error };
}

export async function returnCostume(loanId, costumeId) {
    // 1. Mark loan returned
    const { data, error } = await supabase
        .from('loans')
        .update({ returned: true, returned_at: new Date().toISOString() })
        .eq('id', loanId)
        .select();

    // 2. Increment available count in inventory
    if (!error && costumeId) {
        const { data: c } = await supabase.from('costumes').select('available, quantity').eq('id', costumeId).single();
        if (c && c.available < c.quantity) {
            await supabase.from('costumes').update({ available: c.available + 1 }).eq('id', costumeId);
        }
    }
    return { data, error };
}

// ==========================================
// SCHEDULE MASTER / CALENDAR
// ==========================================
export async function getSchedules() {
    const { data, error } = await supabase
        .from('schedules')
        .select('*');
    if (error) console.error('Error loading schedules:', error);
    
    // Format into date keyed object for calendar renderer
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
// ABOUT US CONTENT & ADVISERS
// ==========================================
export async function getAboutContent() {
    const { data, error } = await supabase.from('site_content').select('*');
    const content = {};
    (data || []).forEach(row => {
        content[row.key] = row.data;
    });
    return content;
}

export async function saveAboutContentKey(key, dataObj) {
    return await supabase
        .from('site_content')
        .upsert([{ key, data: dataObj, updated_at: new Date().toISOString() }]);
}

export async function getAdvisers() {
    const { data, error } = await supabase
        .from('advisers')
        .select('*')
        .order('created_at', { ascending: true });
    return data || [];
}

export async function saveAdviser(adviserObj) {
    return await supabase.from('advisers').upsert([adviserObj]);
}

export async function deleteAdviser(id) {
    return await supabase.from('advisers').delete().eq('id', id);
}