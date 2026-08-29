// ==========================================================================
// PANAYANA MEMBER CALENDAR CONTROLLER & PHONE SYNC ENGINE
// ==========================================================================

import { getSchedules } from './db.js';

let eventsData = {};
const today = new Date();
let currentNavDate = new Date();
let isYearPickerOpen = false;

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// DOM Elements
const monthYearLabel = document.getElementById('currentMonthYear');
const badgeLabel = document.getElementById('calendarBadge');
const daysGrid = document.getElementById('calendarDaysGrid');
const weekdaysHeader = document.getElementById('calendarWeekdays');
const yearsPickerGrid = document.getElementById('yearsPickerGrid');
const yearSelectorBtn = document.getElementById('yearSelectorBtn');

const prevBtn = document.getElementById('prevMonthBtn');
const nextBtn = document.getElementById('nextMonthBtn');
const todayBtn = document.getElementById('todayBtn');
const subscribeBtn = document.getElementById('subscribePhoneCalendarBtn');

// Modal Elements
const modal = document.getElementById('eventModal');
const closeBtn = document.getElementById('modalCloseBtn');
const closeAction = document.getElementById('modalCloseAction');
const modalDateTitle = document.getElementById('modalDateTitle');
const eventBox = document.getElementById('eventDetailBox');
const noEventBox = document.getElementById('noEventState');
const eventTitle = document.getElementById('modalEventTitle');
const eventDesc = document.getElementById('modalEventDesc');
const eventTime = document.getElementById('modalEventTime');

export async function initCalendar() {
    try {
        eventsData = (await getSchedules()) || {};
    } catch (e) {
        console.warn('Could not load schedules:', e);
        eventsData = {};
    }
    renderCalendar();
}

function renderCalendar() {
    const year = currentNavDate.getFullYear();
    const month = currentNavDate.getMonth();

    if (monthYearLabel) monthYearLabel.textContent = `${monthNames[month]} ${year}`;

    const isCurrentMonth = (year === today.getFullYear() && month === today.getMonth());
    if (badgeLabel) {
        badgeLabel.textContent = isCurrentMonth ? "Current Month" : `${year}`;
    }

    if (!daysGrid) return;
    daysGrid.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    // Previous Month Inactive Slots
    for (let i = firstDayIndex; i > 0; i--) {
        const dayNum = prevMonthTotalDays - i + 1;
        const cell = document.createElement('div');
        cell.className = 'cal-cell inactive';
        cell.innerHTML = `<span class="cell-num">${dayNum}</span>`;
        daysGrid.appendChild(cell);
    }

    // Current Month Active Days
    for (let day = 1; day <= totalDaysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell';

        const formattedMonth = String(month + 1).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');
        const dateKey = `${year}-${formattedMonth}-${formattedDay}`;

        const isToday = (isCurrentMonth && day === today.getDate());
        if (isToday) cell.classList.add('today');

        const event = eventsData ? eventsData[dateKey] : null;
        let tagHTML = '';

        if (event) {
            cell.classList.add('has-event');
            const tagColor = isToday ? 'white' : (event.tag || 'maroon');
            const timeSnippet = event.time ? `<span class="tag-time">${event.time}</span>` : '';
            tagHTML = `<span class="cal-tag ${tagColor}"><strong>${event.title}</strong> ${timeSnippet}</span>`;
        } else if (isToday) {
            tagHTML = `<span class="cal-tag white">Today</span>`;
        }

        cell.innerHTML = `
            <span class="cell-num">${day}</span>
            ${tagHTML}
        `;

        cell.addEventListener('click', () => openModal(dateKey, `${monthNames[month]} ${day}, ${year}`));
        daysGrid.appendChild(cell);
    }

    // Next Month Inactive Slots
    const totalRenderedSlots = firstDayIndex + totalDaysInMonth;
    const remainingSlots = (totalRenderedSlots % 7 === 0) ? 0 : (7 - (totalRenderedSlots % 7));

    for (let nextDay = 1; nextDay <= remainingSlots; nextDay++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell inactive';
        cell.innerHTML = `<span class="cell-num">${nextDay}</span>`;
        daysGrid.appendChild(cell);
    }
}

function toggleYearPicker() {
    isYearPickerOpen = !isYearPickerOpen;
    if (isYearPickerOpen) {
        renderYearPicker();
        if (weekdaysHeader) weekdaysHeader.style.display = 'none';
        if (daysGrid) daysGrid.style.display = 'none';
        if (yearsPickerGrid) yearsPickerGrid.style.display = 'grid';
        if (yearSelectorBtn) yearSelectorBtn.classList.add('active');
    } else {
        closeYearPicker();
    }
}

function closeYearPicker() {
    isYearPickerOpen = false;
    if (weekdaysHeader) weekdaysHeader.style.display = 'grid';
    if (daysGrid) daysGrid.style.display = 'grid';
    if (yearsPickerGrid) yearsPickerGrid.style.display = 'none';
    if (yearSelectorBtn) yearSelectorBtn.classList.remove('active');
    renderCalendar();
}

function renderYearPicker() {
    if (!yearsPickerGrid) return;
    yearsPickerGrid.innerHTML = '';
    const currentYear = currentNavDate.getFullYear();
    for (let yr = currentYear - 6; yr <= currentYear + 5; yr++) {
        const yearCard = document.createElement('button');
        yearCard.type = 'button';
        yearCard.className = `year-pick-btn ${yr === currentYear ? 'active' : ''}`;
        yearCard.textContent = yr;
        yearCard.addEventListener('click', () => {
            currentNavDate.setFullYear(yr);
            closeYearPicker();
        });
        yearsPickerGrid.appendChild(yearCard);
    }
}

function openModal(dateKey, readableDate) {
    if (modalDateTitle) modalDateTitle.textContent = readableDate;
    const event = eventsData ? eventsData[dateKey] : null;

    if (event) {
        if (eventTitle) eventTitle.textContent = event.title;
        if (eventDesc) eventDesc.textContent = event.desc || 'No additional rehearsal notes.';
        if (eventTime) eventTime.textContent = event.time || 'Schedule TBA';
        if (eventBox) eventBox.style.display = 'flex';
        if (noEventBox) noEventBox.style.display = 'none';
    } else {
        if (eventBox) eventBox.style.display = 'none';
        if (noEventBox) noEventBox.style.display = 'block';
    }

    if (modal) modal.classList.add('active');
}

function closeModal() {
    if (modal) modal.classList.remove('active');
}

// ==========================================================================
// 4. CLIENT-SIDE CALENDAR SYNC (DIRECT PHONE PROMPT ENGINE)
// ==========================================================================
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

    // Convert local Manila time (UTC+8) to UTC date object
    const startUtcDate = new Date(Date.UTC(year, month - 1, day, startH - 8, startM, 0));
    const endUtcDate = new Date(Date.UTC(year, month - 1, day, endH - 8, endM, 0));
    const toUtcIso = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return {
        dtStart: toUtcIso(startUtcDate),
        dtEnd: toUtcIso(endUtcDate)
    };
}

async function handleAutoCalendarSync() {
    const dateKeys = Object.keys(eventsData || {});
    if (dateKeys.length === 0) {
        alert("No scheduled rehearsals or events found to sync.");
        return;
    }

    const nowUtc = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const vEvents = dateKeys.map((dateKey, index) => {
        const ev = eventsData[dateKey];
        const { dtStart, dtEnd } = parseIcsPstToUtc(dateKey, ev.time || '');
        const cleanSummary = (ev.title || 'WVSU Panayana Rehearsal').replace(/,/g, '\\,');
        const cleanDesc = (ev.desc || 'Troupe Call').replace(/,/g, '\\,');
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

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
        // Direct Base64 calendar stream triggers Apple Calendar's native Add All sheet
        const base64Data = btoa(unescape(encodeURIComponent(icsContent)));
        window.location.href = `data:text/calendar;charset=utf-8;base64,${base64Data}`;
    } else {
        // Android / Desktop download stream
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const fileUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = 'WVSU_Panayana_Schedule.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(fileUrl), 2000);
    }
}

if (subscribeBtn) {
    subscribeBtn.addEventListener('click', handleAutoCalendarSync);
}

if (yearSelectorBtn) yearSelectorBtn.addEventListener('click', toggleYearPicker);

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        if (isYearPickerOpen) {
            currentNavDate.setFullYear(currentNavDate.getFullYear() - 12);
            renderYearPicker();
        } else {
            currentNavDate.setMonth(currentNavDate.getMonth() - 1);
            renderCalendar();
        }
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        if (isYearPickerOpen) {
            currentNavDate.setFullYear(currentNavDate.getFullYear() + 12);
            renderYearPicker();
        } else {
            currentNavDate.setMonth(currentNavDate.getMonth() + 1);
            renderCalendar();
        }
    });
}

if (todayBtn) {
    todayBtn.addEventListener('click', () => {
        currentNavDate = new Date();
        if (isYearPickerOpen) closeYearPicker();
        else renderCalendar();
    });
}

[closeBtn, closeAction].forEach(btn => {
    btn?.addEventListener('click', closeModal);
});

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) {
        closeModal();
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalendar);
} else {
    initCalendar();
}