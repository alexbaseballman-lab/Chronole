import { Routes, Route, Link } from 'react-router-dom';
import Landing from './pages/Landing';
import HowToPlay from './pages/HowToPlay';
import Play from './pages/Play';
import Practice from './pages/Practice';
import About from './pages/About';
import Privacy from './pages/Privacy';

export default function App() {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <nav className="site-nav">
        <Link to="/" className="brand">Chronole</Link>
        <div className="nav-links">
          <Link to="/how-to-play">How to Play</Link>
          <Link to="/play">Daily</Link>
          <Link to="/practice">Practice</Link>
        </div>
      </nav>
      <main id="main-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/how-to-play" element={<HowToPlay />} />
          <Route path="/play" element={<Play />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <Link to="/about">About &amp; Data Sources</Link>
        <Link to="/privacy">Privacy</Link>
      </footer>
    </div>
  );
}
