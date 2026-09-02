// Chronole data pipeline
//
// Downloads a pinned set of historical-boundary snapshots from
// aourednik/historical-basemaps (GPL-3.0), cleans out non-political
// features, simplifies geometry, precomputes centroids, and writes
// everything the client needs into public/data/.
//
// This is NOT run on every build (unlike College Site's Scorecard
// prebuild script) — the source data doesn't change, so this is a
// manual/occasional step. Run with: node scripts/build-data.mjs

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as turf from '@turf/turf';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'data');
const YEARS_DIR = path.join(OUT_DIR, 'years');

// Pinned commit for reproducibility — upstream data could change shape.
const COMMIT = '62d8f1a03a71f2d3ff17f2d166f7553f256bce68';
const BASE_URL = `https://raw.githubusercontent.com/aourednik/historical-basemaps/${COMMIT}/geojson/`;

// Playable range: 1000 BCE - 2010 CE. Excludes the deep-prehistory
// snapshots (123,000-5,000 BCE) which map migrations/language spread,
// not political entities, so "guess the country" doesn't apply.
const BCE_YEARS = [1000, 700, 500, 400, 323, 300, 200, 1];
const CE_YEARS = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1279, 1300,
  1400, 1492, 1500, 1530, 1600, 1650, 1700, 1715, 1783, 1800, 1815, 1880,
  1900, 1914, 1920, 1930, 1938, 1945, 1960, 1994, 2000, 2010,
];

const SNAPSHOTS = [
  ...BCE_YEARS.map((n) => ({
    file: `world_bc${n}`,
    year: -n,
    label: `${n} BCE`,
  })),
  ...CE_YEARS.map((n) => ({
    file: `world_${n}`,
    year: n,
    label: `${n} CE`,
  })),
];

// A few names in the upstream source have already-corrupted bytes (the
// accented character was lost before it was ever committed — confirmed
// against the raw source, not something introduced by this pipeline).
// There's no way to algorithmically recover a replaced byte, so these
// are just the couple of known cases, hand-corrected.
const NAME_FIXES = new Map([
  ['Teotihuac�n', 'Teotihuacán'],
  ['Monte Alb�n', 'Monte Albán'],
]);

function fixName(name) {
  return NAME_FIXES.get(name) ?? name;
}

// Names that show up in the dataset but aren't political entities.
const JUNK_NAMES = new Set([
  'unclaimed',
  'uninhabited',
  'ice',
  'ice cap',
  'ice sheet',
  'no man\'s land',
  'disputed',
  'open sea',
  'ocean',
  'sea',
  'lake',
]);

function slugify(name, seen) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  let id = base;
  let n = 2;
  while (seen.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  seen.add(id);
  return id;
}

function isJunk(name) {
  if (!name) return true;
  return JUNK_NAMES.has(name.trim().toLowerCase());
}

async function fetchSnapshot(file) {
  const url = `${BASE_URL}${file}.geojson`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function simplifyFeature(feature) {
  try {
    return turf.simplify(feature, { tolerance: 0.05, highQuality: false });
  } catch {
    // Some features have degenerate geometry that turf can't simplify —
    // fall back to the original rather than dropping the entity.
    return feature;
  }
}

function safeCentroid(feature) {
  try {
    const c = turf.centroid(feature);
    return c.geometry.coordinates;
  } catch {
    return null;
  }
}

function safeArea(feature) {
  try {
    return turf.area(feature);
  } catch {
    return 0;
  }
}

// The source data sometimes represents one political entity as several
// disconnected features sharing the same NAME — a mainland plus islands
// or exclaves (e.g. "Sweden" appears 13 times in the 1600 snapshot).
// Treating those as separate guessable entities would both show
// confusing duplicate names in the guess list and give a wrong centroid
// (an island's centroid, not the realm's). So features are grouped by
// name per year and merged into one MultiPolygon before anything else
// is computed.
function mergeGeometries(features) {
  const polygons = [];
  for (const f of features) {
    if (f.geometry.type === 'Polygon') {
      polygons.push(f.geometry.coordinates);
    } else if (f.geometry.type === 'MultiPolygon') {
      polygons.push(...f.geometry.coordinates);
    }
  }
  return { type: 'MultiPolygon', coordinates: polygons };
}

// Some years (1492, and the 1600-1800 colonial era) map hundreds of small
// entities in fine detail — e.g. individual Native American nations
// alongside the familiar empires. All of that stays on the globe (it's
// real, valuable detail), but if every entity were equally likely to be
// the puzzle's ANSWER, most rounds would land on something almost nobody
// could name. So eligibility to be an answer is weighted by land area:
// take the largest entities until either 60% of that year's total land
// area is covered or 40 entities are reached, with a floor of 10 so
// small years still get some variety.
function selectEligible(entities) {
  const byArea = [...entities].sort((a, b) => b.area - a.area);
  const totalArea = byArea.reduce((sum, e) => sum + e.area, 0) || 1;
  const eligible = [];
  let cumArea = 0;
  for (const e of byArea) {
    if (eligible.length >= 40) break;
    eligible.push(e);
    cumArea += e.area;
    if (cumArea / totalArea >= 0.6 && eligible.length >= 10) break;
  }
  return new Set(eligible.map((e) => e.id));
}

async function processSnapshot({ file, year, label }) {
  const geojson = await fetchSnapshot(file);
  const seenIds = new Set();

  const groups = new Map(); // name -> { props, features: [] }
  for (const feature of geojson.features ?? []) {
    const props = feature.properties ?? {};
    const rawName = typeof props.NAME === 'string' ? props.NAME.trim() : null;
    const name = rawName ? fixName(rawName) : rawName;
    if (isJunk(name)) continue;
    if (!feature.geometry) continue;

    if (!groups.has(name)) groups.set(name, { props, features: [] });
    groups.get(name).features.push(feature);
  }

  const entities = [];
  for (const [name, { props, features }] of groups) {
    const merged = { type: 'Feature', properties: {}, geometry: mergeGeometries(features) };

    const centroid = safeCentroid(merged);
    if (!centroid) continue;

    const simplified = simplifyFeature(merged);

    entities.push({
      id: slugify(name, seenIds),
      name,
      subjecto: props.SUBJECTO ?? name,
      partof: props.PARTOF ?? null,
      centroid,
      area: safeArea(merged),
      geometry: simplified.geometry,
    });
  }

  const eligibleIds = selectEligible(entities);
  for (const e of entities) {
    e.eligibleAnswer = eligibleIds.has(e.id);
  }

  return { year, label, entities };
}

async function main() {
  await mkdir(YEARS_DIR, { recursive: true });

  const index = [];
  const puzzlePool = [];

  for (const snapshot of SNAPSHOTS) {
    process.stdout.write(`Fetching ${snapshot.file}... `);
    let result;
    try {
      result = await processSnapshot(snapshot);
    } catch (err) {
      console.log(`SKIPPED (${err.message})`);
      continue;
    }

    if (result.entities.length < 2) {
      // Not enough entities to make a meaningful guessing round.
      console.log(`SKIPPED (only ${result.entities.length} usable entities)`);
      continue;
    }

    const outFile = `${result.year}.json`;
    await writeFile(
      path.join(YEARS_DIR, outFile),
      JSON.stringify(result),
    );

    index.push({
      year: result.year,
      label: result.label,
      file: `years/${outFile}`,
      entityCount: result.entities.length,
    });

    for (const entity of result.entities) {
      if (!entity.eligibleAnswer) continue;
      puzzlePool.push({ year: result.year, label: result.label, id: entity.id, name: entity.name });
    }

    console.log(`OK (${result.entities.length} entities)`);
  }

  index.sort((a, b) => a.year - b.year);

  await writeFile(path.join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2));
  await writeFile(path.join(OUT_DIR, 'puzzle-pool.json'), JSON.stringify(puzzlePool, null, 2));

  console.log(`\nWrote ${index.length} year snapshots and ${puzzlePool.length} puzzle candidates.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
