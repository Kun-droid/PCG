// ==========================================================================
// VERCEL SERVERLESS ICALENDAR SUBSCRIBER ENDPOINT (/api/calendar)
// ==========================================================================

const getEnvVar = (key) => {
    if (typeof process !== 'undefined' && process && process.env) {
        return process.env[key] || process.env[`VITE_${key}`] || null;
    }
    return null;
};

const supabaseUrl = getEnvVar('SUPABASE_URL') || 'https://lwegonnsuywzhytacdmf.supabase.co';
const supabaseKey = getEnvVar('SUPABASE_ANON_KEY');

function parseIcsPstToUtc(dateStr, timeStr) {
    const [year, month, day] = (dateStr || '').split('-').map(Number);
    let startH = 16, startM = 0;
    let endH = 19, endM = 0;

    if (timeStr) {
        const parts = timeStr.split(/[-–—]|to/i).map(s => s.trim());
        const parseSingleTime = (t) => {
            const match = t.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
            if (!match) return null;
            let h = parseInt(match[1], 10);
            let min = match[2] ? parseInt(match[2], 10) : 0;
            const ampm = (match[3] || '').toUpperCase();

            if (ampm === 'PM' && h < 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            return { h, min };
        };

        if (parts[0]) {
            const p = parseSingleTime(parts[0]);
            if (p) {
                startH = p.h;
                startM = p.min;
                endH = (startH + 2) % 24;
                endM = startM;
            }
        }
        if (parts[1]) {
            const p = parseSingleTime(parts[1]);
            if (p) {
                endH = p.h;
                endM = p.min;
            }
        }
    }

    const startUtcDate = new Date(Date.UTC(year, month - 1, day, startH - 8, startM, 0));
    const endUtcDate = new Date(Date.UTC(year, month - 1, day, endH - 8, endM, 0));
    const toUtcIso = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return {
        dtStart: toUtcIso(startUtcDate),
        dtEnd: toUtcIso(endUtcDate)
    };
}

export default async function handler(req, res) {
    let schedulesData = {};

    if (supabaseUrl && supabaseKey) {
        try {
            // Direct REST API query without external npm packages
            const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/schedules?select=event_date,title,time_window,location_details,tag&order=event_date.asc`;
            const response = await fetch(endpoint, {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    data.forEach(item => {
                        if (item.event_date) {
                            schedulesData[item.event_date] = {
                                title: item.title,
                                time: item.time_window,
                                desc: item.location_details,
                                tag: item.tag
                            };
                        }
                    });
                }
            }
        } catch (err) {
            console.error('REST fetch error:', err);
        }
    }

    const dateKeys = Object.keys(schedulesData);
    const nowUtc = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const vEvents = dateKeys.map((dateKey, index) => {
        const ev = schedulesData[dateKey];
        const { dtStart, dtEnd } = parseIcsPstToUtc(dateKey, ev.time || '');
        const cleanSummary = (ev.title || 'WVSU Panayana Rehearsal').replace(/,/g, '\\,');
        const cleanDesc = (ev.desc || 'General Call').replace(/,/g, '\\,');
        const cleanLoc = cleanDesc.includes('Auditorium') ? cleanDesc : 'WVSU Cultural Center / Stage';

        return [
            "BEGIN:VEVENT",
            `UID:panayana-${dateKey.replace(/-/g, '')}-${index}@wvsu.edu.ph`,
            `DTSTAMP:${nowUtc}`,
            `DTSTART:${dtStart}`,
            `DTEND:${dtEnd}`,
            `SUMMARY:WVSU Panayana: ${cleanSummary}`,
            `DESCRIPTION:${cleanDesc}\\nCall Time: ${ev.time || 'TBA'}`,
            `LOCATION:${cleanLoc}`,
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

    const icsContent = [
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');

    return res.status(200).send(icsContent);
}