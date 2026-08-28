// ==========================================================================
// VERCEL SERVERLESS ICALENDAR SUBSCRIBER ENDPOINT
// Serves live .ics feed for Apple Calendar, Google Calendar & Outlook
// ==========================================================================

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function parseIcsDateRange(dateStr, timeStr) {
    const cleanDate = (dateStr || '').replace(/-/g, '');
    let startHour = "16", startMin = "00";
    let endHour = "19", endMin = "00";

    if (timeStr && timeStr.includes('–')) {
        const [startPart, endPart] = timeStr.split('–').map(s => s.trim());
        const parseTime = (t) => {
            const match = t.match(/(\d+):?(\d+)?\s*(AM|PM)?/i);
            if (!match) return { h: "16", m: "00" };
            let h = parseInt(match[1], 10);
            let m = match[2] || "00";
            const ampm = (match[3] || '').toUpperCase();
            if (ampm === 'PM' && h < 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            return { h: String(h).padStart(2, '0'), m: String(m).padStart(2, '0') };
        };

        const parsedStart = parseTime(startPart);
        const parsedEnd = parseTime(endPart);
        startHour = parsedStart.h; startMin = parsedStart.m;
        endHour = parsedEnd.h; endMin = parsedEnd.m;
    }

    return {
        dtStart: `${cleanDate}T${startHour}${startMin}00`,
        dtEnd: `${cleanDate}T${endHour}${endMin}00`
    };
}

export default async function handler(req, res) {
    let schedulesData = {};

    if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data } = await supabase.from('schedules').select('*');
        if (data && Array.isArray(data)) {
            data.forEach(item => {
                schedulesData[item.date || item.id] = item;
            });
        }
    }

    const dateKeys = Object.keys(schedulesData);

    const vEvents = dateKeys.map(dateKey => {
        const ev = schedulesData[dateKey];
        const { dtStart, dtEnd } = parseIcsDateRange(dateKey, ev.time || '');
        const cleanSummary = (ev.title || 'WVSU Panayana Rehearsal').replace(/,/g, '\\,');
        const cleanDesc = (ev.desc || 'General Call').replace(/,/g, '\\,');
        const cleanLoc = cleanDesc.includes('Auditorium') ? cleanDesc : 'WVSU Cultural Center / Stage';

        return [
            "BEGIN:VEVENT",
            `UID:panayana-${dateKey.replace(/-/g, '')}@wvsu.edu.ph`,
            `DTSTAMP:${dateKey.replace(/-/g, '')}T000000Z`,
            `DTSTART;TZID=Asia/Manila:${dtStart}`,
            `DTEND;TZID=Asia/Manila:${dtEnd}`,
            `SUMMARY:WVSU Panayana: ${cleanSummary}`,
            `DESCRIPTION:${cleanDesc} | Time: ${ev.time || 'TBA'}`,
            `LOCATION:${cleanLoc}`,
            "STATUS:CONFIRMED",
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

    // Security & Direct HTTPS Headers for iOS / Google Calendar
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="panayana_events.ics"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');

    res.status(200).send(icsContent);
}