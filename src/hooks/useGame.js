import { useCallback, useEffect, useMemo, useState } from 'react';
import { haversineKm, colorForDistance } from '../lib/geo';
import { loadDailyState, saveDailyState } from '../lib/gameState';

export const HINT_THRESHOLD = 4;

const UNGUESSED_COLOR = 'rgba(90, 100, 130, 0.55)';
const ANSWER_COLOR = '#f4c542';

// Shared guess/scoring logic for both daily and practice modes. Daily
// progress is persisted to localStorage keyed by date; practice is
// session-only by design (meant to be replayed freely).
export function useGame({ puzzle, mode }) {
  const [guesses, setGuesses] = useState([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [solved, setSolved] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    setGuesses([]);
    setHintUsed(false);
    setSolved(false);
    setRestored(mode !== 'daily');
  }, [puzzle?.dateKey, puzzle?.id, puzzle?.year, mode]);

  useEffect(() => {
    if (!puzzle || mode !== 'daily' || restored) return;
    const saved = loadDailyState(puzzle.dateKey);
    if (saved) {
      setGuesses(saved.guesses ?? []);
      setHintUsed(saved.hintUsed ?? false);
      setSolved(saved.solved ?? false);
    }
    setRestored(true);
  }, [puzzle, mode, restored]);

  useEffect(() => {
    if (!puzzle || mode !== 'daily' || !restored) return;
    saveDailyState(puzzle.dateKey, { guesses, hintUsed, solved });
  }, [puzzle, mode, restored, guesses, hintUsed, solved]);

  const guessedIds = useMemo(() => new Set(guesses.map((g) => g.id)), [guesses]);

  const submitGuess = useCallback(
    (entity) => {
      if (!puzzle || solved || guessedIds.has(entity.id)) return;
      const distanceKm = haversineKm(entity.centroid, puzzle.answer.centroid);
      const isCorrect = entity.id === puzzle.answer.id;
      setGuesses((prev) => [...prev, { id: entity.id, name: entity.name, distanceKm }]);
      if (isCorrect) setSolved(true);
    },
    [puzzle, solved, guessedIds],
  );

  const revealHint = useCallback(() => setHintUsed(true), []);

  const colorFor = useCallback(
    (entity) => {
      if (solved && entity.id === puzzle?.answer?.id) return ANSWER_COLOR;
      const guess = guesses.find((g) => g.id === entity.id);
      if (!guess) return UNGUESSED_COLOR;
      return colorForDistance(guess.distanceKm);
    },
    [guesses, solved, puzzle],
  );

  return {
    guesses,
    guessedIds,
    solved,
    hintUsed,
    hintThreshold: HINT_THRESHOLD,
    submitGuess,
    revealHint,
    colorFor,
    ready: mode !== 'daily' || restored,
  };
}
