// ==========================================================================
// PANAYANA READ-ONLY EVENT CALENDAR ENGINE (WITH YEAR PICKER)
// ==========================================================================

const eventsData = {
    // "2026-08-04": { title: "Singkil Rehearsal", desc: "Blocking & Spacing at Main Theater.", time: "4:00 PM – 7:00 PM", tag: "gold" },
    // "2026-08-12": { title: "Rondalla Practice", desc: "Instrumental synchronization & tempo calibration.", time: "5:00 PM – 8:00 PM", tag: "maroon" },
    // "2026-08-15": { title: "Annual Cultural Night", desc: "Grand showcase in the Main Theater Auditorium.", time: "4:00 PM – 7:30 PM", tag: "maroon" },
    // "2026-08-21": { title: "Costume Fitting", desc: "Fitting for Maria Clara & Cordillera suites.", time: "1:00 PM – 4:00 PM", tag: "gold" },
    // "2026-08-28": { title: "Gala Night Showcase", desc: "Formal dinner performance and cultural tribute.", time: "6:00 PM – 9:30 PM", tag: "maroon" },
    // "2026-09-08": { title: "Repertoire Walkthrough", desc: "Complete rundown with live musical ensemble.", time: "3:30 PM – 6:30 PM", tag: "gold" }
};

const today = new Date();
let currentNavDate = new Date();
let isYearPickerOpen = false;

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// DOM References
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

// ==========================================
// CALENDAR RENDERER
// ==========================================
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

    // Previous Month Inactive Days
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

        const event = eventsData[dateKey];
        let tagHTML = '';

        if (event) {
            cell.classList.add('has-event');
            const tagColor = isToday ? 'white' : (event.tag || 'maroon');
            tagHTML = `<span class="cal-tag ${tagColor}">${event.title}</span>`;
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

    // Next Month Inactive Days
    const totalRenderedSlots = firstDayIndex + totalDaysInMonth;
    const remainingSlots = (totalRenderedSlots % 7 === 0) ? 0 : (7 - (totalRenderedSlots % 7));

    for (let nextDay = 1; nextDay <= remainingSlots; nextDay++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell inactive';
        cell.innerHTML = `<span class="cell-num">${nextDay}</span>`;
        daysGrid.appendChild(cell);
    }
}

// ==========================================
// YEAR PICKER COMPONENT
// ==========================================
function toggleYearPicker() {
    isYearPickerOpen = !isYearPickerOpen;

    if (isYearPickerOpen) {
        renderYearPicker();
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

function renderYearPicker() {
    yearsPickerGrid.innerHTML = '';
    const currentYear = currentNavDate.getFullYear();
    const startYear = currentYear - 6;
    const endYear = currentYear + 5;

    for (let yr = startYear; yr <= endYear; yr++) {
        const yearCard = document.createElement('button');
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
// READ-ONLY MODAL CONTROLLER
// ==========================================
function openModal(dateKey, readableDate) {
    if (modalDateTitle) modalDateTitle.textContent = readableDate;

    const event = eventsData[dateKey];

    if (event) {
        eventTitle.textContent = event.title;
        eventDesc.textContent = event.desc || 'No additional details provided.';
        eventTime.textContent = event.time || 'Schedule TBA';
        eventBox.style.display = 'flex';
        noEventBox.style.display = 'none';
    } else {
        eventBox.style.display = 'none';
        noEventBox.style.display = 'block';
    }

    if (modal) modal.classList.add('active');
}

function closeModal() {
    if (modal) modal.classList.remove('active');
}

// Year Picker Listener
if (yearSelectorBtn) {
    yearSelectorBtn.addEventListener('click', toggleYearPicker);
}

// Month Navigation Listeners
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

// Modal Dismiss Listeners
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (closeAction) closeAction.addEventListener('click', closeModal);
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// Initialize View
renderCalendar();