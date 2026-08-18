import { getCostumes } from './db.js';

let costumesData = [];
const costumesGrid = document.getElementById('costumesGrid');
const searchInput = document.getElementById('costumeSearchInput');
const totalCount = document.getElementById('totalCostumesCount');
const availableCount = document.getElementById('availableCostumesCount');
const borrowedCount = document.getElementById('borrowedCostumesCount');

// Modal Elements
const modal = document.getElementById('costumeModal');
const closeBtn = document.getElementById('modalCloseBtn');
const closeAction = document.getElementById('modalCloseAction');
const modalTitle = document.getElementById('modalCostumeTitle');
const modalTotal = document.getElementById('modalTotalUnits');
const modalAvailable = document.getElementById('modalAvailableUnits');
const modalSuiteBadge = document.getElementById('modalCostumeSuite');

async function loadCostumes() {
    try {
        costumesData = (await getCostumes()) || [];
    } catch (e) {
        console.warn('Could not load costumes:', e);
        costumesData = [];
    }
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

    const cleanFilter = filter.trim().toLowerCase();
    const filtered = costumesData.filter(c => 
        (c.name || '').toLowerCase().includes(cleanFilter) ||
        (c.suite || '').toLowerCase().includes(cleanFilter)
    );

    if (filtered.length === 0) {
        costumesGrid.innerHTML = `
            <div class="empty-vault-state">
                <i class="fa-solid fa-shirt"></i>
                <p>No matching costumes found in vault.</p>
            </div>`;
        updateMetrics();
        return;
    }

    filtered.forEach(c => {
        const totalUnits = parseInt(c.quantity || 0);
        const availUnits = parseInt(c.available || 0);
        const isAvail = availUnits > 0;
        
        const card = document.createElement('div');
        card.className = 'costume-card';
        card.innerHTML = `
            <div class="costume-card-top">
                <div class="costume-avatar">
                    <i class="fa-solid fa-shirt"></i>
                </div>
                <span class="status-badge ${isAvail ? 'available' : 'reserved'}">
                    ${isAvail ? `${availUnits} Available` : 'All In Use'}
                </span>
            </div>
            <div class="costume-card-content">
                <h4>${c.name || 'Unnamed Attire'}</h4>
                <div class="costume-meta-row">
                    <span><i class="fa-solid fa-layer-group"></i> ${totalUnits} Total Units</span>
                    ${c.suite ? `<span>&bull;</span> <span>${c.suite}</span>` : ''}
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            if (modalTitle) modalTitle.textContent = c.name || 'Costume Details';
            if (modalTotal) modalTotal.textContent = `${totalUnits} Total Units`;
            if (modalAvailable) modalAvailable.textContent = `${availUnits} Available Now`;
            if (modalSuiteBadge) modalSuiteBadge.textContent = c.suite || 'Troupe Vault';
            if (modal) modal.classList.add('active');
        });

        costumesGrid.appendChild(card);
    });

    updateMetrics();
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => renderGrid(e.target.value));
}

[closeBtn, closeAction].forEach(b => {
    if (b) b.addEventListener('click', () => modal?.classList.remove('active'));
});

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });
}

loadCostumes();