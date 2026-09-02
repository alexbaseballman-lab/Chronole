const EARTH_RADIUS_KM = 6371;
// Roughly half of Earth's circumference — the farthest two points can be.
export const MAX_DISTANCE_KM = 20015;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function haversineKm([lon1, lat1], [lon2, lat2]) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// Close = green, far = red — Globle's heatmap. The scale is non-linear
// (sqrt) so nearby guesses stay visually distinguishable even though
// most of the globe is "far" in raw km terms.
const STOPS = [
  { t: 0, rgb: [16, 141, 88] },
  { t: 0.35, rgb: [217, 190, 30] },
  { t: 0.7, rgb: [217, 110, 30] },
  { t: 1, rgb: [176, 42, 42] },
];

function normalizedT(distanceKm, maxDistanceKm) {
  const linear = Math.min(distanceKm / maxDistanceKm, 1);
  return Math.sqrt(linear);
}

export function colorForDistance(distanceKm, maxDistanceKm = MAX_DISTANCE_KM) {
  const t = normalizedT(distanceKm, maxDistanceKm);
  let lo = STOPS[0];
  let hi = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i += 1) {
    if (t >= STOPS[i].t && t <= STOPS[i + 1].t) {
      lo = STOPS[i];
      hi = STOPS[i + 1];
      break;
    }
  }
  const span = hi.t - lo.t || 1;
  const localT = (t - lo.t) / span;
  const [r, g, b] = lo.rgb.map((c, i) => Math.round(c + (hi.rgb[i] - c) * localT));
  return `rgb(${r}, ${g}, ${b})`;
}

export function bucketForDistance(distanceKm, maxDistanceKm = MAX_DISTANCE_KM) {
  const t = normalizedT(distanceKm, maxDistanceKm);
  if (t < 0.08) return { emoji: '🟩', label: 'Very close' };
  if (t < 0.35) return { emoji: '🟨', label: 'Close' };
  if (t < 0.7) return { emoji: '🟧', label: 'Far' };
  return { emoji: '🟥', label: 'Very far' };
}

// CSS gradient built from the same stops colorForDistance uses, so the
// on-screen legend always matches what the globe actually renders.
export const LEGEND_GRADIENT = `linear-gradient(to right, ${STOPS.map(
  (s) => `rgb(${s.rgb.join(', ')}) ${Math.round(s.t * 100)}%`,
).join(', ')})`;
