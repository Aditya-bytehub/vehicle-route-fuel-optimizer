document.addEventListener("DOMContentLoaded", () => {
  const u = RouteForge.requireUser();
  if (!u) return;
  RouteForge.pageChrome(
    "Plan a Route",
    "Build a delivery plan with priorities, time windows and vehicle constraints.",
    "plan",
  );
  const vehicles = RouteForge.vehicles().filter((v) => v.userId === u.id);
  const sel = document.getElementById("vehicle");
  sel.innerHTML =
    vehicles
      .map(
        (v) =>
          `<option value="${v.id}">${RouteForge.esc(v.name)} · ${v.mileage} km/L · ${v.speed} km/h</option>`,
      )
      .join("") || '<option value="">Add a vehicle first</option>';
  let stops = [];
  const list = document.getElementById("planner-stops");
  function render() {
    document.getElementById("urgent-count").textContent = stops.filter(
      (s) => s.priority === "urgent",
    ).length;
    list.innerHTML =
      stops
        .map(
          (s, i) =>
            `<div class="planner-stop"><span class="seq">${i + 1}</span><div><b>${RouteForge.esc(s.name)}</b><small>${s.lat.toFixed(4)}, ${s.lng.toFixed(4)} · ${s.type} · ${s.windowStart}–${s.windowEnd}</small></div><span class="priority ${s.priority}">${s.priority}</span><button class="icon-btn" data-x="${s.id}">×</button></div>`,
        )
        .join("") || '<div class="empty">No stops added.</div>';
    list.querySelectorAll("[data-x]").forEach(
      (b) =>
        (b.onclick = () => {
          stops = stops.filter((s) => s.id !== b.dataset.x);
          render();
        }),
    );
  }
  document.getElementById("add-stop").onclick = () => {
    const name = document.getElementById("s-name").value.trim(),
      lat = +document.getElementById("s-lat").value,
      lng = +document.getElementById("s-lng").value;
    if (
      !name ||
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lng) ||
      lng < -180 ||
      lng > 180
    )
      return RouteForge.toast("Enter valid stop details", "error");
    const ws = document.getElementById("s-start").value,
      we = document.getElementById("s-end").value;
    if (RouteForge.minutes(ws) >= RouteForge.minutes(we))
      return RouteForge.toast("Time window end must be after start", "error");
    stops.push({
      id: RouteForge.uid("stop"),
      name,
      address: document.getElementById("s-address").value,
      lat,
      lng,
      type: document.getElementById("s-type").value,
      priority: document.getElementById("s-priority").value,
      load: +document.getElementById("s-load").value || 0,
      windowStart: ws,
      windowEnd: we,
      service: +document.getElementById("s-service").value || 0,
    });
    render();
  };
  document.getElementById("optimize-route").onclick = () => {
    if (stops.length < 2)
      return RouteForge.toast("Add at least two stops", "warning");
    const v = vehicles.find((x) => x.id === sel.value);
    if (!v) return RouteForge.toast("Add/select a vehicle first", "error");
    const depot = {
      id: "depot",
      name: document.getElementById("depot-name").value || "Depot",
      lat: +document.getElementById("depot-lat").value,
      lng: +document.getElementById("depot-lng").value,
      type: "Warehouse",
      priority: "normal",
      windowStart: "00:00",
      windowEnd: "23:59",
      service: 0,
      load: 0,
    };
    if (!Number.isFinite(depot.lat) || !Number.isFinite(depot.lng))
      return RouteForge.toast("Enter depot coordinates", "error");
    const all = [depot, ...stops],
      res = RouteForge.optimize(all, {
        startTime: document.getElementById("start-time").value,
        speed: v.speed,
      });
    const liters = res.totalKm / v.mileage,
      cost = liters * v.fuelPrice;
    const route = {
      id: RouteForge.uid("route"),
      userId: u.id,
      routeName:
        document.getElementById("route-name").value || "Untitled Route",
      vehicleId: v.id,
      vehicle: v,
      depot,
      startTime: document.getElementById("start-time").value,
      stops,
      originalOrder: all.map((x) => x.id),
      optimizedOrder: res.route.map((x) => x.id),
      originalDistance: res.originalKm,
      nnDistance: res.nnKm,
      optimizedDistance: res.totalKm,
      fuelUsed: liters,
      fuelCost: cost,
      urgentCount: stops.filter((x) => x.priority === "urgent").length,
      lateCount: res.simulation.lateCount,
      onTimeRate: res.simulation.onTimeRate,
      simulation: res.simulation,
      createdAt: new Date().toISOString(),
      algorithm: "Haversine + Priority-Aware Nearest Neighbor + 2-Opt",
    };
    RouteForge.write(RouteForge.KEYS.draft, route);
    location.href = "route-result.html";
  };
  render();
});
