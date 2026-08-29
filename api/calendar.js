// ==========================================================================
// VERCEL SERVERLESS ICALENDAR ENDPOINT (/api/calendar)
// ==========================================================================

const getEnv = (key) => {
    if (typeof process !== 'undefined' && process && process.env) {
        return process.env[key] || process.env[`VITE_${key}`] || '';
    }
    return '';
};

const SUPABASE_URL = getEnv('SUPABASE_URL') || 'https://lwegonnsuywzhytacdmf.supabase.co';
const SUPABASE_KEY = getEnv('SUPABASE_ANON_KEY');

function parseTimeRange(dateStr, timeStr) {
    if (!dateStr) return { dtStart: '', dtEnd: '' };

    const [year, month, day] = dateStr.split('-').map(Number);
    let startH = 16, startM = 0;
    let endH = 19, endM = 0;

    if (timeStr) {
        const parts = timeStr.split(/[-–—]|to/i).map(s => s.trim());
        const parseT = (t) => {
            const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
            if (!m) return null;
            let h = parseInt(m[1], 10);
            let min = m[2] ? parseInt(m[2], 10) : 0;
            const ampm = (m[3] || '').toUpperCase();
            if (ampm === 'PM' && h < 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            return { h, min };
        };

        if (parts[0]) {
            const p = parseT(parts[0]);
            if (p) { 
                startH = p.h; 
                startM = p.min; 
                endH = (startH + 2) % 24; 
                endM = startM; 
            }
        }
        if (parts[1]) {
            const p = parseT(parts[1]);
            if (p) { 
                endH = p.h; 
                endM = p.min; 
            }
        }
    }

    // Convert local Manila time (UTC+8) into standard UTC date
    const startUtc = new Date(Date.UTC(year, month - 1, day, startH - 8, startM, 0));
    const endUtc = new Date(Date.UTC(year, month - 1, day, endH - 8, endM, 0));
    
    const toIso = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return {
        dtStart: toIso(startUtc),
        dtEnd: toIso(endUtc)
    };
}

export default async function handler(req, res) {
    let events = [];

    if (SUPABASE_URL && SUPABASE_KEY) {
        try {
            const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/schedules?select=event_date,title,time_window,location_details,tag&order=event_date.asc`;
            const r = await fetch(url, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            if (r.ok) {
                events = await r.json();
            }
        } catch (e) {
            console.error('Supabase fetch error:', e);
        }
    }

    const nowUtc = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const vEvents = (events || []).map((ev, i) => {
        const { dtStart, dtEnd } = parseTimeRange(ev.event_date, ev.time_window || '');
        const summary = (ev.title || 'WVSU Panayana Rehearsal').replace(/,/g, '\\,');
        const desc = (ev.location_details || 'General Call').replace(/,/g, '\\,');
        const loc = desc.includes('Auditorium') ? desc : 'WVSU Cultural Center / Stage';

        return [
            "BEGIN:VEVENT",
            `UID:panayana-${(ev.event_date || 'event').replace(/[^a-zA-Z0-9]/g, '')}-${i}@wvsu.edu.ph`,
            `DTSTAMP:${nowUtc}`,
            `DTSTART:${dtStart}`,
            `DTEND:${dtEnd}`,
            `SUMMARY:WVSU Panayana: ${summary}`,
            `DESCRIPTION:${desc}\\nCall Time: ${ev.time_window || 'TBA'}`,
            `LOCATION:${loc}`,
            "STATUS:CONFIRMED",
            "TRANSP:OPAQUE",
            "BEGIN:VALARM",
            "TRIGGER:-PT1H",
            "ACTION:DISPLAY",
            "DESCRIPTION:Panayana Rehearsal Reminder",
            "END:VALARM",
            "END:VEVENT"
        ].join("\r\n");
    });

    const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//WVSU Panayana Cultural Group//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:WVSU Panayana Troupe Calendar",
        "X-WR-TIMEZONE:Asia/Manila",
        vEvents.join("\r\n"),
        "END:VCALENDAR"
    ].join("\r\n");

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="panayana_events.ics"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');

    return res.status(200).send(ics);
}