import { getActiveLoans, checkActiveLoanByStudentId, checkoutCostume, returnCostume } from './db.js';

const tbody = document.getElementById('adminRegistryTbody');
const searchInput = document.getElementById('registrySearchInput');
const form = document.getElementById('adminDispatchForm');
const studentIdInput = document.getElementById('dispatchStudentId');
const memberNameInput = document.getElementById('dispatchMemberName');
const costumeSelectGroup = document.getElementById('costumeSelectGroup');
const costumeSelect = document.getElementById('dispatchCostumeSelect');
const submitBtn = document.getElementById('dispatchSubmitBtn');
const scanStatusBanner = document.getElementById('scanStatusBanner');

let activeLoans = [];

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
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 24px; color: var(--text-muted);">No active costume loans found.</td></tr>`;
        return;
    }

    filtered.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.borrower_name}</strong><br><code style="font-size:10.5px;">${item.student_id}</code></td>
            <td><span>${item.costume_name}</span><br><small style="color: var(--sunset-gold); font-weight: 600;">${item.suite || 'Attire Unit'}</small></td>
            <td>${item.issued_date}</td>
            <td class="text-right"><button class="quick-return-btn" data-id="${item.id}"><i class="fa-solid fa-rotate-left"></i> Return</button></td>
        `;
        tr.querySelector('.quick-return-btn').addEventListener('click', async () => {
            await returnCostume(item.id, item.costume_id);
            await loadRegistry();
        });
        tbody.appendChild(tr);
    });
}

// Live student lookup on QR scan payload
if (studentIdInput) {
    studentIdInput.addEventListener('input', async (e) => {
        const val = e.target.value.trim();
        if (val.length >= 4) {
            const activeLoan = await checkActiveLoanByStudentId(val);
            if (activeLoan) {
                // Switch to Return Mode
                memberNameInput.value = activeLoan.borrower_name;
                costumeSelectGroup.style.display = 'none';
                costumeSelect.removeAttribute('required');
                scanStatusBanner.style.display = 'flex';
                scanStatusBanner.className = 'scan-status-alert return-alert';
                scanStatusBanner.innerHTML = `<i class="fa-solid fa-rotate-left"></i><div><strong>Active Loan Detected</strong><p>Checked out: <b>${activeLoan.costume_name}</b> on ${activeLoan.issued_date}</p></div>`;
                submitBtn.className = 'admin-action-btn return-action-btn';
                submitBtn.innerHTML = '<i class="fa-solid fa-check-double"></i> Complete Costume Return';
                submitBtn.dataset.mode = 'return';
                submitBtn.dataset.loanId = activeLoan.id;
                submitBtn.dataset.costumeId = activeLoan.costume_id;
            } else {
                resetForm();
            }
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
            alert('Costume returned successfully to Supabase.');
        } else {
            const [cName, suite] = costumeSelect.value.split('|');
            await checkoutCostume(studentIdInput.value.trim(), memberNameInput.value.trim(), null, cName, suite);
            alert('Costume checkout logged in Supabase.');
        }

        form.reset();
        resetForm();
        await loadRegistry();
    });
}

loadRegistry();