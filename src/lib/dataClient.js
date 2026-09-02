// Thin fetch layer over the static data baked into public/data by
// scripts/build-data.mjs. In-memory cache only — this data never
// changes during a session.

const cache = new Map();

async function getJSON(url) {
  if (cache.has(url)) return cache.get(url);
  const promise = fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    return res.json();
  });
  cache.set(url, promise);
  try {
    return await promise;
  } catch (err) {
    cache.delete(url);
    throw err;
  }
}

export function getYearIndex() {
  return getJSON('/data/index.json');
}

export function getPuzzlePool() {
  return getJSON('/data/puzzle-pool.json');
}

export function getYearData(year) {
  return getJSON(`/data/years/${year}.json`);
}
