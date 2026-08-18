// ==========================================================================
// PANAYANA ADMIN DISPATCH & WORKSTATION CONTROLLER
// ==========================================================================

import { 
    getActiveLoans, 
    checkActiveLoanByStudentId, 
    checkoutCostume, 
    returnCostume, 
    getCostumes, 
    getSchedules,
    getTotalMembersCount 
} from './db.js';

const tbody = document.getElementById('adminRegistryTbody');
const searchInput = document.getElementById('registrySearchInput');
const form = document.getElementById('adminDispatchForm');
const studentIdInput = document.getElementById('dispatchStudentId');
const memberNameInput = document.getElementById('dispatchMemberName');
const costumeSelectGroup = document.getElementById('costumeSelectGroup');
const costumeSelect = document.getElementById('dispatchCostumeSelect');
const submitBtn = document.getElementById('dispatchSubmitBtn');
const scanStatusBanner = document.getElementById('scanStatusBanner');

const totalMembersCount = document.getElementById('totalMembersCount');
const totalSchedulesCount = document.getElementById('totalSchedulesCount');
const totalCostumesCount = document.getElementById('totalCostumesCount');

// Scanner Modal DOM
const openMobileScannerBtn = document.getElementById('openMobileScannerBtn');
const mobileScannerModal = document.getElementById('mobileScannerModal');
const closeMobileScannerBtn = document.getElementById('closeMobileScannerBtn');
const simulateScanNewBtn = document.getElementById('simulateScanNewBtn');
const simulateScanReturnBtn = document.getElementById('simulateScanReturnBtn');

let activeLoans = [];
let availableCostumes = [];
let html5QrCodeScanner = null;

// ==========================================
// 1. INITIALIZATION & SUMMARY
// ==========================================
export async function initAdminDashboard() {
    await Promise.all([loadRegistry(), loadCostumeOptions(), loadKPISummary()]);
}

async function loadKPISummary() {
    const [costumes, schedules, membersCount] = await Promise.all([
        getCostumes(), 
        getSchedules(),
        getTotalMembersCount()
    ]);
    
    let totalQty = 0;
    costumes.forEach(c => totalQty += parseInt(c.quantity || 0));
    
    if (totalCostumesCount) totalCostumesCount.textContent = totalQty;
    if (totalSchedulesCount) totalSchedulesCount.textContent = Object.keys(schedules).length;
    if (totalMembersCount) totalMembersCount.textContent = membersCount;
}

async function loadCostumeOptions() {
    if (!costumeSelect) return;
    availableCostumes = await getCostumes();
    
    costumeSelect.innerHTML = `<option value="" disabled selected>Select costume unit to issue...</option>`;
    availableCostumes.forEach(c => {
        if (c.available > 0) {
            costumeSelect.innerHTML += `<option value="${c.id}|${c.name}">${c.name} (${c.available} in storage)</option>`;
        }
    });
}

// ==========================================
// 2. REGISTRY & DISPATCH TABLE
// ==========================================
async function loadRegistry() {
    activeLoans = await getActiveLoans();
    renderRegistry(searchInput ? searchInput.value : '');
}

function renderRegistry(filter = '') {
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = activeLoans.filter(item => 
        item.borrower_name.toLowerCase().includes(filter.toLowerCase()) ||
        item.student_id.toLowerCase().includes(filter.toLowerCase()) ||
        item.costume_name.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="table-empty-state"><i class="fa-regular fa-folder-open"></i><p>No active costume loans found.</p></td></tr>`;
        return;
    }

    filtered.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.borrower_name}</strong><br><code style="font-size:11px; color: var(--text-muted);">${item.student_id}</code></td>
            <td><span>${item.costume_name}</span><br><small style="color: var(--sunset-gold, #e29532); font-weight: 700;">${item.suite || 'Attire Unit'}</small></td>
            <td>${item.issued_date}</td>
            <td class="text-right">
                <button type="button" class="quick-return-btn" data-id="${item.id}" data-costume="${item.costume_id}">
                    <i class="fa-solid fa-rotate-left"></i> Return
                </button>
            </td>
        `;
        
        tr.querySelector('.quick-return-btn').addEventListener('click', async () => {
            await returnCostume(item.id, item.costume_id);
            await initAdminDashboard();
        });
        
        tbody.appendChild(tr);
    });
}

// ==========================================
// 3. STUDENT LOOKUP & DISPATCH/RETURN MODES
// ==========================================
if (studentIdInput) {
    studentIdInput.addEventListener('input', async (e) => {
        const val = e.target.value.trim();
        if (val.length >= 3) {
            const activeLoan = await checkActiveLoanByStudentId(val);
            if (activeLoan) {
                memberNameInput.value = activeLoan.borrower_name;
                costumeSelectGroup.style.display = 'none';
                costumeSelect.removeAttribute('required');
                
                scanStatusBanner.style.display = 'flex';
                scanStatusBanner.className = 'scan-status-alert return-alert';
                scanStatusBanner.innerHTML = `
                    <i class="fa-solid fa-rotate-left"></i>
                    <div>
                        <strong>Active Loan Detected</strong>
                        <p>Checked out: <b>${activeLoan.costume_name}</b> on ${activeLoan.issued_date}</p>
                    </div>
                `;
                
                submitBtn.className = 'admin-action-btn return-mode-btn';
                submitBtn.innerHTML = '<i class="fa-solid fa-check-double"></i> Complete Costume Return';
                submitBtn.dataset.mode = 'return';
                submitBtn.dataset.loanId = activeLoan.id;
                submitBtn.dataset.costumeId = activeLoan.costume_id;
            } else {
                resetForm();
            }
        } else {
            resetForm();
        }
    });
}

function resetForm() {
    costumeSelectGroup.style.display = 'flex';
    costumeSelect.setAttribute('required', 'true');
    scanStatusBanner.style.display = 'none';
    submitBtn.className = 'admin-action-btn';
    submitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-arrow-left"></i> Confirm Costume Checkout';
    submitBtn.dataset.mode = 'checkout';
}

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mode = submitBtn.dataset.mode;

        if (mode === 'return') {
            await returnCostume(submitBtn.dataset.loanId, submitBtn.dataset.costumeId);
        } else {
            const [cId, cName] = costumeSelect.value.split('|');
            await checkoutCostume(
                studentIdInput.value.trim(), 
                memberNameInput.value.trim(), 
                cId, 
                cName, 
                'Attire Unit'
            );
        }

        form.reset();
        resetForm();
        await initAdminDashboard();
    });
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => renderRegistry(e.target.value));
}

// ==========================================
// 4. LIVE CAMERA SCANNER & SIMULATION
// ==========================================
function startLiveCamera() {
    const qrContainer = document.getElementById('qrReaderViewport');
    if (!qrContainer || typeof Html5Qrcode === 'undefined') return;

    try {
        html5QrCodeScanner = new Html5Qrcode("qrReaderViewport");

        html5QrCodeScanner.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 220, height: 220 }
            },
            (decodedText) => {
                handleScannedPayload(decodedText);
            },
            () => {} // Suppress individual frame scan errors
        ).catch(err => {
            console.warn("Camera failed to start; using manual / simulator mode:", err);
        });
    } catch (e) {
        console.warn("Html5Qrcode scanner failed to initialize:", e);
    }
}

function stopLiveCamera() {
    if (html5QrCodeScanner) {
        html5QrCodeScanner.stop().then(() => {
            html5QrCodeScanner.clear();
            html5QrCodeScanner = null;
        }).catch(() => {
            html5QrCodeScanner = null;
        });
    }
}

function handleScannedPayload(payload) {
    stopLiveCamera();
    if (mobileScannerModal) mobileScannerModal.classList.remove('active');

    if (studentIdInput) {
        studentIdInput.value = payload.trim();
        studentIdInput.dispatchEvent(new Event('input'));
    }
}

// Scanner Modal Event Listeners
if (openMobileScannerBtn) {
    openMobileScannerBtn.addEventListener('click', () => {
        if (mobileScannerModal) {
            mobileScannerModal.classList.add('active');
            startLiveCamera();
        }
    });
}

if (closeMobileScannerBtn) {
    closeMobileScannerBtn.addEventListener('click', () => {
        stopLiveCamera();
        if (mobileScannerModal) mobileScannerModal.classList.remove('active');
    });
}

if (mobileScannerModal) {
    mobileScannerModal.addEventListener('click', (e) => {
        if (e.target === mobileScannerModal) {
            stopLiveCamera();
            mobileScannerModal.classList.remove('active');
        }
    });
}

// Simulation buttons for quick testing
if (simulateScanNewBtn) {
    simulateScanNewBtn.addEventListener('click', () => {
        const randomId = `2024-CICT-${Math.floor(1000 + Math.random() * 9000)}`;
        if (memberNameInput) memberNameInput.value = "John Doe (Test Artist)";
        handleScannedPayload(randomId);
    });
}

if (simulateScanReturnBtn) {
    simulateScanReturnBtn.addEventListener('click', () => {
        if (activeLoans.length > 0) {
            handleScannedPayload(activeLoans[0].student_id);
        } else {
            alert("No active loans available to simulate a return! Check out a costume first.");
        }
    });
}

initAdminDashboard();