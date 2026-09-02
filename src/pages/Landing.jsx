import { Link } from 'react-router-dom';
import AdSlot from '../components/AdSlot';

export default function Landing() {
  return (
    <div className="page landing-page">
      <header className="hero">
        <h1>Chronole</h1>
        <p className="tagline">Every day, a year from history. Guess who ruled it.</p>
        <Link className="cta" to="/how-to-play">How to Play</Link>
      </header>
      <AdSlot className="landing-ad" />
      <section className="landing-blurb">
        <p>
          From the Ming Empire to the Golden Horde, from Republican Rome to
          the eve of the First World War — Chronole hands you a year and a
          globe. Type your guess, watch the map light up, and close in on
          the state, empire, or people that held that territory.
        </p>
      </section>
    </div>
  );
}
