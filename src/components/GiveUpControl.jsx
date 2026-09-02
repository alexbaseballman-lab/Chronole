// Low-emphasis by design — a game shouldn't sell quitting — but it has to
// exist somewhere, since there was previously no way to end a round you
// couldn't solve and see the answer.
export default function GiveUpControl({ guessCount, onGiveUp }) {
  if (guessCount === 0) return null;

  return (
    <button type="button" className="give-up-link" onClick={onGiveUp}>
      Give up &amp; reveal the answer
    </button>
  );
}
