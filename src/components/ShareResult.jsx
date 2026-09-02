import { useState } from 'react';
import { buildShareText } from '../lib/scoring';

export default function ShareResult({ puzzle, guesses, solved, hintUsed, onClose }) {
  const [copied, setCopied] = useState(false);

  const text = buildShareText({
    dayNumber: puzzle.dayNumber,
    label: puzzle.label,
    guesses,
    solved,
    hintUsed,
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the text is still selectable below.
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Share result">
      <div className="modal share-modal">
        <h2>{solved ? 'Solved!' : 'Nice try'}</h2>
        <p>
          The answer was <strong>{puzzle.answer.name}</strong> in {puzzle.label}.
        </p>
        <pre className="share-text">{text}</pre>
        <div className="modal-actions">
          <button type="button" onClick={copy}>{copied ? 'Copied!' : 'Copy result'}</button>
          <button type="button" className="secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
