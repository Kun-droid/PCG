// ==========================================================================
// PANAYANA ICALENDAR FEED & EXPORT CONTROLLER
// Serves live .ics feed for Apple Calendar, Google Calendar & Outlook
// ==========================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 1. Safe Environment Extraction (Never throws ReferenceError if process is undefined)
const getEnvVar = (key) => {
    if (typeof process !== 'undefined' && process && process.env) {
        return process.env[key] || process.env[`VITE_${key}`] || null;
    }
    if (typeof window !== 'undefined' && window.__ENV__) {
        return window.__ENV__[key] || null;
    }
    return null;
};

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_ANON_KEY');

// 2. Flexible Date & Time Parser for iCalendar
function parseIcsDateRange(dateStr, timeStr) {
    const cleanDate = (dateStr || '').replace(/-/g, '');
    let startHour = 16, startMin = 0;
    let endHour = 19, endMin = 0;

    if (timeStr) {
        // Split by standard hyphen (-), en-dash (–), em-dash (—), or "to"
        const parts = timeStr.split(/[-–—]|to/i).map(s => s.trim());
        
        const parseSingleTime = (t) => {
            const match = t.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
            if (!match) return null;
            let h = parseInt(match[1], 10);
            let m = match[2] ? parseInt(match[2], 10) : 0;
            const ampm = (match[3] || '').toUpperCase();

            if (ampm === 'PM' && h < 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            return { h, m };
        };

        if (parts.length >= 1) {
            const parsedStart = parseSingleTime(parts[0]);
            if (parsedStart) {
                startHour = parsedStart.h;
                startMin = parsedStart.m;
                endHour = (startHour + 2) % 24; // Default 2-hour duration
                endMin = startMin;
            }
        }
        if (parts.length >= 2) {
            const parsedEnd = parseSingleTime(parts[1]);
            if (parsedEnd) {
                endHour = parsedEnd.h;
                endMin = parsedEnd.m;
            }
        }
    }

    const pad = (n) => String(n).padStart(2, '0');
    return {
        dtStart: `${cleanDate}T${pad(startHour)}${pad(startMin)}00`,
        dtEnd: `${cleanDate}T${pad(endHour)}${pad(endMin)}00`
    };
}

export async function generateIcsString() {
    let schedulesData = {};

    if (supabaseUrl && supabaseKey) {
        try {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data, error } = await supabase
                .from('schedules')
                .select('event_date, title, time_window, location_details, tag')
                .order('event_date', { ascending: true });

            if (!error && data && Array.isArray(data)) {
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
        } catch (err) {
            console.warn('Supabase fetch fallback:', err);
        }
    }

    const dateKeys = Object.keys(schedulesData);
    const nowUtc = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const vEvents = dateKeys.map((dateKey, index) => {
        const ev = schedulesData[dateKey];
        const { dtStart, dtEnd } = parseIcsDateRange(dateKey, ev.time || '');
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
            "DESCRIPTION:Panayana Rehearsal Call Reminder",
            "END:VALARM",
            "END:VEVENT"
        ].join("\r\n");
    });

    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//WVSU Panayana Cultural Group//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:WVSU Panayana Troupe Calendar",
        vEvents.join("\r\n"),
        "END:VCALENDAR"
    ].join("\r\n");
}

export default async function handler(req, res) {
    const icsContent = await generateIcsString();

    if (res && typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', 'inline; filename="panayana_events.ics"');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');

        if (typeof res.status === 'function') {
            return res.status(200).send(icsContent);
        }
        return res.end(icsContent);
    }

    return icsContent;
}