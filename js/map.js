(() => {
  const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
  const OSRM = 'https://router.project-osrm.org/route/v1/driving';
  const CACHE_KEY = 'routeforge_geocode_cache_v1';

  function cacheRead() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
  }
  function cacheWrite(value) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(value)); } catch {} }
  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  async function geocode(address) {
    const clean = String(address || '').trim();
    if (!clean) throw new Error('Enter an address first.');
    const cache = cacheRead();
    const key = clean.toLowerCase();
    if (cache[key]) return cache[key];

    const url = `${NOMINATIM}?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(clean)}`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error('Address lookup failed.');
    const data = await response.json();
    if (!data.length) throw new Error(`Could not locate “${clean}”. Try adding city/state.`);
    const result = { lat: Number(data[0].lat), lng: Number(data[0].lon), displayName: data[0].display_name };
    cache[key] = result;
    cacheWrite(cache);
    await sleep(1100);
    return result;
  }

  async function routeRoads(points) {
    if (!points || points.length < 2) return null;
    const coords = points.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `${OSRM}/${coords}?overview=full&geometries=geojson&steps=false`; 
    const response = await fetch(url);
    if (!response.ok) throw new Error('Road routing service unavailable.');
    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('No drivable road route was found.');
    const route = data.routes[0];
    return {
      geometry: route.geometry,
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60
    };
  }

  function loadLeaflet(callback) {
    if (window.L) return callback();
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = callback;
    script.onerror = () => RouteForge.toast('Map library could not be loaded.', 'error');
    document.head.appendChild(script);
  }

  function markerIcon(color, label) {
    return L.divIcon({
      className: 'rf-marker-wrap',
      html: `<div class="rf-marker" style="--marker:${color}"><span>${RouteForge.esc(label)}</span></div>`,
      iconSize: [34, 34], iconAnchor: [17, 17]
    });
  }

  // Vehicle marker used at every assigned delivery stop. The vehicle icon is
  // rendered locally as SVG, so the map does not depend on an image host.
  function vehicleMarkerIcon(color, sequence, vehicle) {
    const type = String(vehicle?.type || vehicle?.vehicleType || vehicle?.fuelType || 'vehicle').toLowerCase();
    const cab = /truck|lorry|heavy|tempo|van/.test(type)
      ? '<rect x="8" y="13" width="20" height="10" rx="2.5"/><path d="M28 16h5l4 4v3h-9z"/>'
      : '<rect x="7" y="13" width="27" height="10" rx="4"/><path d="M12 13l3-5h11l4 5z"/>';
    return L.divIcon({
      className: 'rf-vehicle-marker-wrap',
      html: `<div class="rf-vehicle-marker" style="--vehicle:${color}" title="${RouteForge.esc(vehicle?.name || 'Vehicle')}">
        <div class="rf-vehicle-bubble">
          <svg viewBox="0 0 44 32" aria-hidden="true">
            <g fill="var(--vehicle)" stroke="white" stroke-width="1.6">${cab}</g>
            <circle cx="14" cy="26" r="3.2" fill="#111827" stroke="white" stroke-width="1.4"/>
            <circle cx="32" cy="26" r="3.2" fill="#111827" stroke="white" stroke-width="1.4"/>
          </svg>
        </div>
        <span class="rf-vehicle-sequence">${RouteForge.esc(sequence)}</span>
      </div>`,
      iconSize: [54, 54], iconAnchor: [27, 27], popupAnchor: [0, -24]
    });
  }

  function createMap(elementId, points, geometry, options = {}) {
    const el = document.getElementById(elementId);
    if (!el) return null;
    loadLeaflet(() => {});
    if (!window.L) return null;
    const map = L.map(el, { zoomControl: true, preferCanvas: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const colors = options.colors || ['#22d3ee', '#ff5c5c', '#65d46e', '#f59e0b'];
    const bounds = [];
    points.forEach((p, i) => {
      const color = p.type === 'Warehouse' ? '#a78bfa' : colors[(p.vehicleIndex || 0) % colors.length];
      const marker = L.marker([p.lat, p.lng], { icon: markerIcon(color, p.type === 'Warehouse' ? 'D' : String((p.sequence || i))) }).addTo(map);
      marker.bindPopup(`<b>${RouteForge.esc(p.name)}</b><br>${RouteForge.esc(p.address || '')}<br><span>${p.type || 'Stop'} · ${p.priority || ''}</span>`);
      bounds.push([p.lat, p.lng]);
    });
    if (geometry) {
      L.geoJSON(geometry, { style: { color: '#22d3ee', weight: 5, opacity: .88 } }).addTo(map);
    } else if (points.length > 1) {
      L.polyline(points.map(p => [p.lat, p.lng]), { color: '#22d3ee', weight: 4, opacity: .75, dashArray: '8 8' }).addTo(map);
    }
    if (bounds.length) map.fitBounds(bounds, { padding: [35, 35] });
    return map;
  }

  function createFleetMap(elementId, depot, vehicleRoutes) {
    const el = document.getElementById(elementId);
    if (!el || !window.L) return null;
    const map = L.map(el, { zoomControl: true, preferCanvas: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    const colors = ['#22d3ee', '#ff5c5c', '#65d46e', '#f59e0b', '#a78bfa'];
    const bounds = [];
    L.marker([depot.lat, depot.lng], { icon: markerIcon('#a78bfa', 'D') }).addTo(map).bindPopup(`<b>${RouteForge.esc(depot.name)}</b><br>${RouteForge.esc(depot.address || '')}`);
    bounds.push([depot.lat, depot.lng]);
    vehicleRoutes.forEach((vr, idx) => {
      const color = colors[idx % colors.length];
      (vr.route || []).forEach((p, i) => {
        // Keep the depot as a depot marker; every delivery/pickup stop gets
        // the icon of the vehicle assigned to that route.
        if (p.id === 'depot' || p.type === 'Warehouse') {
          const marker = L.marker([p.lat, p.lng], { icon: markerIcon('#a78bfa', 'D') }).addTo(map);
          marker.bindPopup(`<b>${RouteForge.esc(p.name)}</b><br>${RouteForge.esc(p.address || '')}<br><span>Depot</span>`);
          bounds.push([p.lat, p.lng]);
          return;
        }
        const sequence = p.sequence || i;
        const marker = L.marker([p.lat, p.lng], { icon: vehicleMarkerIcon(color, sequence, vr.vehicle) }).addTo(map);
        marker.bindTooltip(`${RouteForge.esc(vr.vehicle.name || 'Vehicle')} · Stop ${RouteForge.esc(sequence)}`, { direction: 'top', offset: [0, -22], opacity: .95 });
        marker.bindPopup(`<b>${RouteForge.esc(p.name)}</b><br>${RouteForge.esc(p.address || '')}<br><span>${RouteForge.esc(vr.vehicle.name || 'Vehicle')} · ${p.type || 'Stop'} · ${p.priority || 'Normal'}</span>`);
        bounds.push([p.lat, p.lng]);
      });
      if (vr.geometry) L.geoJSON(vr.geometry, { style: { color, weight: 5, opacity: .9 } }).addTo(map);
      else if (vr.route?.length > 1) L.polyline(vr.route.map(p => [p.lat, p.lng]), { color, weight: 4, opacity: .8, dashArray: '8 8' }).addTo(map);
    });
    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40] });
    return map;
  }

  window.RouteForgeMap = { geocode, routeRoads, loadLeaflet, createMap, createFleetMap };
})();
