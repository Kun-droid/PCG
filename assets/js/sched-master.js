// ==========================================================================
// PANAYANA ADMIN SCHEDULE MASTER CONTROLLER
// ==========================================================================

import { getSchedules, saveSchedule, deleteSchedule } from './db.js';

let schedulesData = {};
let currentDate = new Date(2026, 7, 1); // Defaults to August 2026

// DOM References
const calendarDaysGrid = document.getElementById('calendarDaysGrid');
const currentMonthYear = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const todayBtn = document.getElementById('todayBtn');
const calendarBadge = document.getElementById('calendarBadge');
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
    schedulesData = await getSchedules();
    renderCalendar();
}

function renderCalendar() {
    if (!calendarDaysGrid) return;
    calendarDaysGrid.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    if (currentMonthYear) {
        currentMonthYear.textContent = `${monthNames[month]} ${year}`;
    }

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    // 1. Previous Month Padding Days (Muted Shade)
    for (let i = firstDayIndex; i > 0; i--) {
        const dayNum = prevLastDay - i + 1;
        const prevMonthDate = new Date(year, month - 1, dayNum);
        const pYear = prevMonthDate.getFullYear();
        const pMonth = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
        const pDay = String(dayNum).padStart(2, '0');
        const dateKey = `${pYear}-${pMonth}-${pDay}`;

        const dayDiv = document.createElement('div');
        dayDiv.className = 'cal-cell prev-month-cell';
        dayDiv.innerHTML = `<span class="cal-day-num">${dayNum}</span>`;

        const event = schedulesData[dateKey];
        if (event) {
            dayDiv.classList.add('has-event');
            const tagClass = event.tag === 'gold' ? 'gold-tag' : 'maroon-tag';
            dayDiv.innerHTML += `
                <div class="cal-event-pill ${tagClass}">
                    <strong>${event.title}</strong>
                    <small>${event.time || ''}</small>
                </div>
            `;
        }

        dayDiv.addEventListener('click', () => {
            handleDateCellClick(dateKey, dayNum, monthNames[prevMonthDate.getMonth()], pYear, event);
        });

        calendarDaysGrid.appendChild(dayDiv);
    }

    // 2. Current Month Active Days
    for (let day = 1; day <= totalDays; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'cal-cell';

        const monthPadded = String(month + 1).padStart(2, '0');
        const dayPadded = String(day).padStart(2, '0');
        const dateKey = `${year}-${monthPadded}-${dayPadded}`;

        const today = new Date();
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayDiv.classList.add('today-cell');
        }

        let innerContent = `<span class="cal-day-num">${day}</span>`;

        const event = schedulesData[dateKey];
        if (event) {
            dayDiv.classList.add('has-event');
            const tagClass = event.tag === 'gold' ? 'gold-tag' : 'maroon-tag';
            innerContent += `
                <div class="cal-event-pill ${tagClass}">
                    <strong>${event.title}</strong>
                    <small>${event.time || ''}</small>
                </div>
            `;
        }

        dayDiv.innerHTML = innerContent;

        dayDiv.addEventListener('click', () => {
            handleDateCellClick(dateKey, day, monthNames[month], year, event);
        });

        calendarDaysGrid.appendChild(dayDiv);
    }

    // 3. Next Month Padding Days (Muted Shade)
    const totalRendered = firstDayIndex + totalDays;
    const nextDaysNeeded = 7 - (totalRendered % 7);
    if (nextDaysNeeded < 7) {
        for (let j = 1; j <= nextDaysNeeded; j++) {
            const nextMonthDate = new Date(year, month + 1, j);
            const nYear = nextMonthDate.getFullYear();
            const nMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
            const nDay = String(j).padStart(2, '0');
            const dateKey = `${nYear}-${nMonth}-${nDay}`;

            const dayDiv = document.createElement('div');
            dayDiv.className = 'cal-cell next-month-cell';
            dayDiv.innerHTML = `<span class="cal-day-num">${j}</span>`;

            const event = schedulesData[dateKey];
            if (event) {
                dayDiv.classList.add('has-event');
                const tagClass = event.tag === 'gold' ? 'gold-tag' : 'maroon-tag';
                dayDiv.innerHTML += `
                    <div class="cal-event-pill ${tagClass}">
                        <strong>${event.title}</strong>
                        <small>${event.time || ''}</small>
                    </div>
                `;
            }

            dayDiv.addEventListener('click', () => {
                handleDateCellClick(dateKey, j, monthNames[nextMonthDate.getMonth()], nYear, event);
            });

            calendarDaysGrid.appendChild(dayDiv);
        }
    }
}

// ==========================================
// 2. MODAL CLICK HANDLERS
// ==========================================
function handleDateCellClick(dateKey, day, monthName, year, event) {
    selectedDateKey = dateKey;

    if (event) {
        // Open Detail Modal
        if (modalDateTitle) modalDateTitle.textContent = `${monthName} ${day}, ${year}`;
        if (modalEventTitle) modalEventTitle.textContent = event.title;
        if (modalEventDesc) modalEventDesc.textContent = event.desc || 'No additional details provided.';
        if (modalEventTime) modalEventTime.textContent = event.time || 'TBA';

        if (eventDetailBox) eventDetailBox.style.display = 'flex';
        if (noEventState) noEventState.style.display = 'none';
        if (editEventBtn) editEventBtn.style.display = 'inline-flex';
        if (deleteEventBtn) deleteEventBtn.style.display = 'inline-flex';

        eventModal.classList.add('active');
    } else {
        // No event: open Add Rehearsal modal directly with date prefilled
        openCreateModal(dateKey);
    }
}

function openCreateModal(prefillDate = '') {
    if (manageModalTitle) manageModalTitle.textContent = "Add Rehearsal / Event";
    if (eventManageForm) eventManageForm.reset();

    if (eventDateInput) {
        eventDateInput.value = prefillDate || selectedDateKey || new Date().toISOString().split('T')[0];
    }

    eventManageModal.classList.add('active');
}

function openEditModalFromDetail() {
    const event = schedulesData[selectedDateKey];
    if (!event) return;

    eventModal.classList.remove('active');

    if (manageModalTitle) manageModalTitle.textContent = "Edit Rehearsal / Event";
    if (eventDateInput) eventDateInput.value = selectedDateKey;
    if (eventTitleInput) eventTitleInput.value = event.title || '';
    if (eventTimeInput) eventTimeInput.value = event.time || '';
    if (eventTagInput) eventTagInput.value = event.tag || 'maroon';
    if (eventDescInput) eventDescInput.value = event.desc || '';

    eventManageModal.classList.add('active');
}

// ==========================================
// 3. FORM ACTIONS (SAVE & DELETE)
// ==========================================
if (eventManageForm) {
    eventManageForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = eventManageForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        const date = eventDateInput.value;
        const title = eventTitleInput.value.trim();
        const time = eventTimeInput.value.trim();
        const tag = eventTagInput.value;
        const desc = eventDescInput.value.trim();

        const { error } = await saveSchedule(date, title, time, tag, desc);

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Schedule';

        if (error) {
            alert(`Error saving schedule: ${error.message}`);
            return;
        }

        schedulesData = await getSchedules();
        renderCalendar();
        eventManageModal.classList.remove('active');
    });
}

if (deleteEventBtn) {
    deleteEventBtn.addEventListener('click', async () => {
        if (!selectedDateKey) return;
        if (confirm(`Are you sure you want to delete the schedule for ${selectedDateKey}?`)) {
            await deleteSchedule(selectedDateKey);
            schedulesData = await getSchedules();
            renderCalendar();
            eventModal.classList.remove('active');
        }
    });
}

// Navigation & Trigger Listeners
if (openAddEventBtn) {
    openAddEventBtn.addEventListener('click', () => openCreateModal());
}

if (editEventBtn) {
    editEventBtn.addEventListener('click', openEditModalFromDetail);
}

if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
}

if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
}

if (todayBtn) {
    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });
}

// Close Modals
[modalCloseBtn, modalCloseAction].forEach(btn => {
    if (btn) btn.addEventListener('click', () => eventModal.classList.remove('active'));
});

[closeManageModalBtn, cancelManageModalBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', () => eventManageModal.classList.remove('active'));
});

// Close modal when clicking outside background overlay
[eventModal, eventManageModal].forEach(overlay => {
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    }
});

initScheduleMaster();