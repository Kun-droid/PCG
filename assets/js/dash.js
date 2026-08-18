import { getCostumes, getSchedules } from './db.js';

const dashTotalCostumes = document.getElementById('dashTotalCostumes');
const dashAvailableCostumes = document.getElementById('dashAvailableCostumes');
const dashTotalEvents = document.getElementById('dashTotalEvents');
const dashCostumeList = document.getElementById('dashCostumeList');
const dashScheduleList = document.getElementById('dashScheduleList');

// Banner DOM references
const bannerEventTag = document.getElementById('bannerEventTag');
const bannerEventTitle = document.getElementById('bannerEventTitle');
const bannerEventTime = document.getElementById('bannerEventTime');
const bannerEventLocation = document.getElementById('bannerEventLocation');
const bannerWidgetMonth = document.getElementById('bannerWidgetMonth');
const bannerWidgetDay = document.getElementById('bannerWidgetDay');

export async function initDashboard() {
    const [costumes, schedules] = await Promise.all([
        getCostumes().catch(() => []),
        getSchedules().catch(() => ({}))
    ]);

    // 1. Costume Metrics
    let total = 0;
    let available = 0;
    (costumes || []).forEach(c => {
        total += parseInt(c.quantity || 0, 10);
        available += parseInt(c.available || 0, 10);
    });

    if (dashTotalCostumes) dashTotalCostumes.textContent = total;
    if (dashAvailableCostumes) dashAvailableCostumes.textContent = available;

    // 2. Costume Availability Quick-List
    if (dashCostumeList) {
        if (!costumes || costumes.length === 0) {
            dashCostumeList.innerHTML = `<div class="empty-list-state"><i class="fa-solid fa-box-open"></i><p>No costumes found in storage.</p></div>`;
        } else {
            dashCostumeList.innerHTML = costumes.slice(0, 3).map(c => `
                <div class="list-card">
                    <div class="list-thumb"><i class="fa-solid fa-shirt"></i></div>
                    <div class="list-info">
                        <h4>${c.name}</h4>
                        <p>${c.available} Available &bull; ${c.quantity} Total Units</p>
                    </div>
                    <span class="status-badge ${parseInt(c.available, 10) > 0 ? 'available' : 'reserved'}">
                        ${parseInt(c.available, 10) > 0 ? 'Ready' : 'In Use'}
                    </span>
                </div>
            `).join('');
        }
    }

    // 3. Dynamic Banner & Upcoming Rehearsals
    const scheduleKeys = Object.keys(schedules || {}).sort();
    if (dashTotalEvents) dashTotalEvents.textContent = scheduleKeys.length;

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingKey = scheduleKeys.find(key => key >= todayStr) || scheduleKeys[0];

    if (upcomingKey && schedules[upcomingKey]) {
        const nextEvent = schedules[upcomingKey];
        if (bannerEventTitle) bannerEventTitle.textContent = nextEvent.title || 'General Troupe Rehearsal';
        if (bannerEventTime) bannerEventTime.textContent = nextEvent.time || 'Schedule TBA';
        if (bannerEventLocation) bannerEventLocation.textContent = nextEvent.desc || 'Main Theater Auditorium';
        if (bannerEventTag) bannerEventTag.textContent = nextEvent.tag === 'gold' ? 'Workshop / Rehearsal' : 'Upcoming Rehearsal';
        
        const [yr, mo, dy] = upcomingKey.split('-');
        const dateObj = new Date(yr, parseInt(mo, 10) - 1, dy);
        const mShort = !isNaN(dateObj) ? dateObj.toLocaleString('default', { month: 'short' }).toUpperCase() : 'AUG';
        if (bannerWidgetMonth) bannerWidgetMonth.textContent = `${mShort} ${yr}`;
        if (bannerWidgetDay) bannerWidgetDay.textContent = parseInt(dy, 10);
    } else {
        if (bannerEventTitle) bannerEventTitle.textContent = 'No Upcoming Rehearsals';
        if (bannerEventTime) bannerEventTime.textContent = 'Standby for announcements';
        if (bannerEventLocation) bannerEventLocation.textContent = 'TBA';
        if (bannerEventTag) bannerEventTag.textContent = 'Schedule Standby';
        if (bannerWidgetMonth) bannerWidgetMonth.textContent = 'STANDBY';
        if (bannerWidgetDay) bannerWidgetDay.textContent = '--';
    }

    // 4. Quick Schedule List
    if (dashScheduleList) {
        if (scheduleKeys.length === 0) {
            dashScheduleList.innerHTML = `<div class="empty-list-state"><i class="fa-regular fa-calendar-check"></i><p>No upcoming rehearsals posted.</p></div>`;
        } else {
            dashScheduleList.innerHTML = scheduleKeys.slice(0, 3).map(dateKey => {
                const item = schedules[dateKey];
                const dateObj = new Date(dateKey);
                const monthName = !isNaN(dateObj) ? dateObj.toLocaleString('default', { month: 'short' }) : 'AUG';
                const dayNum = !isNaN(dateObj) ? dateObj.getDate() : dateKey.split('-')[2] || '1';

                return `
                    <div class="schedule-item">
                        <div class="schedule-date-badge">
                            <span class="badge-month">${monthName}</span>
                            <strong class="badge-day">${dayNum}</strong>
                        </div>
                        <div class="schedule-details">
                            <strong>${item.title || 'Rehearsal'}</strong>
                            <span><i class="fa-regular fa-clock"></i> ${item.time || 'TBA'} &bull; <i class="fa-solid fa-location-dot"></i> ${item.desc || 'Main Stage'}</span>
                        </div>
                        <span class="schedule-tag ${item.tag || 'maroon'}">${item.tag === 'gold' ? 'Workshop' : 'Live Show'}</span>
                    </div>
                `;
            }).join('');
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}