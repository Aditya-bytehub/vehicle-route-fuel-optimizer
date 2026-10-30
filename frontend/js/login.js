document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('auth-error');
  const button = document.getElementById('submit-btn');
  document.querySelectorAll('.auth-pw-toggle').forEach(toggle => toggle.onclick = () => {
    const input = document.getElementById(toggle.dataset.target);
    input.type = input.type === 'password' ? 'text' : 'password';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    errorBox.style.display = 'none';
    button.disabled = true;
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    try {
      const result = await RouteForgeAPI.login({ email, password });
      RouteForge.setCurrent(result.user);
      location.href = result.user.role === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.style.display = 'block';
      button.disabled = false;
    }
  });
});
