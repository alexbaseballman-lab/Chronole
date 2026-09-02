export default function About() {
  return (
    <div className="page about-page">
      <h1>About Chronole</h1>
      <p>
        Chronole is a daily geography-guessing game in the spirit of Globle
        — except instead of guessing today&rsquo;s randomly chosen country,
        you&rsquo;re given a year from history and have to guess who held
        the highlighted territory then.
      </p>

      <h2>Data &amp; Attribution</h2>
      <p>
        Historical boundary data comes from{' '}
        <a
          href="https://github.com/aourednik/historical-basemaps"
          target="_blank"
          rel="noreferrer"
        >
          aourednik/historical-basemaps
        </a>
        , by Andre Aourednik, licensed under GPL-3.0. See{' '}
        <a
          href="https://github.com/aourednik/historical-basemaps/blob/master/LICENSE"
          target="_blank"
          rel="noreferrer"
        >
          the project&rsquo;s license
        </a>{' '}
        for details.
      </p>
    </div>
  );
}
