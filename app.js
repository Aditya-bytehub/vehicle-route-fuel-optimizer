// RouteForge app logic — DOM manipulation, localStorage, scroll animations.

(function () {
  'use strict';

  const STORAGE_KEY = 'routeforge_stops_v1';
  const FUEL_KEY = 'routeforge_fuel_v1';

  const sampleStops = [
    { id: '1', name: 'Downtown Depot', lat: 40.7128, lng: -74.006 },
    { id: '2', name: 'Brooklyn Drop', lat: 40.6782, lng: -73.9442 },
    { id: '3', name: 'Queens Hub', lat: 40.7282, lng: -73.7949 },
    { id: '4', name: 'Bronx Stop', lat: 40.8448, lng: -73.8648 },
    { id: '5', name: 'Newark Yard', lat: 40.7357, lng: -74.1724 },
    { id: '6', name: 'Jersey City', lat: 40.7178, lng: -74.0431 },
  ];

  let stops = [];
  let fuel = { mpg: 25, pricePerGal: 3.85 };

  // ===== DOM refs =====
  const $ = (id) => document.getElementById(id);
  const stopList = $('stop-list');
  const stopCount = $('stop-count');
  const nameInput = $('stop-name');
  const latInput = $('stop-lat');
  const lngInput = $('stop-lng');
  const formError = $('form-error');
  const mpgInput = $('fuel-mpg');
  const priceInput = $('fuel-price');

  // ===== Load from localStorage =====
  function load() {
    try {
      const savedStops = localStorage.getItem(STORAGE_KEY);
      const savedFuel = localStorage.getItem(FUEL_KEY);
      stops = savedStops ? JSON.parse(savedStops) : sampleStops.slice();
      fuel = savedFuel ? JSON.parse(savedFuel) : { mpg: 25, pricePerGal: 3.85 };
    } catch (e) {
      stops = sampleStops.slice();
    }
    mpgInput.value = fuel.mpg;
    priceInput.value = fuel.pricePerGal;
  }

  function saveStops() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stops));
  }
  function saveFuel() {
    localStorage.setItem(FUEL_KEY, JSON.stringify(fuel));
  }

  // ===== Render stop list =====
  function renderStops() {
    stopCount.textContent = stops.length;
    if (stops.length === 0) {
      stopList.innerHTML = '<div class="stop-empty">No stops yet. Add one or load the sample set.</div>';
      return;
    }
    stopList.innerHTML = stops.map((s, i) => `
      <div class="stop-item" data-id="${s.id}">
        <div class="stop-num">${i + 1}</div>
        <div class="stop-info">
          <div class="stop-name">${escapeHtml(s.name)}</div>
          <div class="stop-coords">${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}</div>
        </div>
        <button class="stop-delete" data-id="${s.id}" title="Remove">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `).join('');

    stopList.querySelectorAll('.stop-delete').forEach((btn) => {
      btn.addEventListener('click', () => removeStop(btn.dataset.id));
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== Add / remove stops =====
  function addStop() {
    formError.style.display = 'none';
    const name = nameInput.value.trim();
    const lat = parseFloat(latInput.value);
    const lng = parseFloat(lngInput.value);

    if (!name) { showFormError('Name is required'); return; }
    if (isNaN(lat) || lat < -90 || lat > 90) { showFormError('Latitude must be -90 to 90'); return; }
    if (isNaN(lng) || lng < -180 || lng > 180) { showFormError('Longitude must be -180 to 180'); return; }

    stops.push({ id: genId(), name, lat, lng });
    saveStops();
    renderStops();
    clearResult();
    nameInput.value = ''; latInput.value = ''; lngInput.value = '';
    nameInput.focus();
  }

  function showFormError(msg) {
    formError.textContent = msg;
    formError.style.display = 'flex';
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function removeStop(id) {
    stops = stops.filter((s) => s.id !== id);
    saveStops();
    renderStops();
    clearResult();
  }

  // ===== Optimize =====
  function runOptimization() {
    if (stops.length < 2) return;
    const result = window.RouteForge.optimizeRoute(stops);
    renderResult(result);
  }

  function renderResult(result) {
    $('results-empty').style.display = 'none';
    $('results-content').style.display = 'flex';

    $('result-distance').textContent = result.totalKm.toFixed(1);
    const fuelCost = (result.totalKm * 0.621371) / fuel.mpg * fuel.pricePerGal;
    $('result-fuel').textContent = fuelCost.toFixed(2);

    if (result.savedKm > 0.1) {
      $('savings-banner').style.display = 'flex';
      $('savings-km').textContent = result.savedKm.toFixed(1);
      $('savings-pct').textContent = result.savedPct.toFixed(0);
      const origFuelCost = (result.originalKm * 0.621371) / fuel.mpg * fuel.pricePerGal;
      $('savings-fuel').textContent = (origFuelCost - fuelCost).toFixed(2);
    } else {
      $('savings-banner').style.display = 'none';
    }

    // Route list
    const routeList = $('route-list');
    routeList.innerHTML = result.route.map((s, i) => {
      const isLast = i === result.route.length - 1;
      const prev = i > 0 ? result.route[i - 1] : null;
      const legKm = prev ? window.RouteForge.haversineKm(prev, s) : 0;
      let badgeClass = 'route-badge-mid';
      let badgeContent = i;
      if (isLast) { badgeClass = 'route-badge-end'; badgeContent = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'; }
      else if (i === 0) { badgeClass = 'route-badge-start'; badgeContent = 'A'; }
      return `
        <div class="route-item">
          <div class="route-badge ${badgeClass}">${badgeContent}</div>
          <div class="route-info">
            <div class="route-name">${escapeHtml(s.name)}</div>
            ${i > 0 ? `<div class="route-leg">${legKm.toFixed(2)} km from previous</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    $('original-km').textContent = result.originalKm.toFixed(1);
    $('optimized-km').textContent = result.totalKm.toFixed(1);
  }

  function clearResult() {
    $('results-empty').style.display = 'flex';
    $('results-content').style.display = 'none';
  }

  // ===== Actions =====
  $('add-stop-btn').addEventListener('click', addStop);
  $('optimize-btn').addEventListener('click', runOptimization);
  $('reset-btn').addEventListener('click', clearResult);
  $('sample-btn').addEventListener('click', () => {
    stops = sampleStops.slice();
    saveStops();
    renderStops();
    clearResult();
  });
  $('clear-btn').addEventListener('click', () => {
    stops = [];
    localStorage.removeItem(STORAGE_KEY);
    renderStops();
    clearResult();
  });

  mpgInput.addEventListener('change', () => {
    fuel.mpg = parseFloat(mpgInput.value) || 0;
    saveFuel();
  });
  priceInput.addEventListener('change', () => {
    fuel.pricePerGal = parseFloat(priceInput.value) || 0;
    saveFuel();
  });

  // Enter key on inputs
  [nameInput, latInput, lngInput].forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addStop();
    });
  });

  // ===== Navbar scroll =====
  const navbar = $('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });

  // ===== Mobile menu =====
  const menuToggle = $('menu-toggle');
  const mobileMenu = $('mobile-menu');
  const iconOpen = menuToggle.querySelector('.icon-open');
  const iconClose = menuToggle.querySelector('.icon-close');
  let menuOpen = false;

  menuToggle.addEventListener('click', () => {
    menuOpen = !menuOpen;
    mobileMenu.style.display = menuOpen ? 'flex' : 'none';
    iconOpen.style.display = menuOpen ? 'none' : 'block';
    iconClose.style.display = menuOpen ? 'block' : 'none';
  });
  mobileMenu.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      menuOpen = false;
      mobileMenu.style.display = 'none';
      iconOpen.style.display = 'block';
      iconClose.style.display = 'none';
    });
  });

  // ===== Scroll animations (IntersectionObserver) =====
  const animElements = document.querySelectorAll('[data-anim]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || '0', 10);
        setTimeout(() => entry.target.classList.add('in-view'), delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  animElements.forEach((el) => observer.observe(el));

  // ===== Syntax-highlighted code block =====
  const codeLines = [
    'function nearestNeighbor(stops):',
    '  route = [stops[0]]',
    '  remaining = stops[1..]',
    '  while remaining not empty:',
    '    last = route[-1]',
    '    next = argmin dist(last, s) for s in remaining',
    '    route.push(next)',
    '    remaining.remove(next)',
    '  route.push(route[0])  // return to start',
    '  return route',
    '',
    'function twoOpt(route):',
    '  improved = true',
    '  while improved:',
    '    improved = false',
    '    for i in 0..n-1, j in i+1..n:',
    '      if swap improves total:',
    '        reverse(route[i..j])',
    '        improved = true',
    '  return route',
  ];

  const codeBlock = $('code-block');
  codeBlock.innerHTML = codeLines.map((line, i) => {
    let cls = 'code-default';
    if (line.startsWith('function')) cls = 'code-fn';
    else if (line.includes('//')) cls = 'code-comment';
    else if (line.includes('route') || line.includes('remaining')) cls = 'code-var';
    return `<div class="code-line"><span class="code-ln">${i + 1}</span><span class="${cls}">${line || ' '}</span></div>`;
  }).join('');

  // ===== Init =====
  load();
  renderStops();
})();
