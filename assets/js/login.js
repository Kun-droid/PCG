import { loginUser, registerUser } from './auth.js';

const authContainer = document.getElementById('authContainer');
const signUpBtn = document.getElementById('signUpBtn');
const signInBtn = document.getElementById('signInBtn');
const mobileSignUpLink = document.getElementById('mobileSignUpLink');
const mobileSignInLink = document.getElementById('mobileSignInLink');

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const roleTabs = document.querySelectorAll('.role-tab');
const togglePasswordBtns = document.querySelectorAll('.toggle-password-btn');

// Sliding Panels Trigger (Desktop)[cite: 14]
if (signUpBtn && signInBtn) {
    signUpBtn.addEventListener('click', () => authContainer.classList.add('right-panel-active'));
    signInBtn.addEventListener('click', () => authContainer.classList.remove('right-panel-active'));
}

// Mobile Switch Links[cite: 14]
if (mobileSignUpLink && mobileSignInLink) {
    mobileSignUpLink.addEventListener('click', (e) => {
        e.preventDefault();
        authContainer.classList.add('right-panel-active');
    });
    mobileSignInLink.addEventListener('click', (e) => {
        e.preventDefault();
        authContainer.classList.remove('right-panel-active');
    });
}

// Password Visibility Toggle[cite: 14]
togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const input = btn.previousElementSibling;
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.innerHTML = isPassword ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
    });
});

// Role Tabs Selector[cite: 14]
roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        roleTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const radio = tab.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
    });
});

// Login Form Submit with Supabase[cite: 14]
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const role = document.querySelector('input[name="loginRole"]:checked')?.value || 'member';

        const submitBtn = loginForm.querySelector('.auth-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Authenticating...</span>';

        const { profile, error } = await loginUser(email, password, role);

        if (error) {
            alert(error.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Sign In</span> <i class="fa-solid fa-arrow-right"></i>';
            return;
        }

        // Role-based routing[cite: 14]
        if (profile.role === 'admin') {
            window.location.href = 'pages/admin-dash.html';
        } else {
            window.location.href = 'pages/dashboard.html';
        }
    });
}

// Sign Up Form Submit with Supabase[cite: 14]
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regFullName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const suite = document.getElementById('regSuite').value;

        const submitBtn = signupForm.querySelector('.auth-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Registering...</span>';

        const { error } = await registerUser(name, email, password, suite);

        if (error) {
            alert(error.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Complete Registration</span> <i class="fa-solid fa-user-plus"></i>';
            return;
        }

        window.location.href = 'pages/dashboard.html';
    });
}