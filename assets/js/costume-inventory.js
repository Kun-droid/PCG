import { getCostumes } from './db.js';

let costumesData = [];
const costumesGrid = document.getElementById('costumesGrid');
const searchInput = document.getElementById('costumeSearchInput');
const totalCount = document.getElementById('totalCostumesCount');
const availableCount = document.getElementById('availableCostumesCount');
const borrowedCount = document.getElementById('borrowedCostumesCount');

const modal = document.getElementById('costumeModal');
const closeBtn = document.getElementById('modalCloseBtn');
const closeAction = document.getElementById('modalCloseAction');
const modalTitle = document.getElementById('modalCostumeTitle');
const modalTotal = document.getElementById('modalTotalUnits');
const modalAvailable = document.getElementById('modalAvailableUnits');

async function loadCostumes() {
    costumesData = await getCostumes();
    renderGrid(searchInput ? searchInput.value : '');
}

function updateMetrics() {
    let total = 0;
    let available = 0;
    costumesData.forEach(c => {
        total += parseInt(c.quantity || 0);
        available += parseInt(c.available || 0);
    });
    if (totalCount) totalCount.textContent = total;
    if (availableCount) availableCount.textContent = available;
    if (borrowedCount) borrowedCount.textContent = Math.max(0, total - available);
}

function renderGrid(filter = '') {
    if (!costumesGrid) return;
    costumesGrid.innerHTML = '';

    const filtered = costumesData.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
    if (filtered.length === 0) {
        costumesGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 24px; color: var(--text-muted);">No matching costumes found in vault.</p>`;
        updateMetrics();
        return;
    }

    filtered.forEach(c => {
        const isAvail = c.available > 0;
        const card = document.createElement('div');
        card.className = 'costume-card';
        card.innerHTML = `
            <div class="costume-card-top">
                <div class="costume-avatar"><i class="fa-solid fa-shirt"></i></div>
                <span class="status-badge ${isAvail ? 'available' : 'reserved'}">${isAvail ? `${c.available} Available` : 'All in Use'}</span>
            </div>
            <div class="costume-card-content">
                <h4>${c.name}</h4>
                <div class="costume-meta-row">
                    <span><i class="fa-solid fa-layer-group"></i> ${c.quantity} Total</span>
                </div>
            </div>
        `;
        card.addEventListener('click', () => {
            if (modalTitle) modalTitle.textContent = c.name;
            if (modalTotal) modalTotal.textContent = `${c.quantity} Total Units`;
            if (modalAvailable) modalAvailable.textContent = `${c.available} Available Now`;
            if (modal) modal.classList.add('active');
        });
        costumesGrid.appendChild(card);
    });

    updateMetrics();
}

if (searchInput) searchInput.addEventListener('input', (e) => renderGrid(e.target.value));
[closeBtn, closeAction].forEach(b => b?.addEventListener('click', () => modal?.classList.remove('active')));

loadCostumes();