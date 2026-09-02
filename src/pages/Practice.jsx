import { useCallback, useEffect, useState } from 'react';
import Globe from '../components/Globe';
import GuessInput from '../components/GuessInput';
import GuessList from '../components/GuessList';
import HintPanel from '../components/HintPanel';
import AdSlot from '../components/AdSlot';
import { getPracticePuzzle } from '../lib/puzzle';
import { useGame } from '../hooks/useGame';

export default function Practice() {
  const [puzzle, setPuzzle] = useState(null);
  const [error, setError] = useState(null);
  const [roundKey, setRoundKey] = useState(0);

  const loadRound = useCallback(() => {
    getPracticePuzzle().then(setPuzzle).catch(setError);
  }, []);

  useEffect(() => {
    loadRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey]);

  const game = useGame({ puzzle, mode: 'practice' });

  if (error) {
    return <div className="page play-page-loading">Couldn&rsquo;t load a round. Try refreshing.</div>;
  }
  if (!puzzle) {
    return <div className="page play-page-loading">Shuffling history…</div>;
  }

  return (
    <div className="page play-page">
      <header className="play-header">
        <h1>Practice</h1>
        <p className="year-label">{puzzle.label}</p>
      </header>
      <div className="play-layout">
        <Globe entities={puzzle.yearData.entities} colorFor={game.colorFor} />
        <aside className="play-sidebar">
          <GuessInput
            entities={puzzle.yearData.entities}
            guessedIds={game.guessedIds}
            onGuess={game.submitGuess}
            disabled={game.solved}
          />
          <HintPanel
            answer={puzzle.answer}
            guessCount={game.guesses.length}
            hintThreshold={game.hintThreshold}
            hintUsed={game.hintUsed}
            onReveal={game.revealHint}
          />
          {game.solved && (
            <div className="solved-banner">
              <p>
                Solved in {game.guesses.length} guess{game.guesses.length === 1 ? '' : 'es'}! It
                was <strong>{puzzle.answer.name}</strong>.
              </p>
              <button type="button" onClick={() => setRoundKey((k) => k + 1)}>New round</button>
            </div>
          )}
          <GuessList guesses={game.guesses} />
          <AdSlot className="sidebar-ad" />
        </aside>
      </div>
    </div>
  );
}
