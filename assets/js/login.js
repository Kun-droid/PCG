import { loginUser, registerUser } from './auth.js';

// Clean browser cache on back-forward navigation
window.addEventListener('pageshow', (event) => {
    if (event.persisted || (performance.getEntriesByType && performance.getEntriesByType("navigation")[0]?.type === "back_forward")) {
        window.location.reload();
    }
});

try {
    localStorage.removeItem('panayana_auth_user');
} catch (e) {
    console.warn('Storage clear notice:', e);
}

document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('authContainer');
    const signUpBtn = document.getElementById('signUpBtn');
    const signInBtn = document.getElementById('signInBtn');
    const mobileSignUpLink = document.getElementById('mobileSignUpLink');
    const mobileSignInLink = document.getElementById('mobileSignInLink');

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const roleTabs = document.querySelectorAll('.role-tab');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password-btn');

    if (loginForm) {
        loginForm.reset();
        roleTabs.forEach(t => t.classList.remove('active'));
        
        const memberRadio = document.querySelector('input[name="loginRole"][value="member"]');
        if (memberRadio) {
            memberRadio.checked = true;
            const parentTab = memberRadio.closest('.role-tab');
            if (parentTab) parentTab.classList.add('active');
        }
    }

    const showSignUp = (e) => {
        if (e) e.preventDefault();
        if (authContainer) authContainer.classList.add('right-panel-active');
    };

    const showSignIn = (e) => {
        if (e) e.preventDefault();
        if (authContainer) authContainer.classList.remove('right-panel-active');
    };

    if (signUpBtn) signUpBtn.addEventListener('click', showSignUp);
    if (signInBtn) signInBtn.addEventListener('click', showSignIn);
    if (mobileSignUpLink) mobileSignUpLink.addEventListener('click', showSignUp);
    if (mobileSignInLink) mobileSignInLink.addEventListener('click', showSignIn);

    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const container = btn.closest('.input-with-icon');
            const input = container ? container.querySelector('input') : btn.previousElementSibling;
            
            if (!input || input.tagName !== 'INPUT') return;

            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            btn.innerHTML = isPassword 
                ? '<i class="fa-regular fa-eye-slash"></i>' 
                : '<i class="fa-regular fa-eye"></i>';
        });
    });

    roleTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const radio = tab.querySelector('input[type="radio"]');
            if (!radio) return;

            roleTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            radio.checked = true;
        });
    });

    // Sign In Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('loginEmail');
            const passInput = document.getElementById('loginPassword');
            const roleInput = document.querySelector('input[name="loginRole"]:checked');

            const identifier = emailInput ? emailInput.value.trim() : '';
            const password = passInput ? passInput.value : '';
            const role = roleInput ? roleInput.value : 'member';

            if (!identifier || !password) {
                alert('Please provide both your email/student ID and password.');
                return;
            }

            const submitBtn = loginForm.querySelector('.auth-submit-btn');
            const originalBtnContent = submitBtn ? submitBtn.innerHTML : 'Sign In';

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>Authenticating...</span>';
            }

            try {
                const { profile, error } = await loginUser(identifier, password, role);

                if (error) {
                    alert(error.message || 'Authentication failed.');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnContent;
                    }
                    return;
                }

                const splashTitle = document.getElementById('splashTitle');
                const splashSub = document.getElementById('splashSub');
                const isAdmin = (profile?.role || '').toLowerCase() === 'admin';

                if (splashTitle) {
                    splashTitle.textContent = isAdmin ? 'Welcome Admin!' : 'Welcome Member!';
                }
                if (splashSub) {
                    splashSub.textContent = isAdmin 
                        ? 'Entering Administrator Console...' 
                        : 'Entering Cultural Troupe Portal...';
                }

                // 1. Expand splash curtain to 100% solid opacity
                const splashOverlay = document.getElementById('authPortalSplash');
                if (splashOverlay) {
                    splashOverlay.classList.add('expand-active');
                }

                // 2. Set transition flag so dashboard knows to fade in smoothly
                sessionStorage.setItem('panayana_portal_fadein', 'true');

                const currentPath = window.location.pathname;
                const isInPages = currentPath.includes('/pages/');
                const targetUrl = isAdmin
                    ? (isInPages ? 'admin/admin-dash.html' : 'pages/admin/admin-dash.html')
                    : (isInPages ? 'dashboard.html' : 'pages/dashboard.html');

                // 3. Navigate while the solid maroon curtain is fully locked over the screen
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 900);

            } catch (err) {
                console.error('Fatal Login Error:', err);
                alert('An unexpected error occurred during login. Please check your network connection.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnContent;
                }
            }
        });
    }

    // Sign Up Submission
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('regFullName');
            const studentIdInput = document.getElementById('regStudentId');
            const emailInput = document.getElementById('regEmail');
            const suiteSelect = document.getElementById('regSuite');
            const passInput = document.getElementById('regPassword');

            const name = nameInput ? nameInput.value.trim() : '';
            const studentId = studentIdInput ? studentIdInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const designation = suiteSelect?.options[suiteSelect.selectedIndex]?.text || suiteSelect?.value || 'Performing Member';
            const password = passInput ? passInput.value : '';

            const submitBtn = signupForm.querySelector('.auth-submit-btn');
            const originalBtnContent = submitBtn ? submitBtn.innerHTML : 'Complete Registration';

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>Registering...</span>';
            }

            try {
                const { error } = await registerUser(name, email, password, designation, studentId);

                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnContent;
                }

                if (error) {
                    alert(error.message || 'Registration failed.');
                    return;
                }

                signupForm.reset();
                showSignIn();

                const loginEmailInput = document.getElementById('loginEmail');
                if (loginEmailInput) loginEmailInput.value = email;

                alert('Registration successful! Please sign in with your account credentials.');

            } catch (err) {
                console.error('Fatal Registration Error:', err);
                alert('An error occurred during registration. Please try again.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnContent;
                }
            }
        });
    }
});