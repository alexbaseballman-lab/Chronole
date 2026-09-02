import { bucketForDistance } from './geo';

export function buildShareGrid(guesses) {
  return guesses.map((g) => bucketForDistance(g.distanceKm).emoji).join('');
}

export function buildShareText({ dayNumber, label, guesses, solved, hintUsed }) {
  const grid = buildShareGrid(guesses);
  const count = solved ? guesses.length : 'X';
  const lines = [
    `Chronole #${dayNumber} — ${label}`,
    `${count}/∞ guesses${hintUsed ? ' 💡' : ''}`,
    grid,
  ];
  return lines.join('\n');
}
