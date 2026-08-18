// Route optimization algorithms — genuine heuristic work, not a map API call.

const R_EARTH_KM = 6371;
const toRad = (d) => (d * Math.PI) / 180;

function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R_EARTH_KM * Math.asin(Math.sqrt(h));
}

function totalDistanceKm(route) {
  let d = 0;
  for (let i = 0; i < route.length - 1; i++) {
    d += haversineKm(route[i], route[i + 1]);
  }
  return d;
}

// Nearest-neighbor: greedily pick the closest unvisited stop.
function nearestNeighbor(stops) {
  if (stops.length < 2) return stops.slice();
  const remaining = stops.slice();
  const route = [remaining.shift()];
  while (remaining.length > 0) {
    const last = route[route.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;
    remaining.forEach((s, i) => {
      const d = haversineKm(last, s);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    });
    route.push(remaining.splice(nearestIdx, 1)[0]);
  }
  route.push(route[0]); // close the loop
  return route;
}

// 2-opt: reverse segments to eliminate edge crossings.
function twoOpt(route) {
  if (route.length < 4) return route.slice();
  let improved = true;
  let best = route.slice();
  const maxIter = 100;
  let iter = 0;
  while (improved && iter < maxIter) {
    improved = false;
    iter++;
    for (let i = 1; i < best.length - 2; i++) {
      for (let j = i + 1; j < best.length - 1; j++) {
        const before =
          haversineKm(best[i - 1], best[i]) + haversineKm(best[j], best[j + 1]);
        const after =
          haversineKm(best[i - 1], best[j]) + haversineKm(best[i], best[j + 1]);
        if (after < before - 1e-9) {
          const segment = best.slice(i, j + 1).reverse();
          best = [].concat(best.slice(0, i), segment, best.slice(j + 1));
          improved = true;
        }
      }
    }
  }
  return best;
}

function optimizeRoute(stops) {
  if (stops.length < 2) {
    return {
      route: stops.length === 1 ? [stops[0], stops[0]] : [],
      totalKm: 0,
      originalKm: 0,
      savedKm: 0,
      savedPct: 0,
    };
  }
  const nn = nearestNeighbor(stops);
  const originalKm = totalDistanceKm(stops.concat([stops[0]]));
  const optimized = twoOpt(nn);
  const totalKm = totalDistanceKm(optimized);
  const savedKm = originalKm - totalKm;
  return {
    route: optimized,
    totalKm,
    originalKm,
    savedKm,
    savedPct: originalKm > 0 ? (savedKm / originalKm) * 100 : 0,
  };
}

// Expose to global scope
window.RouteForge = {
  haversineKm,
  totalDistanceKm,
  nearestNeighbor,
  twoOpt,
  optimizeRoute,
};
