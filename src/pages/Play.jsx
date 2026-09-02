import { useEffect, useState } from 'react';
import Globe from '../components/Globe';
import GuessInput from '../components/GuessInput';
import ColorLegend from '../components/ColorLegend';
import GuessList from '../components/GuessList';
import HintPanel from '../components/HintPanel';
import GiveUpControl from '../components/GiveUpControl';
import ShareResult from '../components/ShareResult';
import AdSlot from '../components/AdSlot';
import { getDailyPuzzle } from '../lib/puzzle';
import { useGame } from '../hooks/useGame';

export default function Play() {
  const [puzzle, setPuzzle] = useState(null);
  const [error, setError] = useState(null);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDailyPuzzle()
      .then((p) => {
        if (!cancelled) setPuzzle(p);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const game = useGame({ puzzle, mode: 'daily' });

  useEffect(() => {
    if (game.ended) setShowShare(true);
  }, [game.ended]);

  if (error) {
    return <div className="page play-page-loading">Couldn&rsquo;t load today&rsquo;s puzzle. Try refreshing.</div>;
  }
  if (!puzzle || !game.ready) {
    return <div className="page play-page-loading">Loading today&rsquo;s Chronole…</div>;
  }

  return (
    <div className="page play-page">
      <header className="play-header">
        <h1>Daily Chronole #{puzzle.dayNumber}</h1>
        <p className="year-label">{puzzle.label}</p>
      </header>
      <div className="play-layout">
        <Globe
          entities={puzzle.yearData.entities}
          colorFor={game.colorFor}
          strokeFor={game.strokeFor}
          focusCentroid={game.gaveUp ? puzzle.answer.centroid : game.lastGuess?.centroid}
        />
        <aside className="play-sidebar">
          <GuessInput
            entities={puzzle.yearData.entities}
            guessedIds={game.guessedIds}
            onGuess={game.submitGuess}
            disabled={game.ended}
          />
          <ColorLegend />
          <HintPanel
            answer={puzzle.answer}
            guessCount={game.guesses.length}
            hintThreshold={game.hintThreshold}
            hintUsed={game.hintUsed}
            onReveal={game.revealHint}
          />
          <GuessList guesses={game.guesses} />
          {!game.ended && (
            <GiveUpControl guessCount={game.guesses.length} onGiveUp={game.giveUp} />
          )}
          <AdSlot className="sidebar-ad" />
        </aside>
      </div>
      {showShare && (
        <ShareResult
          puzzle={puzzle}
          guesses={game.guesses}
          solved={game.solved}
          hintUsed={game.hintUsed}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
