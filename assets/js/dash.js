import { getCostumes, getSchedules } from './db.js';

const user = JSON.parse(localStorage.getItem('panayana_auth_user') || '{}');
const headerUserName = document.getElementById('headerUserName');
const headerUserDesignation = document.getElementById('headerUserDesignation');
const dashTotalCostumes = document.getElementById('dashTotalCostumes');
const dashAvailableCostumes = document.getElementById('dashAvailableCostumes');
const dashTotalEvents = document.getElementById('dashTotalEvents');
const dashCostumeList = document.getElementById('dashCostumeList');
const dashScheduleList = document.getElementById('dashScheduleList');

// Set logged-in member details in header
if (headerUserName && user.name) headerUserName.textContent = user.name;
if (headerUserDesignation && user.designation) headerUserDesignation.textContent = user.designation;

export async function initDashboard() {
    const [costumes, schedules] = await Promise.all([getCostumes(), getSchedules()]);

    // 1. Calculate and render costume metrics
    let total = 0;
    let available = 0;
    costumes.forEach(c => {
        total += parseInt(c.quantity || 0);
        available += parseInt(c.available || 0);
    });

    if (dashTotalCostumes) dashTotalCostumes.textContent = total;
    if (dashAvailableCostumes) dashAvailableCostumes.textContent = available;

    // 2. Populate quick costume availability list
    if (dashCostumeList) {
        if (costumes.length === 0) {
            dashCostumeList.innerHTML = `<p style="padding: 16px; color: var(--text-muted);">No costumes found in storage.</p>`;
        } else {
            dashCostumeList.innerHTML = costumes.slice(0, 3).map(c => `
                <div class="list-card">
                    <div class="list-thumb"><i class="fa-solid fa-shirt"></i></div>
                    <div class="list-info">
                        <h4>${c.name}</h4>
                        <p>${c.available} Available &bull; ${c.quantity} Total Units</p>
                    </div>
                    <span class="status-badge ${c.available > 0 ? 'available' : 'reserved'}">
                        ${c.available > 0 ? 'Ready' : 'In Use'}
                    </span>
                </div>
            `).join('');
        }
    }

    // 3. Calculate and render schedule entries
    const scheduleKeys = Object.keys(schedules);
    if (dashTotalEvents) dashTotalEvents.textContent = scheduleKeys.length;

    if (dashScheduleList) {
        if (scheduleKeys.length === 0) {
            dashScheduleList.innerHTML = `<p style="padding: 16px; color: var(--text-muted);">No upcoming rehearsals posted.</p>`;
        } else {
            dashScheduleList.innerHTML = scheduleKeys.slice(0, 3).map(dateKey => `
                <div class="schedule-item">
                    <div class="schedule-time">${schedules[dateKey].time}</div>
                    <div class="schedule-divider"></div>
                    <div class="schedule-details">
                        <strong>${schedules[dateKey].title}</strong>
                        <span>${dateKey} &bull; ${schedules[dateKey].desc || 'Main Auditorium'}</span>
                    </div>
                </div>
            `).join('');
        }
    }
}

initDashboard();