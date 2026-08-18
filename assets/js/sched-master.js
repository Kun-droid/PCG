// ==========================================================================
// PANAYANA ADMIN SCHEDULE MASTER CONTROLLER
// ==========================================================================

import { getSchedules, saveSchedule, deleteSchedule } from './db.js';

let schedulesData = {};
const today = new Date();
let currentNavDate = new Date();
let isYearPickerOpen = false;

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// DOM References
const calendarDaysGrid = document.getElementById('calendarDaysGrid');
const currentMonthYear = document.getElementById('currentMonthYear');
const calendarBadge = document.getElementById('calendarBadge');
const weekdaysHeader = document.getElementById('calendarWeekdays');
const yearsPickerGrid = document.getElementById('yearsPickerGrid');
const yearSelectorBtn = document.getElementById('yearSelectorBtn');

const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const todayBtn = document.getElementById('todayBtn');
const openAddEventBtn = document.getElementById('openAddEventBtn');

// Read / Detail Modal DOM
const eventModal = document.getElementById('eventModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalCloseAction = document.getElementById('modalCloseAction');
const modalDateTitle = document.getElementById('modalDateTitle');
const modalEventTitle = document.getElementById('modalEventTitle');
const modalEventDesc = document.getElementById('modalEventDesc');
const modalEventTime = document.getElementById('modalEventTime');
const eventDetailBox = document.getElementById('eventDetailBox');
const noEventState = document.getElementById('noEventState');
const editEventBtn = document.getElementById('editEventBtn');
const deleteEventBtn = document.getElementById('deleteEventBtn');

// Add / Edit Modal DOM
const eventManageModal = document.getElementById('eventManageModal');
const closeManageModalBtn = document.getElementById('closeManageModalBtn');
const cancelManageModalBtn = document.getElementById('cancelManageModalBtn');
const eventManageForm = document.getElementById('eventManageForm');
const manageModalTitle = document.getElementById('manageModalTitle');
const eventDateInput = document.getElementById('eventDateInput');
const eventTitleInput = document.getElementById('eventTitleInput');
const eventTimeInput = document.getElementById('eventTimeInput');
const eventTagInput = document.getElementById('eventTagInput');
const eventDescInput = document.getElementById('eventDescInput');

let selectedDateKey = null;

// ==========================================
// 1. INITIALIZE & RENDER
// ==========================================
export async function initScheduleMaster() {
    try {
        schedulesData = (await getSchedules()) || {};
    } catch (e) {
        console.warn('Could not fetch schedules:', e);
        schedulesData = {};
    }
    renderCalendar();
}

function renderCalendar() {
    const year = currentNavDate.getFullYear();
    const month = currentNavDate.getMonth();

    if (currentMonthYear) {
        currentMonthYear.textContent = `${monthNames[month]} ${year}`;
    }

    const isCurrentMonth = (year === today.getFullYear() && month === today.getMonth());
    if (calendarBadge) {
        calendarBadge.textContent = isCurrentMonth ? "Current Month" : `${year}`;
    }

    if (!calendarDaysGrid) return;
    calendarDaysGrid.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    // 1. Previous Month Inactive Slots
    for (let i = firstDayIndex; i > 0; i--) {
        const dayNum = prevMonthTotalDays - i + 1;
        const cell = document.createElement('div');
        cell.className = 'cal-cell inactive';
        cell.innerHTML = `<span class="cell-num">${dayNum}</span>`;
        calendarDaysGrid.appendChild(cell);
    }

    // 2. Current Month Active Days
    for (let day = 1; day <= totalDaysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell';

        const formattedMonth = String(month + 1).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');
        const dateKey = `${year}-${formattedMonth}-${formattedDay}`;

        const isToday = (isCurrentMonth && day === today.getDate());
        if (isToday) cell.classList.add('today');

        const event = schedulesData ? schedulesData[dateKey] : null;
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

        cell.addEventListener('click', () => {
            handleDateCellClick(dateKey, day, monthNames[month], year, event);
        });

        calendarDaysGrid.appendChild(cell);
    }

    // 3. Next Month Inactive Slots
    const totalRenderedSlots = firstDayIndex + totalDaysInMonth;
    const remainingSlots = (totalRenderedSlots % 7 === 0) ? 0 : (7 - (totalRenderedSlots % 7));

    for (let nextDay = 1; nextDay <= remainingSlots; nextDay++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell inactive';
        cell.innerHTML = `<span class="cell-num">${nextDay}</span>`;
        calendarDaysGrid.appendChild(cell);
    }
}

// ==========================================
// 2. YEAR PICKER ACCORDION / TOGGLE
// ==========================================
function toggleYearPicker() {
    isYearPickerOpen = !isYearPickerOpen;
    if (isYearPickerOpen) {
        renderYearPicker();
        if (weekdaysHeader) weekdaysHeader.style.display = 'none';
        if (calendarDaysGrid) calendarDaysGrid.style.display = 'none';
        if (yearsPickerGrid) yearsPickerGrid.style.display = 'grid';
        if (yearSelectorBtn) yearSelectorBtn.classList.add('active');
    } else {
        closeYearPicker();
    }
}

function closeYearPicker() {
    isYearPickerOpen = false;
    if (weekdaysHeader) weekdaysHeader.style.display = 'grid';
    if (calendarDaysGrid) calendarDaysGrid.style.display = 'grid';
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

// ==========================================
// 3. MODAL CLICK HANDLERS
// ==========================================
function handleDateCellClick(dateKey, day, monthName, year, event) {
    selectedDateKey = dateKey;

    if (event) {
        if (modalDateTitle) modalDateTitle.textContent = `${monthName} ${day}, ${year}`;
        if (modalEventTitle) modalEventTitle.textContent = event.title || '';
        if (modalEventDesc) modalEventDesc.textContent = event.desc || 'No additional details provided.';
        if (modalEventTime) modalEventTime.textContent = event.time || 'Schedule TBA';

        if (eventDetailBox) eventDetailBox.style.display = 'flex';
        if (noEventState) noEventState.style.display = 'none';
        if (editEventBtn) editEventBtn.style.display = 'inline-flex';
        if (deleteEventBtn) deleteEventBtn.style.display = 'inline-flex';

        if (eventModal) eventModal.classList.add('active');
    } else {
        openCreateModal(dateKey);
    }
}

function openCreateModal(prefillDate = '') {
    if (manageModalTitle) manageModalTitle.textContent = "Add Rehearsal / Event";
    if (eventManageForm) eventManageForm.reset();

    if (eventDateInput) {
        eventDateInput.value = prefillDate || selectedDateKey || new Date().toISOString().split('T')[0];
    }

    if (eventManageModal) eventManageModal.classList.add('active');
}

function openEditModalFromDetail() {
    const event = schedulesData ? schedulesData[selectedDateKey] : null;
    if (!event) return;

    if (eventModal) eventModal.classList.remove('active');

    if (manageModalTitle) manageModalTitle.textContent = "Edit Rehearsal / Event";
    if (eventDateInput) eventDateInput.value = selectedDateKey;
    if (eventTitleInput) eventTitleInput.value = event.title || '';
    if (eventTimeInput) eventTimeInput.value = event.time || '';
    if (eventTagInput) eventTagInput.value = event.tag || 'maroon';
    if (eventDescInput) eventDescInput.value = event.desc || '';

    if (eventManageModal) eventManageModal.classList.add('active');
}

// ==========================================
// 4. FORM ACTIONS (SAVE & DELETE)
// ==========================================
if (eventManageForm) {
    eventManageForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = eventManageForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        }

        const date = eventDateInput ? eventDateInput.value : '';
        const title = eventTitleInput ? eventTitleInput.value.trim() : '';
        const time = eventTimeInput ? eventTimeInput.value.trim() : '';
        const tag = eventTagInput ? eventTagInput.value : 'maroon';
        const desc = eventDescInput ? eventDescInput.value.trim() : '';

        const { error } = await saveSchedule(date, title, time, tag, desc);

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Schedule';
        }

        if (error) {
            alert(`Error saving schedule: ${error.message}`);
            return;
        }

        try {
            schedulesData = (await getSchedules()) || {};
        } catch (fetchErr) {
            console.warn(fetchErr);
        }

        renderCalendar();
        if (eventManageModal) eventManageModal.classList.remove('active');
    });
}

if (deleteEventBtn) {
    deleteEventBtn.addEventListener('click', async () => {
        if (!selectedDateKey) return;
        if (confirm(`Are you sure you want to delete the schedule for ${selectedDateKey}?`)) {
            await deleteSchedule(selectedDateKey);
            try {
                schedulesData = (await getSchedules()) || {};
            } catch (fetchErr) {
                console.warn(fetchErr);
            }
            renderCalendar();
            if (eventModal) eventModal.classList.remove('active');
        }
    });
}

// Navigation & Trigger Listeners
if (yearSelectorBtn) yearSelectorBtn.addEventListener('click', toggleYearPicker);
if (openAddEventBtn) openAddEventBtn.addEventListener('click', () => openCreateModal());
if (editEventBtn) editEventBtn.addEventListener('click', openEditModalFromDetail);

if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
        if (isYearPickerOpen) {
            currentNavDate.setFullYear(currentNavDate.getFullYear() - 12);
            renderYearPicker();
        } else {
            currentNavDate.setMonth(currentNavDate.getMonth() - 1);
            renderCalendar();
        }
    });
}

if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
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

// Modal Closers
[modalCloseBtn, modalCloseAction].forEach(btn => {
    if (btn) btn.addEventListener('click', () => eventModal && eventModal.classList.remove('active'));
});

[closeManageModalBtn, cancelManageModalBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', () => eventManageModal && eventManageModal.classList.remove('active'));
});

// Close modal when clicking outside background overlay
[eventModal, eventManageModal].forEach(overlay => {
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScheduleMaster);
} else {
    initScheduleMaster();
}