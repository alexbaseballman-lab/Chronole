import { useMemo, useState } from 'react';

// Names in this dataset are obscure and inconsistently spelled, so
// guesses come from an autocomplete list scoped to entities that
// actually existed in this puzzle's year — never free text.
export default function GuessInput({ entities, guessedIds, onGuess, disabled }) {
  const [text, setText] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const suggestions = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q) return [];
    return entities
      .filter((e) => !guessedIds.has(e.id) && e.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [text, entities, guessedIds]);

  function submit(entity) {
    if (!entity) return;
    onGuess(entity);
    setText('');
    setActiveIndex(-1);
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submit(suggestions[activeIndex] ?? suggestions[0]);
    }
  }

  return (
    <div className="guess-input">
      <label htmlFor="guess-field" className="visually-hidden">
        Guess a historical state or people
      </label>
      <input
        id="guess-field"
        type="text"
        value={text}
        disabled={disabled}
        placeholder={disabled ? 'Solved!' : 'Guess a historical state or people…'}
        onChange={(e) => {
          setText(e.target.value);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list"
        aria-expanded={suggestions.length > 0}
        autoComplete="off"
      />
      {suggestions.length > 0 && (
        <ul className="guess-suggestions" role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === activeIndex}
              className={i === activeIndex ? 'active' : ''}
              onMouseDown={() => submit(s)}
            >
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
