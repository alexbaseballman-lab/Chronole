import { bucketForDistance, colorForDistance } from '../lib/geo';

export default function GuessList({ guesses }) {
  if (guesses.length === 0) return null;
  const sorted = [...guesses].sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <ol className="guess-list">
      {sorted.map((g) => {
        const bucket = bucketForDistance(g.distanceKm);
        return (
          <li key={g.id}>
            <span
              className="guess-swatch"
              style={{ background: colorForDistance(g.distanceKm) }}
              aria-hidden="true"
            />
            <span className="guess-name">{g.name}</span>
            <span className="guess-bucket-label">{bucket.label}</span>
            <span className="guess-distance">{Math.round(g.distanceKm).toLocaleString()} km</span>
          </li>
        );
      })}
    </ol>
  );
}
