import { getSchedules, saveSchedule, deleteSchedule } from './db.js';

let eventsData = {};
const today = new Date();
let currentNavDate = new Date();
let isYearPickerOpen = false;
let selectedDateKey = null;

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// DOM References[cite: 21]
const monthYearLabel = document.getElementById('currentMonthYear');
const badgeLabel = document.getElementById('calendarBadge');
const daysGrid = document.getElementById('calendarDaysGrid');
const weekdaysHeader = document.getElementById('calendarWeekdays');
const yearsPickerGrid = document.getElementById('yearsPickerGrid');
const yearSelectorBtn = document.getElementById('yearSelectorBtn');

const prevBtn = document.getElementById('prevMonthBtn');
const nextBtn = document.getElementById('nextMonthBtn');
const todayBtn = document.getElementById('todayBtn');

// Modal Elements[cite: 21]
const modal = document.getElementById('eventModal');
const closeBtn = document.getElementById('modalCloseBtn');
const closeAction = document.getElementById('modalCloseAction');
const modalDateTitle = document.getElementById('modalDateTitle');
const eventBox = document.getElementById('eventDetailBox');
const noEventBox = document.getElementById('noEventState');
const eventTitle = document.getElementById('modalEventTitle');
const eventDesc = document.getElementById('modalEventDesc');
const eventTime = document.getElementById('modalEventTime');
const editEventBtn = document.getElementById('editEventBtn');
const deleteEventBtn = document.getElementById('deleteEventBtn');

const eventManageModal = document.getElementById('eventManageModal');
const openAddEventBtn = document.getElementById('openAddEventBtn');
const closeManageModalBtn = document.getElementById('closeManageModalBtn');
const cancelManageModalBtn = document.getElementById('cancelManageModalBtn');
const eventManageForm = document.getElementById('eventManageForm');
const manageModalTitle = document.getElementById('manageModalTitle');
const eventDateInput = document.getElementById('eventDateInput');
const eventTitleInput = document.getElementById('eventTitleInput');
const eventTimeInput = document.getElementById('eventTimeInput');
const eventTagInput = document.getElementById('eventTagInput');
const eventDescInput = document.getElementById('eventDescInput');

async function loadSchedules() {
    eventsData = await getSchedules();
    renderCalendar();
}

function renderCalendar() {
    const year = currentNavDate.getFullYear();
    const month = currentNavDate.getMonth();

    if (monthYearLabel) monthYearLabel.textContent = `${monthNames[month]} ${year}`;

    const isCurrentMonth = (year === today.getFullYear() && month === today.getMonth());
    if (badgeLabel) badgeLabel.textContent = isCurrentMonth ? "Current Month" : `${year}`;

    if (!daysGrid) return;
    daysGrid.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    for (let i = firstDayIndex; i > 0; i--) {
        const dayNum = prevMonthTotalDays - i + 1;
        const cell = document.createElement('div');
        cell.className = 'cal-cell inactive';
        cell.innerHTML = `<span class="cell-num">${dayNum}</span>`;
        daysGrid.appendChild(cell);
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell';

        const formattedMonth = String(month + 1).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');
        const dateKey = `${year}-${formattedMonth}-${formattedDay}`;

        const isToday = (isCurrentMonth && day === today.getDate());
        if (isToday) cell.classList.add('today');

        const event = eventsData[dateKey];
        let tagHTML = '';

        if (event) {
            cell.classList.add('has-event');
            const tagColor = isToday ? 'white' : (event.tag || 'maroon');
            tagHTML = `<span class="cal-tag ${tagColor}">${event.title}</span>`;
        } else if (isToday) {
            tagHTML = `<span class="cal-tag white">Today</span>`;
        }

        cell.innerHTML = `<span class="cell-num">${day}</span>${tagHTML}`;
        cell.addEventListener('click', () => openDetailModal(dateKey, `${monthNames[month]} ${day}, ${year}`));
        daysGrid.appendChild(cell);
    }

    const totalRenderedSlots = firstDayIndex + totalDaysInMonth;
    const remainingSlots = (totalRenderedSlots % 7 === 0) ? 0 : (7 - (totalRenderedSlots % 7));

    for (let nextDay = 1; nextDay <= remainingSlots; nextDay++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell inactive';
        cell.innerHTML = `<span class="cell-num">${nextDay}</span>`;
        daysGrid.appendChild(cell);
    }
}

function openDetailModal(dateKey, readableDate) {
    selectedDateKey = dateKey;
    if (modalDateTitle) modalDateTitle.textContent = readableDate;

    const event = eventsData[dateKey];
    if (event) {
        eventTitle.textContent = event.title;
        eventDesc.textContent = event.desc || 'No additional details provided.';
        eventTime.textContent = event.time || 'Schedule TBA';
        eventBox.style.display = 'flex';
        noEventBox.style.display = 'none';
        if (editEventBtn) editEventBtn.style.display = 'inline-flex';
        if (deleteEventBtn) deleteEventBtn.style.display = 'inline-flex';
    } else {
        eventBox.style.display = 'none';
        noEventBox.style.display = 'block';
        if (editEventBtn) editEventBtn.style.display = 'none';
        if (deleteEventBtn) deleteEventBtn.style.display = 'none';
    }

    if (modal) modal.classList.add('active');
}

function closeDetailModal() {
    if (modal) modal.classList.remove('active');
}

if (deleteEventBtn) {
    deleteEventBtn.addEventListener('click', async () => {
        if (selectedDateKey) {
            await deleteSchedule(selectedDateKey);
            await loadSchedules();
            closeDetailModal();
        }
    });
}

if (editEventBtn) {
    editEventBtn.addEventListener('click', () => {
        const event = eventsData[selectedDateKey];
        if (event) {
            manageModalTitle.textContent = "Edit Scheduled Event";
            eventDateInput.value = selectedDateKey;
            eventTitleInput.value = event.title;
            eventTimeInput.value = event.time;
            eventTagInput.value = event.tag || 'maroon';
            eventDescInput.value = event.desc || '';
            closeDetailModal();
            eventManageModal.classList.add('active');
        }
    });
}

if (openAddEventBtn) {
    openAddEventBtn.addEventListener('click', () => {
        manageModalTitle.textContent = "Add Rehearsal / Event";
        eventManageForm.reset();
        eventDateInput.value = new Date().toISOString().split('T')[0];
        eventManageModal.classList.add('active');
    });
}

if (eventManageForm) {
    eventManageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const date = eventDateInput.value;
        const title = eventTitleInput.value.trim();
        const time = eventTimeInput.value.trim();
        const tag = eventTagInput.value;
        const desc = eventDescInput.value.trim();

        await saveSchedule(date, title, time, tag, desc);
        await loadSchedules();
        eventManageModal.classList.remove('active');
    });
}

function toggleYearPicker() {
    isYearPickerOpen = !isYearPickerOpen;
    if (isYearPickerOpen) {
        yearsPickerGrid.innerHTML = '';
        const currentYear = currentNavDate.getFullYear();
        for (let yr = currentYear - 6; yr <= currentYear + 5; yr++) {
            const btn = document.createElement('button');
            btn.className = `year-pick-btn ${yr === currentYear ? 'active' : ''}`;
            btn.textContent = yr;
            btn.addEventListener('click', () => {
                currentNavDate.setFullYear(yr);
                closeYearPicker();
            });
            yearsPickerGrid.appendChild(btn);
        }
        weekdaysHeader.style.display = 'none';
        daysGrid.style.display = 'none';
        yearsPickerGrid.style.display = 'grid';
        yearSelectorBtn.classList.add('active');
    } else {
        closeYearPicker();
    }
}

function closeYearPicker() {
    isYearPickerOpen = false;
    weekdaysHeader.style.display = 'grid';
    daysGrid.style.display = 'grid';
    yearsPickerGrid.style.display = 'none';
    yearSelectorBtn.classList.remove('active');
    renderCalendar();
}

if (yearSelectorBtn) yearSelectorBtn.addEventListener('click', toggleYearPicker);

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        currentNavDate.setMonth(currentNavDate.getMonth() - 1);
        renderCalendar();
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        currentNavDate.setMonth(currentNavDate.getMonth() + 1);
        renderCalendar();
    });
}

if (todayBtn) {
    todayBtn.addEventListener('click', () => {
        currentNavDate = new Date();
        renderCalendar();
    });
}

[closeBtn, closeAction].forEach(btn => {
    if (btn) btn.addEventListener('click', closeDetailModal);
});

[closeManageModalBtn, cancelManageModalBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', () => eventManageModal.classList.remove('active'));
});

loadSchedules();