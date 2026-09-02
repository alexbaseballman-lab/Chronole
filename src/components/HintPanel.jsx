export default function HintPanel({ answer, guessCount, hintThreshold, hintUsed, onReveal }) {
  if (hintUsed) {
    return (
      <div className="hint-panel hint-revealed">
        <strong>Hint:</strong> ruled by / part of {answer.subjecto}.
      </div>
    );
  }

  if (guessCount < hintThreshold) return null;

  return (
    <button type="button" className="hint-button" onClick={onReveal}>
      💡 Reveal a hint
    </button>
  );
}
