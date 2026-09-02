import { LEGEND_GRADIENT } from '../lib/geo';

// Always-visible key for the globe's distance coloring — the How to Play
// page explains it once, but players need the reminder right where
// they're actually looking at colors while guessing.
export default function ColorLegend() {
  return (
    <div className="color-legend">
      <div className="color-legend-bar" aria-hidden="true" style={{ background: LEGEND_GRADIENT }} />
      <div className="color-legend-labels">
        <span>Closer</span>
        <span>Farther</span>
      </div>
    </div>
  );
}
