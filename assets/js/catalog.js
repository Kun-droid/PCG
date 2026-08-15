// ==========================================================================
// PANAYANA COSTUME INVENTORY (NAME & QUANTITY ONLY) CONTROLLER
// ==========================================================================

let costumesData = [
    { id: "CST-01", name: "Maria Clara Formal Ensemble", quantity: 18, available: 14 },
    { id: "CST-02", name: "Singkil Princess Regal Attire", quantity: 10, available: 8 },
    { id: "CST-03", name: "Singkil Prince & Warriors Set", quantity: 14, available: 10 },
    { id: "CST-04", name: "Cordillera Tadek / Bendian Set", quantity: 12, available: 10 },
    { id: "CST-05", name: "Rural Tinikling / Balitaw Costumes", quantity: 14, available: 12 }
];

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

function updateMetrics() {
    let total = 0;
    let available = 0;

    costumesData.forEach(c => {
        total += parseInt(c.quantity);
        available += parseInt(c.available);
    });

    if (totalCostumesCount) totalCostumesCount.textContent = total;
    if (availableCostumesCount) availableCostumesCount.textContent = available;
    if (borrowedCostumesCount) borrowedCostumesCount.textContent = total - available;
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
                No matching costumes found.
            </div>
        `;
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
                ${isAdmin ? `
                    <button class="edit-costume-btn" data-id="${item.id}" title="Edit Costume">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                ` : ''}
            </div>
        `;

        if (isAdmin) {
            card.querySelector('.edit-costume-btn').addEventListener('click', () => openEditModal(item));
        }

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
    costumeManageForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('newCostumeName').value.trim();
        const quantity = parseInt(document.getElementById('newCostumeQuantity').value);

        if (activeEditId) {
            const costume = costumesData.find(c => c.id === activeEditId);
            if (costume) {
                costume.name = name;
                costume.quantity = quantity;
                if (costume.available > quantity) {
                    costume.available = quantity;
                }
            }
        } else {
            const newCostume = {
                id: `CST-${Date.now().toString().slice(-3)}`,
                name: name,
                quantity: quantity,
                available: quantity
            };
            costumesData.unshift(newCostume);
        }

        renderCostumesGrid(searchInput ? searchInput.value : '');
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
    simBorrowBtn.addEventListener('click', () => {
        const item = costumesData[0];
        if (item && item.available > 0) {
            item.available -= 1;
            renderCostumesGrid();
            scannerFeedback.style.display = 'block';
            scannerFeedback.className = 'scanner-feedback-box success';
            scannerFeedback.innerHTML = `<i class="fa-solid fa-check"></i> Issued 1x <b>${item.name}</b>`;
        }
    });
}

if (simReturnBtn) {
    simReturnBtn.addEventListener('click', () => {
        const item = costumesData[0];
        if (item && item.available < item.quantity) {
            item.available += 1;
            renderCostumesGrid();
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
    searchInput.addEventListener('input', (e) => {
        renderCostumesGrid(e.target.value);
    });
}

renderCostumesGrid();