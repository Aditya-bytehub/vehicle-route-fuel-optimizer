document.addEventListener("DOMContentLoaded", () => {
  const f = document.getElementById("login-form"),
    e = document.getElementById("auth-error"),
    b = document.getElementById("submit-btn");
  RouteForge.seed();
  document.querySelectorAll(".auth-pw-toggle").forEach(
    (t) =>
      (t.onclick = () => {
        const x = document.getElementById(t.dataset.target);
        x.type = x.type === "password" ? "text" : "password";
      }),
  );
  f.addEventListener("submit", (ev) => {
    ev.preventDefault();
    e.style.display = "none";
    const email = document.getElementById("email").value.trim().toLowerCase(),
      pw = document.getElementById("password").value,
      u = RouteForge.users().find(
        (x) => x.email.toLowerCase() === email && x.password === pw,
      );
    if (!u)
      return (
        (e.textContent = "Invalid email or password"),
        (e.style.display = "block")
      );
    if (u.status === "blocked")
      return (
        (e.textContent = "This account is blocked by an administrator."),
        (e.style.display = "block")
      );
    b.disabled = true;
    RouteForge.setCurrent(u);
    location.href =
      u.role === "admin" ? "admin-dashboard.html" : "dashboard.html";
  });
});
