(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let stops = [],
    fuel = { mileage: 15, price: 95, speed: 40, start: "09:00" };
  const sample = [
    {
      id: "d",
      name: "Chandigarh Depot",
      lat: 30.7046,
      lng: 76.7179,
      type: "Warehouse",
      priority: "normal",
      windowStart: "09:00",
      windowEnd: "18:00",
      service: 0,
      load: 0,
    },
    {
      id: "a",
      name: "Sector 17",
      lat: 30.7333,
      lng: 76.7794,
      type: "Delivery",
      priority: "urgent",
      windowStart: "10:00",
      windowEnd: "11:00",
      service: 10,
      load: 120,
    },
    {
      id: "b",
      name: "Industrial Area",
      lat: 30.705,
      lng: 76.801,
      type: "Delivery",
      priority: "normal",
      windowStart: "11:30",
      windowEnd: "13:00",
      service: 10,
      load: 100,
    },
    {
      id: "c",
      name: "Mohali Phase 7",
      lat: 30.7046,
      lng: 76.7179,
      type: "Delivery",
      priority: "high",
      windowStart: "12:00",
      windowEnd: "13:30",
      service: 8,
      load: 140,
    },
    {
      id: "e",
      name: "Airport Road",
      lat: 30.72,
      lng: 76.8,
      type: "Delivery",
      priority: "urgent",
      windowStart: "14:00",
      windowEnd: "16:00",
      service: 10,
      load: 80,
    },
  ];
  function esc(s) {
    return RouteForge.esc(s);
  }
  function load() {
    stops =
      JSON.parse(localStorage.getItem("routeforge_stops_v2") || "null") ||
      sample;
    fuel =
      JSON.parse(localStorage.getItem("routeforge_fuel_v2") || "null") || fuel;
  }
  function save() {
    localStorage.setItem("routeforge_stops_v2", JSON.stringify(stops));
    localStorage.setItem("routeforge_fuel_v2", JSON.stringify(fuel));
  }
  function render() {
    $("stop-count").textContent = Math.max(0, stops.length - 1);
    $("stop-list").innerHTML =
      stops
        .slice(1)
        .map(
          (s, i) =>
            `<div class="stop-item"><div class="stop-num">${i + 1}</div><div class="stop-info"><b>${esc(s.name)}</b><small>${s.lat.toFixed(4)}, ${s.lng.toFixed(4)} · ${esc(s.type)}</small><span class="priority ${s.priority}">${s.priority.toUpperCase()}</span><small>⏱ ${s.windowStart}–${s.windowEnd} · ${s.service} min</small></div><button class="icon-btn" data-del="${s.id}">×</button></div>`,
        )
        .join("") || '<div class="empty">Add delivery stops to begin.</div>';
    document.querySelectorAll("[data-del]").forEach(
      (b) =>
        (b.onclick = () => {
          stops = stops.filter((x) => x.id !== b.dataset.del);
          save();
          render();
        }),
    );
  }
  function add() {
    const n = $("stop-name").value.trim(),
      lat = +$("stop-lat").value,
      lng = +$("stop-lng").value,
      priority = $("stop-priority").value;
    if (
      !n ||
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lng) ||
      lng < -180 ||
      lng > 180
    )
      return RouteForge.toast("Enter a valid stop and coordinates", "error");
    stops.push({
      id: RouteForge.uid("s"),
      name: n,
      lat,
      lng,
      type: $("stop-type").value,
      priority,
      windowStart: $("window-start").value,
      windowEnd: $("window-end").value,
      service: +$("service-time").value || 0,
      load: +$("stop-load").value || 0,
    });
    save();
    render();
    ["stop-name", "stop-lat", "stop-lng"].forEach((id) => ($(id).value = ""));
  }
  function run() {
    if (stops.length < 3)
      return RouteForge.toast("Add at least two delivery stops", "warning");
    const result = RouteForge.optimize(stops, {
      startTime: fuel.start,
      speed: fuel.speed,
    });
    const liters = result.totalKm / fuel.mileage,
      cost = liters * fuel.price,
      origLiters = result.originalKm / fuel.mileage;
    $("results-empty").style.display = "none";
    $("results-content").style.display = "block";
    $("result-distance").textContent = result.totalKm.toFixed(1);
    $("result-fuel").textContent = liters.toFixed(2) + " L";
    $("result-cost").textContent = "₹" + cost.toFixed(0);
    $("on-time-rate").textContent =
      result.simulation.onTimeRate.toFixed(0) + "%";
    $("late-count").textContent = result.simulation.lateCount;
    $("saved-km").textContent = Math.max(0, result.savedKm).toFixed(1) + " km";
    $("savings-pct").textContent =
      Math.max(0, result.savedPct).toFixed(1) + "%";
    $("savings-fuel").textContent =
      Math.max(0, origLiters - liters).toFixed(2) + " L";
    $("route-list").innerHTML = result.route
      .map((s, i) => {
        const leg = result.simulation.legs[i] || {};
        return `<div class="route-item"><div class="route-badge ${i === 0 ? "route-badge-start" : i === result.route.length - 1 ? "route-badge-end" : "route-badge-mid"}">${i === 0 ? "D" : i === result.route.length - 1 ? "✓" : i}</div><div class="route-info"><b>${esc(s.name)}</b><small>${
          i
            ? "Arrival " +
              Math.floor((leg.arrival || 0) / 60)
                .toString()
                .padStart(2, "0") +
              ":" +
              Math.round((leg.arrival || 0) % 60)
                .toString()
                .padStart(2, "0")
            : "Start"
        } · ${leg.status || "DEPOT"}</small></div></div>`;
      })
      .join("");
    RouteForge.toast("Route optimized with priority + time windows", "success");
  }
  $("add-stop-btn").onclick = add;
  $("optimize-btn").onclick = run;
  $("sample-btn").onclick = () => {
    stops = sample.map((x) => ({ ...x }));
    save();
    render();
  };
  $("clear-btn").onclick = () => {
    stops = [sample[0]];
    save();
    render();
  };
  $("fuel-mpg").onchange = (e) => {
    fuel.mileage = +e.target.value || 15;
    save();
  };
  $("fuel-price").onchange = (e) => {
    fuel.price = +e.target.value || 95;
    save();
  };
  $("avg-speed").onchange = (e) => {
    fuel.speed = +e.target.value || 40;
    save();
  };
  $("start-time").onchange = (e) => {
    fuel.start = e.target.value || "09:00";
    save();
  };
  load();
  $("fuel-mpg").value = fuel.mileage;
  $("fuel-price").value = fuel.price;
  $("avg-speed").value = fuel.speed;
  $("start-time").value = fuel.start;
  render();
})();
