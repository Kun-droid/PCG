import { loginUser, registerUser } from './auth.js';

// =========================================================
// 1. BFCACHE & BACK-BUTTON GUARD (FORCE CLEAN STATE ON BACK)
// =========================================================
window.addEventListener('pageshow', (event) => {
    // If loaded from back-forward cache or regular navigation, force clean reset
    if (event.persisted || performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
        window.location.reload();
    }
});

// Always clear leftover session when the login page loads
localStorage.removeItem('panayana_auth_user');

const authContainer = document.getElementById('authContainer');
const signUpBtn = document.getElementById('signUpBtn');
const signInBtn = document.getElementById('signInBtn');
const mobileSignUpLink = document.getElementById('mobileSignUpLink');
const mobileSignInLink = document.getElementById('mobileSignInLink');

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const roleTabs = document.querySelectorAll('.role-tab');
const togglePasswordBtns = document.querySelectorAll('.toggle-password-btn');

// Force reset the login form inputs & tabs on every initialization
if (loginForm) {
    loginForm.reset();
    roleTabs.forEach(t => t.classList.remove('active'));
    const defaultMemberTab = document.querySelector('.role-tab input[value="member"]')?.closest('.role-tab');
    if (defaultMemberTab) {
        defaultMemberTab.classList.add('active');
        const radio = defaultMemberTab.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
    }
}

// Sliding Desktop Transitions
if (signUpBtn && signInBtn && authContainer) {
    signUpBtn.addEventListener('click', () => authContainer.classList.add('right-panel-active'));
    signInBtn.addEventListener('click', () => authContainer.classList.remove('right-panel-active'));
}

// Mobile Panel Switches
if (mobileSignUpLink && mobileSignInLink && authContainer) {
    mobileSignUpLink.addEventListener('click', (e) => {
        e.preventDefault();
        authContainer.classList.add('right-panel-active');
    });
    mobileSignInLink.addEventListener('click', (e) => {
        e.preventDefault();
        authContainer.classList.remove('right-panel-active');
    });
}

// Password Visibility Toggle
togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const input = btn.closest('.form-input-group')?.querySelector('input[type="password"], input[type="text"]') || 
                      btn.previousElementSibling;
        if (!input || input.tagName !== 'INPUT') return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.innerHTML = isPassword ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
    });
});

// Role Tabs Selector (Keep UI class strictly aligned with checked radio)
roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        roleTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const radio = tab.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
    });
});

// Sign In Submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail')?.value.trim() || '';
        const password = document.getElementById('loginPassword')?.value || '';
        const role = document.querySelector('input[name="loginRole"]:checked')?.value || 'member';

        const submitBtn = loginForm.querySelector('.auth-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Authenticating...</span>';
        }

        const { profile, error } = await loginUser(email, password, role);

        if (error) {
            alert(error.message);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Sign In</span> <i class="fa-solid fa-arrow-right"></i>';
            }
            return;
        }

        // Folder routing: Admin goes to admin/admin-dash.html | Member goes to dashboard.html
        if (profile?.role === 'admin') {
            window.location.href = 'pages/admin/admin-dash.html';
        } else {
            window.location.href = 'pages/dashboard.html';
        }
    });
}

// Sign Up Submission
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regFullName')?.value.trim() || '';
        const email = document.getElementById('regEmail')?.value.trim() || '';
        const password = document.getElementById('regPassword')?.value || '';
        const suite = document.getElementById('regSuite')?.value || 'Troupe';

        const submitBtn = signupForm.querySelector('.auth-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Registering...</span>';
        }

        const { error } = await registerUser(name, email, password, suite);

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Complete Registration</span> <i class="fa-solid fa-user-plus"></i>';
        }

        if (error) {
            alert(error.message);
            return;
        }

        // Reset and switch panel back to Sign In
        signupForm.reset();
        if (authContainer) authContainer.classList.remove('right-panel-active');

        const loginEmailInput = document.getElementById('loginEmail');
        if (loginEmailInput) loginEmailInput.value = email;

        alert('Registration successful! Please sign in with your email and password.');
    });
}