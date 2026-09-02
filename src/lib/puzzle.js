import { getPuzzlePool, getYearData } from './dataClient';

// Days since the Unix epoch, in UTC — the same definition Wordle-likes
// use so the daily puzzle flips over at UTC midnight for every player,
// regardless of local timezone.
export function daysSinceEpochUTC(date = new Date()) {
  const utcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor(utcMidnight / 86400000);
}

export function dateKeyUTC(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

async function hydrate(entry) {
  const yearData = await getYearData(entry.year);
  const answer = yearData.entities.find((e) => e.id === entry.id);
  if (!answer) {
    throw new Error(`Puzzle entity ${entry.id} missing from year ${entry.year} data`);
  }
  return { ...entry, yearData, answer };
}

export async function getDailyPuzzle(date = new Date()) {
  const pool = await getPuzzlePool();
  const dayNumber = daysSinceEpochUTC(date);
  const entry = pool[dayNumber % pool.length];
  const hydrated = await hydrate(entry);
  return { ...hydrated, dayNumber, dateKey: dateKeyUTC(date) };
}

export async function getPracticePuzzle() {
  const pool = await getPuzzlePool();
  const entry = pool[Math.floor(Math.random() * pool.length)];
  return hydrate(entry);
}
