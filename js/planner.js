document.addEventListener('DOMContentLoaded', () => {
  const u = RouteForge.requireUser(); if (!u) return;
  RouteForge.pageChrome('Plan a Route', 'Build a delivery plan with addresses, priorities, time windows and vehicle constraints.', 'plan');
  const vehicles = RouteForge.vehicles().filter(v => v.userId === u.id);
  const sel = document.getElementById('vehicle');
  sel.innerHTML = vehicles.map(v => `<option value="${v.id}">${RouteForge.esc(v.name)} · ${v.mileage} km/L · ${v.speed} km/h · ${v.capacity} kg</option>`).join('') || '<option value="">Add a vehicle first</option>';
  let stops = [];
  const list = document.getElementById('planner-stops');
  const fleetMode = document.getElementById('fleet-mode');
  const fleetPicker = document.getElementById('fleet-picker');

  function renderFleetPicker() {
    fleetPicker.classList.toggle('hidden', !fleetMode.checked);
    if (!fleetMode.checked) { fleetPicker.innerHTML = ''; return; }
    fleetPicker.innerHTML = `<div class="fleet-title">Select vehicles for this route</div>` + vehicles.map((v, i) => `<label class="fleet-option"><input type="checkbox" class="fleet-vehicle" value="${v.id}" ${i < Math.min(3, vehicles.length) ? 'checked' : ''}><span><b>${RouteForge.esc(v.name)}</b><small>${v.capacity} kg · ${v.mileage} km/L · ${v.speed} km/h</small></span></label>`).join('');
  }
  fleetMode.onchange = renderFleetPicker;
  renderFleetPicker();

  function render() {
    document.getElementById('urgent-count').textContent = stops.filter(s => s.priority === 'urgent').length;
    list.innerHTML = stops.map((s, i) => `<div class="planner-stop"><span class="seq">${i + 1}</span><div><b>${RouteForge.esc(s.name)}</b><small>${RouteForge.esc(s.address)} · ${s.type} · ${s.windowStart}–${s.windowEnd}</small></div><span class="priority ${s.priority}">${s.priority}</span><button class="icon-btn" data-x="${s.id}">×</button></div>`).join('') || '<div class="empty">No stops added.</div>';
    list.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { stops = stops.filter(s => s.id !== b.dataset.x); render(); });
  }

  async function locateAddress(inputId, label = 'Address') {
    const value = document.getElementById(inputId).value.trim();
    if (!value) return RouteForge.toast(`Enter a ${label.toLowerCase()} first`, 'warning');
    try {
      const r = await RouteForgeMap.geocode(value);
      RouteForge.toast(`Located: ${r.displayName.split(',').slice(0, 2).join(', ')}`, 'success');
      return r;
    } catch (e) { RouteForge.toast(e.message, 'error'); return null; }
  }
  document.getElementById('locate-depot').onclick = () => locateAddress('depot-address', 'depot address');

  document.getElementById('locate-stop').onclick = async () => {
    const r = await locateAddress('s-address', 'stop address');
    if (r) document.getElementById('s-name').dataset.geocoded = JSON.stringify(r);
  };

  document.getElementById('add-stop').onclick = async () => {
    const name = document.getElementById('s-name').value.trim();
    const address = document.getElementById('s-address').value.trim();
    if (!name || !address) return RouteForge.toast('Enter both stop name and address', 'error');
    const ws = document.getElementById('s-start').value, we = document.getElementById('s-end').value;
    if (RouteForge.minutes(ws) >= RouteForge.minutes(we)) return RouteForge.toast('Time window end must be after start', 'error');
    const button = document.getElementById('add-stop'); button.disabled = true; button.textContent = 'Locating address…';
    try {
      const coords = await RouteForgeMap.geocode(address);
      stops.push({ id: RouteForge.uid('stop'), name, address, lat: coords.lat, lng: coords.lng, type: document.getElementById('s-type').value, priority: document.getElementById('s-priority').value, load: +document.getElementById('s-load').value || 0, windowStart: ws, windowEnd: we, service: +document.getElementById('s-service').value || 0, geocodedName: coords.displayName });
      document.getElementById('s-name').value = ''; document.getElementById('s-address').value = ''; document.getElementById('s-name').dataset.geocoded = '';
      render(); RouteForge.toast('Stop added and located on the map', 'success');
    } catch (e) { RouteForge.toast(e.message, 'error'); }
    button.disabled = false; button.textContent = '+ Add stop';
  };

  function selectedVehicles() {
    if (!fleetMode.checked) return vehicles.filter(v => v.id === sel.value);
    return [...document.querySelectorAll('.fleet-vehicle:checked')].map(x => vehicles.find(v => v.id === x.value)).filter(Boolean);
  }

  function assignStopsToFleet(allStops, fleet) {
    const groups = fleet.map(v => ({ vehicle: v, stops: [], load: 0 }));
    [...allStops].sort((a, b) => (RouteForge.priorityWeight[a.priority] - RouteForge.priorityWeight[b.priority]) || (b.load - a.load)).forEach(stop => {
      let candidates = groups.filter(g => g.load + stop.load <= g.vehicle.capacity);
      if (!candidates.length) candidates = groups;
      candidates.sort((a, b) => a.load - b.load);
      const g = candidates[0]; g.stops.push(stop); g.load += stop.load;
    });
    return groups.filter(g => g.stops.length);
  }

  document.getElementById('optimize-route').onclick = async () => {
    if (stops.length < 2) return RouteForge.toast('Add at least two stops', 'warning');
    const fleet = selectedVehicles();
    if (!fleet.length) return RouteForge.toast('Select at least one vehicle', 'error');
    const depotAddress = document.getElementById('depot-address').value.trim();
    if (!depotAddress) return RouteForge.toast('Enter the depot address', 'error');
    const button = document.getElementById('optimize-route'); button.disabled = true; button.textContent = 'Building optimized routes…';
    try {
      const depotCoords = await RouteForgeMap.geocode(depotAddress);
      const depot = { id: 'depot', name: document.getElementById('depot-name').value || 'Depot', address: depotAddress, lat: depotCoords.lat, lng: depotCoords.lng, type: 'Warehouse', priority: 'normal', windowStart: '00:00', windowEnd: '23:59', service: 0, load: 0 };
      const groups = assignStopsToFleet(stops, fleet);
      const routeGroups = groups.map((group, index) => {
        const res = RouteForge.optimize([depot, ...group.stops], { startTime: document.getElementById('start-time').value, speed: group.vehicle.speed });
        const liters = res.totalKm / group.vehicle.mileage;
        return { vehicle: group.vehicle, stops: group.stops, result: res, fuelUsed: liters, fuelCost: liters * group.vehicle.fuelPrice, vehicleIndex: index };
      });
      const totalDistance = routeGroups.reduce((s, g) => s + g.result.totalKm, 0);
      const totalOriginal = routeGroups.reduce((s, g) => s + g.result.originalKm, 0);
      const totalFuel = routeGroups.reduce((s, g) => s + g.fuelUsed, 0);
      const totalCost = routeGroups.reduce((s, g) => s + g.fuelCost, 0);
      const allLegs = routeGroups.flatMap(g => g.result.simulation.legs.map(l => ({ ...l, vehicleId: g.vehicle.id, vehicleName: g.vehicle.name, vehicleIndex: g.vehicleIndex })));
      const lateCount = routeGroups.reduce((s, g) => s + g.result.simulation.lateCount, 0);
      const customerCount = stops.length;
      const route = {
        id: RouteForge.uid('route'), userId: u.id, routeName: document.getElementById('route-name').value || 'Untitled Route',
        vehicleId: fleet[0].id, vehicle: fleet[0], vehicles: fleet, fleetMode: fleet.length > 1, depot,
        startTime: document.getElementById('start-time').value, stops, vehicleRoutes: routeGroups.map(g => ({ vehicleId: g.vehicle.id, vehicle: g.vehicle, stopIds: g.stops.map(s => s.id), optimizedOrder: g.result.route.map(x => x.id), originalDistance: g.result.originalKm, optimizedDistance: g.result.totalKm, fuelUsed: g.fuelUsed, fuelCost: g.fuelCost, simulation: g.result.simulation })),
        originalOrder: [depot, ...stops].map(x => x.id), optimizedOrder: routeGroups.flatMap(g => g.result.route.map(x => x.id)),
        originalDistance: totalOriginal, nnDistance: routeGroups.reduce((s, g) => s + g.result.nnKm, 0), optimizedDistance: totalDistance,
        fuelUsed: totalFuel, fuelCost: totalCost, urgentCount: stops.filter(x => x.priority === 'urgent').length, lateCount,
        onTimeRate: customerCount ? ((customerCount - lateCount) / customerCount) * 100 : 100,
        simulation: { legs: allLegs, lateCount, onTimeRate: customerCount ? ((customerCount - lateCount) / customerCount) * 100 : 100, totalMinutes: Math.max(...routeGroups.map(g => g.result.simulation.totalMinutes), 0) },
        createdAt: new Date().toISOString(), algorithm: 'Haversine + Priority-Aware Nearest Neighbor + 2-Opt', routing: 'OSRM road geometry', geocoding: 'Nominatim user-triggered lookup'
      };
      RouteForge.write(RouteForge.KEYS.draft, route); location.href = 'route-result.html';
    } catch (e) { RouteForge.toast(e.message || 'Could not optimize route', 'error'); }
    button.disabled = false; button.textContent = 'Run Optimization →';
  };
  render();
});
