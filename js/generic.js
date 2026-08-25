document.addEventListener("DOMContentLoaded", () => {
  const u = RouteForge.requireUser();
  if (!u) return;
  const page = document.body.dataset.page || "dashboard";
  RouteForge.pageChrome(
    document.body.dataset.title || "RouteForge",
    document.body.dataset.subtitle || "",
    page,
  );

  if (page === "routes" || page === "history") {
    const body = document.getElementById("route-table");
    function render() {
      const q = (document.getElementById("search")?.value || "")
        .trim()
        .toLowerCase();
      const arr = RouteForge.userRoutes(u.id)
        .filter(
          (r) =>
            !q ||
            String(r.routeName || "")
              .toLowerCase()
              .includes(q),
        )
        .sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );
      body.innerHTML =
        arr
          .map(
            (r) => `<tr>
        <td><b>${RouteForge.esc(r.routeName || "Untitled Route")}</b><small>${new Date(r.createdAt || Date.now()).toLocaleDateString("en-IN")}</small></td>
        <td>${(r.stops || []).length}</td><td>${Number(r.optimizedDistance || 0).toFixed(1)} km</td>
        <td>${Number(r.fuelUsed || 0).toFixed(2)} L</td><td>₹${Math.round(r.fuelCost || 0).toLocaleString("en-IN")}</td>
        <td><span class="status ${r.onTimeRate >= 90 ? "good" : r.onTimeRate >= 70 ? "warn" : "bad"}">${Number(r.onTimeRate || 0).toFixed(0)}%</span></td>
        <td><button class="btn btn-ghost btn-xs" data-view="${r.id}">View</button><button class="btn btn-ghost btn-xs" data-copy="${r.id}">Duplicate</button><button class="btn btn-danger btn-xs" data-del="${r.id}">Delete</button></td>
      </tr>`,
          )
          .join("") ||
        '<tr><td colspan="7" class="empty">No routes found. Create your first RouteForge route.</td></tr>';
      body.querySelectorAll("[data-view]").forEach(
        (b) =>
          (b.onclick = () => {
            const r = RouteForge.routes().find(
              (x) => x.id === b.dataset.view && x.userId === u.id,
            );
            if (r) {
              RouteForge.write(RouteForge.KEYS.draft, r);
              location.href = "route-result.html";
            }
          }),
      );
      body.querySelectorAll("[data-copy]").forEach(
        (b) =>
          (b.onclick = () => {
            const r = RouteForge.routes().find(
              (x) => x.id === b.dataset.copy && x.userId === u.id,
            );
            if (!r) return;
            const copy = JSON.parse(JSON.stringify(r));
            copy.id = RouteForge.uid("route");
            copy.routeName = `${r.routeName} (Copy)`;
            copy.createdAt = new Date().toISOString();
            RouteForge.write(RouteForge.KEYS.routes, [
              ...RouteForge.routes(),
              copy,
            ]);
            RouteForge.toast("Route duplicated successfully", "success");
            render();
          }),
      );
      body.querySelectorAll("[data-del]").forEach(
        (b) =>
          (b.onclick = () => {
            if (confirm("Delete this route?")) {
              RouteForge.write(
                RouteForge.KEYS.routes,
                RouteForge.routes().filter((x) => x.id !== b.dataset.del),
              );
              render();
              RouteForge.toast("Route deleted", "success");
            }
          }),
      );
    }
    document.getElementById("search")?.addEventListener("input", render);
    render();
  }

  if (page === "vehicles") {
    const box = document.getElementById("vehicle-grid");
    function renderV() {
      const vs = RouteForge.vehicles().filter((v) => v.userId === u.id);
      box.innerHTML =
        vs
          .map(
            (v) =>
              `<div class="glass vehicle-card"><div class="vehicle-icon">▱</div><h3>${RouteForge.esc(v.name)}</h3><p>${RouteForge.esc(v.reg)}</p><div class="vehicle-specs"><span>${v.fuelType}<small>Fuel</small></span><span>${v.mileage} km/L<small>Mileage</small></span><span>₹${v.fuelPrice}/L<small>Fuel price</small></span><span>${v.speed} km/h<small>Avg speed</small></span></div><button class="btn btn-danger btn-xs" data-vdel="${v.id}">Delete</button></div>`,
          )
          .join("") || '<div class="empty">No vehicles yet.</div>';
      box.querySelectorAll("[data-vdel]").forEach(
        (b) =>
          (b.onclick = () => {
            RouteForge.write(
              RouteForge.KEYS.vehicles,
              RouteForge.vehicles().filter((x) => x.id !== b.dataset.vdel),
            );
            renderV();
            RouteForge.toast("Vehicle deleted", "success");
          }),
      );
    }
    document.getElementById("vehicle-form").onsubmit = (e) => {
      e.preventDefault();
      const reg = document.getElementById("v-reg").value.trim();
      if (
        RouteForge.vehicles().some(
          (x) => x.userId === u.id && x.reg.toLowerCase() === reg.toLowerCase(),
        )
      )
        return RouteForge.toast(
          "A vehicle with this registration already exists",
          "warning",
        );
      const v = {
        id: RouteForge.uid("veh"),
        userId: u.id,
        name: document.getElementById("v-name").value.trim(),
        reg: document.getElementById("v-reg").value.trim(),
        fuelType: document.getElementById("v-fuel").value,
        mileage: +document.getElementById("v-mileage").value,
        fuelPrice: +document.getElementById("v-price").value,
        capacity: +document.getElementById("v-capacity").value,
        speed: +document.getElementById("v-speed").value,
      };
      RouteForge.write(RouteForge.KEYS.vehicles, [...RouteForge.vehicles(), v]);
      e.target.reset();
      renderV();
      RouteForge.toast("Vehicle added", "success");
    };
    renderV();
  }

  if (page === "profile") {
    document.getElementById("p-name").value = u.name;
    document.getElementById("p-email").value = u.email;
    document.getElementById("p-phone").value = u.phone || "";
    document.getElementById("profile-form").onsubmit = (e) => {
      e.preventDefault();
      u.name = document.getElementById("p-name").value.trim();
      u.phone = document.getElementById("p-phone").value.trim();
      RouteForge.saveUser(u);
      RouteForge.toast("Profile updated", "success");
    };
  }

  if (page === "settings") {
    const prefs = RouteForge.read(RouteForge.KEYS.prefs, {
      theme: "dark",
      motion: "full",
      unit: "km",
      currency: "INR",
    });
    for (const k of Object.keys(prefs)) {
      const el = document.getElementById("set-" + k);
      if (el) el.value = prefs[k];
    }
    document.documentElement.dataset.theme = prefs.theme;
    document.body.dataset.motion = prefs.motion;
    document.getElementById("settings-form").onsubmit = (e) => {
      e.preventDefault();
      const p = {
        theme: document.getElementById("set-theme").value,
        motion: document.getElementById("set-motion").value,
        unit: document.getElementById("set-unit").value,
        currency: document.getElementById("set-currency").value,
      };
      RouteForge.write(RouteForge.KEYS.prefs, p);
      document.documentElement.dataset.theme = p.theme;
      document.body.dataset.motion = p.motion;
      RouteForge.toast("Settings saved", "success");
    };
  }

  if (page === "analytics") {
    const rs = RouteForge.routes().filter((r) => r.userId === u.id);
    const saved = rs.reduce(
      (s, r) =>
        s + Math.max(0, (r.originalDistance || 0) - (r.optimizedDistance || 0)),
      0,
    );
    const fuelSaved = rs.reduce(
      (s, r) =>
        s +
        Math.max(0, (r.originalDistance || 0) - (r.optimizedDistance || 0)) /
          (r.vehicle?.mileage || 15),
      0,
    );
    const costSaved = rs.reduce(
      (s, r) =>
        s +
        (Math.max(0, (r.originalDistance || 0) - (r.optimizedDistance || 0)) /
          (r.vehicle?.mileage || 15)) *
          (r.vehicle?.fuelPrice || 95),
      0,
    );
    const stops = rs.reduce((s, r) => s + (r.stops || []).length, 0),
      on = rs.length
        ? rs.reduce((s, r) => s + (r.onTimeRate || 0), 0) / rs.length
        : 100;
    [
      ["a-routes", rs.length],
      ["a-stops", stops],
      ["a-saved", saved.toFixed(1) + " km"],
      ["a-fuel", fuelSaved.toFixed(1) + " L"],
      ["a-cost", "₹" + Math.round(costSaved).toLocaleString("en-IN")],
      ["a-time", on.toFixed(0) + "%"],
    ].forEach(([id, v]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    });
  }

  function makeCanvas() {
    const c = document.querySelector("canvas[data-chart]");
    if (!c) return;
    const ctx = c.getContext("2d"),
      w = (c.width = c.clientWidth * devicePixelRatio),
      h = (c.height = c.clientHeight * devicePixelRatio);
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const W = c.clientWidth,
      H = c.clientHeight;
    ctx.strokeStyle = "rgba(34,211,238,.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 20; i++) {
      const x = i * (W / 19),
        y = H * 0.65 - Math.sin(i * 0.6) * H * 0.2 - Math.random() * H * 0.18;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  makeCanvas();
});
