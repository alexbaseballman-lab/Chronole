import { useCallback, useEffect, useMemo, useState } from 'react';
import { haversineKm, colorForDistance } from '../lib/geo';
import { loadDailyState, saveDailyState } from '../lib/gameState';

export const HINT_THRESHOLD = 4;

const UNGUESSED_COLOR = 'rgba(90, 100, 130, 0.55)';

// Shared guess/scoring logic for both daily and practice modes. Daily
// progress is persisted to localStorage keyed by date; practice is
// session-only by design (meant to be replayed freely).
export function useGame({ puzzle, mode }) {
  const [guesses, setGuesses] = useState([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [solved, setSolved] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    setGuesses([]);
    setHintUsed(false);
    setSolved(false);
    setGaveUp(false);
    setRestored(mode !== 'daily');
  }, [puzzle?.dateKey, puzzle?.id, puzzle?.year, mode]);

  useEffect(() => {
    if (!puzzle || mode !== 'daily' || restored) return;
    const saved = loadDailyState(puzzle.dateKey);
    if (saved) {
      setGuesses(saved.guesses ?? []);
      setHintUsed(saved.hintUsed ?? false);
      setSolved(saved.solved ?? false);
      setGaveUp(saved.gaveUp ?? false);
    }
    setRestored(true);
  }, [puzzle, mode, restored]);

  useEffect(() => {
    if (!puzzle || mode !== 'daily' || !restored) return;
    saveDailyState(puzzle.dateKey, { guesses, hintUsed, solved, gaveUp });
  }, [puzzle, mode, restored, guesses, hintUsed, solved, gaveUp]);

  const guessedIds = useMemo(() => new Set(guesses.map((g) => g.id)), [guesses]);

  const submitGuess = useCallback(
    (entity) => {
      if (!puzzle || solved || guessedIds.has(entity.id)) return;
      const distanceKm = haversineKm(entity.centroid, puzzle.answer.centroid);
      const isCorrect = entity.id === puzzle.answer.id;
      setGuesses((prev) => [
        ...prev,
        { id: entity.id, name: entity.name, distanceKm, centroid: entity.centroid },
      ]);
      if (isCorrect) setSolved(true);
    },
    [puzzle, solved, guessedIds],
  );

  const revealHint = useCallback(() => setHintUsed(true), []);

  // Give-up reveals the answer without counting as a win — the round is
  // over, but ShareResult's existing "didn't solve it" branch handles the
  // copy, so this is the only other thing that needs to end a round.
  const giveUp = useCallback(() => {
    if (solved || gaveUp) return;
    setGaveUp(true);
  }, [solved, gaveUp]);

  const ended = solved || gaveUp;

  const colorFor = useCallback(
    (entity) => {
      const guess = guesses.find((g) => g.id === entity.id);
      if (guess) return colorForDistance(guess.distanceKm);
      // The winning guess is already in `guesses` at distance 0, so it
      // naturally renders as the greenest point on the same gradient as
      // every other guess — no separate "winner" color, which would
      // contradict the close=green/far=red legend shown during play.
      // Giving up reveals the answer the same way, since it was never
      // actually guessed.
      if (gaveUp && entity.id === puzzle?.answer?.id) return colorForDistance(0);
      return UNGUESSED_COLOR;
    },
    [guesses, gaveUp, puzzle],
  );

  // The winning/revealed polygon keeps the legend-honest green fill, but
  // gets a distinct gold stroke — a signal outside the distance-color
  // channel, so "you found it" doesn't look identical to "very close".
  const strokeFor = useCallback(
    (entity) => (ended && entity.id === puzzle?.answer?.id ? '#f4c542' : '#0b0f19'),
    [ended, puzzle],
  );

  const lastGuess = guesses[guesses.length - 1] ?? null;

  return {
    guesses,
    guessedIds,
    lastGuess,
    solved,
    gaveUp,
    ended,
    hintUsed,
    hintThreshold: HINT_THRESHOLD,
    submitGuess,
    revealHint,
    giveUp,
    colorFor,
    strokeFor,
    ready: mode !== 'daily' || restored,
  };
}
