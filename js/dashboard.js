document.addEventListener("DOMContentLoaded", () => {
  const u = RouteForge.requireUser();
  if (!u) return;
  RouteForge.pageChrome(
    "Operations Dashboard",
    "A live view of your delivery operation.",
    "dashboard",
  );
  document.getElementById("welcome").textContent =
    `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${u.name.split(" ")[0]}`;
  const rs = RouteForge.routes().filter((r) => r.userId === u.id),
    vs = RouteForge.vehicles().filter((v) => v.userId === u.id);
  const totalStops = rs.reduce((s, r) => s + r.stops.length, 0),
    dist = rs.reduce((s, r) => s + (r.optimizedDistance || 0), 0),
    fuel = rs.reduce((s, r) => s + (r.fuelUsed || 0), 0),
    cost = rs.reduce((s, r) => s + (r.fuelCost || 0), 0),
    urgent = rs.reduce(
      (s, r) => s + r.stops.filter((x) => x.priority === "urgent").length,
      0,
    ),
    late = rs.reduce((s, r) => s + (r.lateCount || 0), 0);
  [
    ["routes", rs.length],
    ["stops", totalStops],
    ["distance", dist.toFixed(1) + " km"],
    ["fuel", fuel.toFixed(1) + " L"],
    ["cost", "₹" + Math.round(cost).toLocaleString("en-IN")],
    [
      "ontime",
      (rs.length
        ? rs.reduce((s, r) => s + (r.onTimeRate || 0), 0) / rs.length
        : 100
      ).toFixed(0) + "%",
    ],
    ["urgent", urgent],
    ["late", late],
  ].forEach(([id, v]) => (document.getElementById(id).textContent = v));
  document.getElementById("vehicle-count").textContent = vs.length;
  document.getElementById("recent-routes").innerHTML =
    rs
      .slice(-5)
      .reverse()
      .map(
        (r) =>
          `<tr><td><b>${RouteForge.esc(r.routeName)}</b></td><td>${r.stops.length}</td><td>${(r.optimizedDistance || 0).toFixed(1)} km</td><td>₹${Math.round(r.fuelCost || 0)}</td><td><span class="status ${r.onTimeRate >= 90 ? "good" : r.onTimeRate >= 70 ? "warn" : "bad"}">${(r.onTimeRate || 0).toFixed(0)}%</span></td></tr>`,
      )
      .join("") ||
    '<tr><td colspan="5" class="empty">No saved routes yet.</td></tr>';
});
