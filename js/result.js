document.addEventListener('DOMContentLoaded', async () => {
  const u = RouteForge.requireUser(); if (!u) return;
  RouteForge.pageChrome('Route Command Center', 'Live map, optimized stop order, fleet performance and delivery-window status.', 'plan');
  const r = RouteForge.read(RouteForge.KEYS.draft, null);
  if (!r || r.userId !== u.id) return location.href = 'plan-route.html';

  const vehicleRoutes = (r.vehicleRoutes || [{ vehicleId: r.vehicleId, vehicle: r.vehicle, stopIds: r.stops.map(s => s.id), optimizedOrder: r.optimizedOrder, simulation: r.simulation }]).map((vr, idx) => {
    const lookup = new Map(r.stops.map(s => [s.id, s]));
    const route = (vr.optimizedOrder || []).map(id => id === 'depot' ? r.depot : lookup.get(id)).filter(Boolean);
    if (!route.length || route[0].id !== 'depot') route.unshift(r.depot);
    if (route.at(-1)?.id !== 'depot') route.push(r.depot);
    return { ...vr, vehicle: vr.vehicle || r.vehicle, route, vehicleIndex: idx };
  });

  const stopList = document.getElementById('stop-list');
  let sequence = 0;
  stopList.innerHTML = vehicleRoutes.map((vr, vi) => `<div class="vehicle-group"><div class="vehicle-group-head"><span class="route-dot route-${vi}"></span><b>${RouteForge.esc(vr.vehicle?.name || `Vehicle ${vi + 1}`)}</b><small>${vr.stops?.length || Math.max(0, vr.route.length - 2)} stops</small></div>${vr.route.filter(p => p.id !== 'depot').map(p => { sequence++; return `<div class="command-stop"><span class="command-num">${sequence}</span><div><b>${RouteForge.esc(p.name)}</b><small>${RouteForge.esc(p.address || '')}</small></div><span class="priority ${p.priority}">${p.priority}</span></div>`; }).join('')}</div>`).join('');

  document.getElementById('sum-stops').textContent = r.stops.length;
  document.getElementById('sum-vehicles').textContent = vehicleRoutes.length;
  document.getElementById('sum-distance').textContent = `${Number(r.optimizedDistance || 0).toFixed(1)} km`;
  document.getElementById('sum-cost').textContent = `₹${Math.round(r.fuelCost || 0).toLocaleString('en-IN')}`;
  document.getElementById('sum-saving').textContent = `${Math.max(0, Number(r.originalDistance || 0) - Number(r.optimizedDistance || 0)).toFixed(1)} km`;
  document.getElementById('sum-ontime').textContent = `${Number(r.onTimeRate || 100).toFixed(0)}%`;
  document.getElementById('fuel').textContent = `${Number(r.fuelUsed || 0).toFixed(2)} L`;
  document.getElementById('cost').textContent = `₹${Math.round(r.fuelCost || 0).toLocaleString('en-IN')}`;
  document.getElementById('urgent').textContent = r.urgentCount || 0;
  document.getElementById('late').textContent = r.lateCount || 0;
  document.getElementById('improvement').textContent = `${(r.originalDistance ? Math.max(0, (r.originalDistance - r.optimizedDistance) / r.originalDistance * 100) : 0).toFixed(1)}%`;

  function clock(m) { m = Math.round(m || 0); return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }
  document.getElementById('route-stops').innerHTML = (r.simulation?.legs || []).filter(l => l.stop?.id !== 'depot').map((l, i) => `<div class="timeline-item"><div class="timeline-dot ${l.status === 'LATE' ? 'danger' : l.status === 'WAITING' ? 'warn' : 'good'}"></div><div class="timeline-main"><b>${RouteForge.esc(l.stop.name)}</b><span class="priority ${l.stop.priority}">${l.stop.priority}</span><span class="vehicle-badge">${RouteForge.esc(l.vehicleName || 'Vehicle')}</span><small>${l.status} · arrival ${clock(l.arrival)} ${l.waiting ? `· waited ${Math.round(l.waiting)} min` : ''} ${l.lateMinutes ? `· ${Math.round(l.lateMinutes)} min late` : ''}</small></div></div>`).join('') || '<div class="empty">No timeline data available.</div>';

  const routeRequests = [];
  for (const vr of vehicleRoutes) {
    try {
      const road = await RouteForgeMap.routeRoads(vr.route);
      routeRequests.push({ ...vr, geometry: road.geometry, roadDistanceKm: road.distanceKm, roadDurationMinutes: road.durationMinutes });
    } catch (e) {
      routeRequests.push({ ...vr, geometry: null, roadDistanceKm: null, roadDurationMinutes: null });
    }
  }

  const roadDistance = routeRequests.reduce((s, x) => s + (x.roadDistanceKm || 0), 0);
  const roadDuration = routeRequests.reduce((s, x) => s + (x.roadDurationMinutes || 0), 0);
  if (roadDistance > 0) {
    r.roadDistance = roadDistance;
    r.roadDurationMinutes = roadDuration;
    r.vehicleRoutes = routeRequests.map(x => ({ ...x, route: x.route.map(p => p.id) }));
    const totalFuel = routeRequests.reduce((sum, x) => sum + (x.roadDistanceKm / (x.vehicle.mileage || 1)), 0);
    const totalCost = routeRequests.reduce((sum, x) => sum + (x.roadDistanceKm / (x.vehicle.mileage || 1)) * (x.vehicle.fuelPrice || 0), 0);
    r.fuelUsed = totalFuel; r.fuelCost = totalCost;
    document.getElementById('sum-distance').textContent = `${roadDistance.toFixed(1)} km`;
    document.getElementById('sum-cost').textContent = `₹${Math.round(totalCost).toLocaleString('en-IN')}`;
    document.getElementById('fuel').textContent = `${totalFuel.toFixed(2)} L`;
    document.getElementById('cost').textContent = `₹${Math.round(totalCost).toLocaleString('en-IN')}`;
    document.getElementById('sum-time').textContent = formatDuration(roadDuration);
    r.displayDistance = roadDistance;
    RouteForge.write(RouteForge.KEYS.draft, r);
  } else {
    document.getElementById('sum-time').textContent = formatDuration(r.simulation?.totalMinutes || 0);
  }

  RouteForgeMap.loadLeaflet(() => {
    const map = RouteForgeMap.createFleetMap('route-map', r.depot, routeRequests);
    const fit = document.getElementById('fit-map');
    if (fit && map) fit.onclick = () => map.fitBounds(map.getBounds(), { padding: [40, 40] });
  });

  document.getElementById('vehicle-legend').innerHTML = routeRequests.map((vr, i) => `<span><i class="route-dot route-${i}"></i>${RouteForge.esc(vr.vehicle.name)}${vr.roadDistanceKm ? ` · ${vr.roadDistanceKm.toFixed(1)} km` : ''}</span>`).join('');

  const saveButton = document.getElementById('save-route');
  const alreadySaved = RouteForge.routes().some(x => x.id === r.id && x.userId === u.id);
  if (alreadySaved) { saveButton.disabled = true; saveButton.textContent = 'Saved ✓'; }
  saveButton.onclick = () => {
    const rs = RouteForge.routes().filter(x => x.id !== r.id);
    RouteForge.write(RouteForge.KEYS.routes, [...rs, RouteForge.read(RouteForge.KEYS.draft, r)]);
    RouteForge.toast('Route saved successfully', 'success'); saveButton.disabled = true; saveButton.textContent = 'Saved ✓';
  };
  document.getElementById('new-route').onclick = () => location.href = 'plan-route.html';

  function formatDuration(min) { const m = Math.max(0, Math.round(min || 0)); return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`; }
});
