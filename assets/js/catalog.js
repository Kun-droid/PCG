// ==========================================================================
// PANAYANA COSTUME CATALOG (SUPABASE CONNECTED)
// ==========================================================================

import { getCostumes, addCostume, updateCostume, deleteCostume, checkoutCostume, returnCostume } from './db.js';

let costumesData = [];
const session = JSON.parse(localStorage.getItem('panayana_auth_user') || '{}');
const isAdmin = session.isLoggedIn && session.role === 'admin';

const costumesGrid = document.getElementById('costumesGrid');
const searchInput = document.getElementById('costumeSearchInput');
const totalCostumesCount = document.getElementById('totalCostumesCount');
const availableCostumesCount = document.getElementById('availableCostumesCount');
const borrowedCostumesCount = document.getElementById('borrowedCostumesCount');

const addCostumeModal = document.getElementById('addCostumeModal');
const openAddCostumeBtn = document.getElementById('openAddCostumeBtn');
const closeAddCostumeBtn = document.getElementById('closeAddCostumeBtn');
const cancelAddCostumeBtn = document.getElementById('cancelAddCostumeBtn');
const costumeManageForm = document.getElementById('costumeManageForm');
const addCostumeModalTitle = document.getElementById('addCostumeModalTitle');

const qrScannerModal = document.getElementById('qrScannerModal');
const openInventoryScannerBtn = document.getElementById('openInventoryScannerBtn');
const closeQrScannerBtn = document.getElementById('closeQrScannerBtn');
const simBorrowBtn = document.getElementById('simBorrowBtn');
const simReturnBtn = document.getElementById('simReturnBtn');
const scannerFeedback = document.getElementById('scannerFeedback');

let activeEditId = null;

export async function loadCostumes() {
    costumesData = await getCostumes();
    renderCostumesGrid(searchInput ? searchInput.value : '');
}

function updateMetrics() {
    let total = 0;
    let available = 0;

    costumesData.forEach(c => {
        total += parseInt(c.quantity || 0);
        available += parseInt(c.available || 0);
    });

    if (totalCostumesCount) totalCostumesCount.textContent = total;
    if (availableCostumesCount) availableCostumesCount.textContent = available;
    if (borrowedCostumesCount) borrowedCostumesCount.textContent = Math.max(0, total - available);
}

function renderCostumesGrid(filterText = '') {
    if (!costumesGrid) return;
    costumesGrid.innerHTML = '';

    const filtered = costumesData.filter(item => 
        item.name.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filtered.length === 0) {
        costumesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 30px; color: var(--text-muted);">
                <i class="fa-solid fa-shirt" style="font-size:28px; margin-bottom:6px; display:block;"></i>
                No matching costumes found in vault.
            </div>
        `;
        updateMetrics();
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'costume-card';
        const isAvailable = item.available > 0;

        card.innerHTML = `
            <div class="costume-card-info">
                <div class="costume-icon-badge">
                    <i class="fa-solid fa-shirt"></i>
                </div>
                <h4>${item.name}</h4>
            </div>

            <div class="costume-card-qty-group">
                <div class="costume-qty-badge">
                    <span class="qty-number">${item.available} / ${item.quantity}</span>
                    <span class="qty-status ${isAvailable ? 'available' : 'unavailable'}">
                        ${isAvailable ? 'Available' : 'All in Use'}
                    </span>
                </div>
                <div class="costume-card-actions">
                    <button type="button" class="edit-costume-btn" data-id="${item.id}" title="Edit Costume">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button type="button" class="delete-costume-btn" data-id="${item.id}" title="Remove Costume">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;

        // Edit Handler
        card.querySelector('.edit-costume-btn').addEventListener('click', () => openEditModal(item));

        // Delete Handler
        card.querySelector('.delete-costume-btn').addEventListener('click', async () => {
            const confirmed = confirm(`Are you sure you want to delete "${item.name}" from inventory?`);
            if (!confirmed) return;

            try {
                if (typeof deleteCostume === 'function') {
                    await deleteCostume(item.id);
                }
                await loadCostumes();
            } catch (err) {
                console.error('Failed to remove costume:', err);
                alert(`Could not remove costume: ${err.message}`);
            }
        });

        costumesGrid.appendChild(card);
    });

    updateMetrics();
}

function openEditModal(costume) {
    activeEditId = costume.id;
    addCostumeModalTitle.textContent = "Edit Costume";
    document.getElementById('newCostumeName').value = costume.name;
    document.getElementById('newCostumeQuantity').value = costume.quantity;
    addCostumeModal.classList.add('active');
}

if (openAddCostumeBtn) {
    openAddCostumeBtn.addEventListener('click', () => {
        activeEditId = null;
        addCostumeModalTitle.textContent = "Add New Costume";
        costumeManageForm.reset();
        addCostumeModal.classList.add('active');
    });
}

if (costumeManageForm) {
    costumeManageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('newCostumeName').value.trim();
        const quantity = parseInt(document.getElementById('newCostumeQuantity').value);

        if (activeEditId) {
            await updateCostume(activeEditId, name, quantity);
        } else {
            await addCostume(name, quantity);
        }

        await loadCostumes();
        addCostumeModal.classList.remove('active');
    });
}

if (openInventoryScannerBtn && qrScannerModal) {
    openInventoryScannerBtn.addEventListener('click', () => {
        scannerFeedback.style.display = 'none';
        qrScannerModal.classList.add('active');
    });
}

if (simBorrowBtn) {
    simBorrowBtn.addEventListener('click', async () => {
        const item = costumesData[0];
        if (item && item.available > 0) {
            await checkoutCostume('2026-0012', 'Kirk Johnray', item.id, item.name, 'Attire Unit');
            await loadCostumes();
            scannerFeedback.style.display = 'block';
            scannerFeedback.className = 'scanner-feedback-box success';
            scannerFeedback.innerHTML = `<i class="fa-solid fa-check"></i> Issued 1x <b>${item.name}</b>`;
        }
    });
}

if (simReturnBtn) {
    simReturnBtn.addEventListener('click', async () => {
        const item = costumesData[0];
        if (item) {
            await returnCostume(null, item.id);
            await loadCostumes();
            scannerFeedback.style.display = 'block';
            scannerFeedback.className = 'scanner-feedback-box success';
            scannerFeedback.innerHTML = `<i class="fa-solid fa-rotate-left"></i> Returned 1x <b>${item.name}</b>`;
        }
    });
}

[closeAddCostumeBtn, cancelAddCostumeBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', () => addCostumeModal.classList.remove('active'));
});

if (closeQrScannerBtn && qrScannerModal) {
    closeQrScannerBtn.addEventListener('click', () => qrScannerModal.classList.remove('active'));
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => renderCostumesGrid(e.target.value));
}

loadCostumes();