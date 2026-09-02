// Persists today's daily-puzzle progress across a page refresh, and
// blocks replaying a day already solved. Practice mode is intentionally
// not persisted — it's meant to be played freely, round after round.

const PREFIX = 'chronole:daily:';

export function loadDailyState(dateKey) {
  try {
    const raw = localStorage.getItem(PREFIX + dateKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDailyState(dateKey, state) {
  try {
    localStorage.setItem(PREFIX + dateKey, JSON.stringify(state));
  } catch {
    // Private browsing / quota exceeded — game still works, it just
    // won't survive a refresh.
  }
}
