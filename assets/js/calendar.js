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
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (closeAction) closeAction.addEventListener('click', closeModal);
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalendar);
} else {
    initCalendar();
}