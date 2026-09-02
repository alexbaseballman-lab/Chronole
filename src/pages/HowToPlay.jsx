import { Link } from 'react-router-dom';
import AdSlot from '../components/AdSlot';

export default function HowToPlay() {
  return (
    <div className="page how-to-play-page">
      <h1>How to Play</h1>
      <ol className="rules-list">
        <li>You&rsquo;ll be given a <strong>year</strong> — anywhere from 1000 BCE to 2010 CE.</li>
        <li>Type your guess for the state, empire, or people that held territory that year.</li>
        <li>
          After each guess, the globe recolors: <span className="chip green">green</span> means
          close, <span className="chip red">red</span> means far.
        </li>
        <li>Keep guessing until you land on the exact answer — there&rsquo;s no limit on guesses.</li>
        <li>Stuck? After a few guesses, you can reveal a hint about who ruled the territory.</li>
        <li>Solve the daily puzzle and share your result grid.</li>
      </ol>
      <AdSlot className="how-to-play-ad" />
      <Link className="cta" to="/play">Click the globe to start</Link>
    </div>
  );
}
