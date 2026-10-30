document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');
  const errorBox = document.getElementById('auth-error');
  const button = document.getElementById('submit-btn');
  document.querySelectorAll('.auth-pw-toggle').forEach(toggle => toggle.onclick = () => {
    const input = document.getElementById(toggle.dataset.target);
    input.type = input.type === 'password' ? 'text' : 'password';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    errorBox.style.display = 'none';
    const name = (document.getElementById('name')?.value || '').trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const phone = document.getElementById('phone')?.value.trim() || '';
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    if (!name || !email || !password) return showError('Please complete all required fields.');
    if (password.length < 8) return showError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return showError('Passwords do not match.');
    button.disabled = true;
    try {
      const result = await RouteForgeAPI.signup({ name, email, phone, password });
      RouteForge.setCurrent(result.user);
      location.href = 'dashboard.html';
    } catch (error) {
      showError(error.message);
    }
    function showError(message) {
      errorBox.textContent = message;
      errorBox.style.display = 'block';
      button.disabled = false;
    }
  });
});
