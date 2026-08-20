import { supabase } from './supabase-client.js';

// ===== Tab toggle =====
const tabs = document.querySelectorAll('.auth-tab');
const tabIndicator = document.querySelector('.auth-tab-indicator');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

function switchTab(mode) {
  tabs.forEach((t) => t.classList.toggle('active', t.dataset.mode === mode));

  if (mode === 'login') {
    loginForm.style.display = 'flex';
    signupForm.style.display = 'none';
    tabIndicator.style.transform = 'translateX(0%)';
  } else {
    loginForm.style.display = 'none';
    signupForm.style.display = 'flex';
    tabIndicator.style.transform = 'translateX(100%)';
  }
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => switchTab(tab.dataset.mode));
});

// Check URL hash for initial mode
if (window.location.hash === '#signup') {
  switchTab('signup');
}

// ===== Password visibility toggles =====
document.querySelectorAll('.auth-pw-toggle').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const target = document.getElementById(toggle.dataset.target);
    const isHidden = target.type === 'password';
    target.type = isHidden ? 'text' : 'password';
    toggle.querySelector('.pw-icon-eye').style.display = isHidden ? 'none' : 'block';
    toggle.querySelector('.pw-icon-eye-off').style.display = isHidden ? 'block' : 'none';
  });
});

// ===== Helpers =====
function showError(errorEl, msg) {
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
}
function hideError(errorEl) {
  errorEl.style.display = 'none';
}
function setLoading(btn, loading) {
  const text = btn.querySelector('.auth-submit-text');
  const spinner = btn.querySelector('.auth-submit-spinner');
  btn.disabled = loading;
  if (loading) {
    text.style.display = 'none';
    spinner.style.display = 'flex';
    btn.classList.add('loading');
  } else {
    text.style.display = 'inline';
    spinner.style.display = 'none';
    btn.classList.remove('loading');
  }
}

// ===== Login =====
const loginFormEl = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const loginSubmit = document.getElementById('login-submit');

loginFormEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(loginError);
  setLoading(loginSubmit, true);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginEmail.value.trim(),
    password: loginPassword.value,
  });

  if (error) {
    showError(loginError, error.message);
    setLoading(loginSubmit, false);
    return;
  }

  if (data.session) {
    window.location.href = './index.html';
  }
});

// ===== Signup =====
const signupFormEl = document.getElementById('signup-form');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const signupConfirm = document.getElementById('signup-confirm');
const signupError = document.getElementById('signup-error');
const signupSubmit = document.getElementById('signup-submit');

signupFormEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(signupError);

  if (signupPassword.value !== signupConfirm.value) {
    showError(signupError, 'Passwords do not match');
    return;
  }

  setLoading(signupSubmit, true);

  const { data, error } = await supabase.auth.signUp({
    email: signupEmail.value.trim(),
    password: signupPassword.value,
  });

  if (error) {
    showError(signupError, error.message);
    setLoading(signupSubmit, false);
    return;
  }

  if (data.session) {
    window.location.href = './index.html';
  } else {
    showError(signupError, 'Account created. Redirecting to login...');
    setTimeout(() => {
      switchTab('login');
      hideError(signupError);
      setLoading(signupSubmit, false);
      signupFormEl.reset();
    }, 1500);
  }
});
