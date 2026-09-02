---
target: the Play page / game UI (polygon rendering glitch)
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-09-02T00-55-14Z
slug: src-pages-play-jsx
---
Method: dual-agent (A: a1e1d124a96e46a53 · B: a6e3615d5024f7dd2)

**Testing caveat**: both assessments shared this session's single Browser pane. Assessment A noted signs of cross-contamination mid-session (a tab-title flip, an input auto-filling, spontaneous route changes) that lines up with Assessment B's concurrent live-server/detect.js injection work. Both agents isolated a fresh tab and discounted un-self-caused state changes, but treat any "could not reproduce live" result as weaker evidence than the code-level findings below.

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Guess feedback is instant, but loading states ("Loading today's Chronole…") are plain unstyled text, no spinner/skeleton |
| 2 | Match System / Real World | 4 | BCE/CE framing, real entity names, `subjecto` hint field pulled straight from the source dataset |
| 3 | User Control and Freedom | 2 | No give-up/reveal-answer path anywhere; Practice has "New round," Daily has nothing |
| 4 | Consistency and Standards | 4 | Green→red distance vocabulary reused identically across legend, chips, guess swatches, globe fill, and share-grid emoji |
| 5 | Error Prevention | 3 | Autocomplete-only input structurally prevents misspellings; unmatched Enter is a silent no-op |
| 6 | Recognition Rather Than Recall | 3 | Genre inherently demands recall of obscure names; typeahead mitigates as much as reasonably possible |
| 7 | Flexibility and Efficiency | 3 | Arrow-key + Enter nav on the autocomplete; no other shortcuts, no undo |
| 8 | Aesthetic and Minimalist Design | 3 | Clean palette and cards; sidebar gets dense, especially stacked on mobile |
| 9 | Error Recovery | 1 | Unmatched guess and puzzle-load failure both give the user nothing actionable — no explanation, no retry |
| 10 | Help and Documentation | 4 | `/how-to-play` is concise, visual, always reachable from nav |
| **Total** | | **30/40** | **Good** |

#### Design Specificity Verdict

**LLM assessment**: Mixed, leaning "authored but under-committed." The copy and mechanics are genuinely domain-specific — hero copy names real entities ("Ming Empire," "Golden Horde"), the puzzle pool surfaces real historiographic detail (e.g. Rome splits into `Rome (Diocletianus)`, `Rome (Galerius)`, `Rome (Maximian)`, `Rome (Constantinus)` for the Tetrarchy year), and the hint system pulls a real `subjecto` field. The navy/gold palette and serif display type read as "old atlas." But the globe itself — the one element players stare at for 90% of a session — is stock `react-globe.gl` output: a dark sphere with a generic blue atmospheric glow, no period styling. Strip the copy out and the globe would be indistinguishable from any generic geo-data demo.

**Deterministic scan**: `detect.mjs --json src` came back clean (exit 0, zero findings) — no anti-patterns in the source markup/CSS itself. The browser-injected overlay scan (separate from the static scan) did catch one issue the static scan and the LLM review both missed: a `clipped-overflow-container` finding on `div.globe-container` (`src/components/Globe.jsx:38`), on both `/play` and `/practice`. Not independently visually confirmed as broken, but a real structural pattern (a sized container that could clip a positioned child) worth a quick manual check.

**Visual overlays**: not left live for you to view — the live-server was already stopped per the critique protocol before this report. The console summary above is the full evidence captured.

#### Overall Impression

The core loop is well-built and the scoring/color system is unusually disciplined for a first pass — one vocabulary, five surfaces, no drift. The biggest gap isn't polish, it's that two real features are half-wired: the game has no way to end in defeat (the "you didn't solve it" share state is fully coded but structurally unreachable), and the globe — the actual star of the show — carries none of the historical-atlas character the rest of the interface commits to. The reported rendering glitch is real as a *mechanism* in this codebase (confirmed via geometry analysis, not guesswork), even though neither agent could catch it red-handed on camera.

#### What's Working

- **One color vocabulary, five surfaces.** Green→yellow→orange→red is reused verbatim by `ColorLegend`, the how-to-play `.chip` pills, `GuessList` swatches, the globe's `polygonCapColor`, and the share-grid emoji — all drawing from the single `bucketForDistance`/`colorForDistance` functions in `geo.js`. Exactly right, and it's why the scoring model needs no separate explanation.
- **Autocomplete-only guessing.** Turning the input into browse-and-select rather than free text eliminates the single biggest plausible frustration in this genre — not knowing how "Teotihuacán" is spelled — and it filters out already-guessed entities so the list stays relevant each turn.
- **The always-visible `ColorLegend`** placed directly above the guess list is a deliberate working-memory accommodation (per its own code comment) — players don't have to remember the how-to-play explanation mid-guess.

#### Priority Issues

**[P1] Polygon rendering glitch — real mechanism, confirmed via geometry analysis, not reproduced on camera.**
- **Why it matters**: it's a defect on the single visual centerpiece of the game, and it's confirmed to exist in the data, not just alleged.
- **Evidence**: `turf.kinks()` across every entity in every year file found **292 entity/year combinations with genuine self-intersecting rings** (e.g. Carolingian Empire in 800 CE, Qing Empire in 1783, France in 1279/1300/1400, USSR in 1920). Separately, and more concretely: `1938.json` **"Trucial Oman"** and **"Qatar"** each contain two byte-identical, 100%-overlapping sub-polygons — the same ring merged in twice — as do "Karankawa" (1492), "Franks" (500), and "Guanches" (800/900). Two coincident triangulated surfaces at the same fixed `polygonAltitude` (0.006, `Globe.jsx:50`) on an unlit `MeshBasicMaterial` is the textbook cause of GPU z-fighting, which reads visually as exactly the diagonal-hatching/moiré pattern you saw.
- **Root cause**: `mergeGeometries()` in `scripts/build-data.mjs` concatenates every same-named feature's rings into one MultiPolygon with no de-duplication, and `simplifyFeature()` runs `turf.simplify(feature, { tolerance: 0.05, highQuality: false })` — low-quality Douglas-Peucker over that merged geometry — with no post-simplify validity check.
- **Fix**: (1) de-duplicate identical rings in `mergeGeometries()` before pushing them in — hash each ring and skip exact repeats; (2) run `turf.kinks()` after `simplifyFeature()` as a validation gate, falling back to unsimplified geometry when simplification introduces new self-intersections; (3) switch to `highQuality: true`, which is measurably less prone to creating self-intersections at a given tolerance.
- **Suggested command**: `/impeccable optimize` (technical fix, not a visual-language change).

**[P1] The "you lost" state is fully built and completely unreachable.**
- **Why it matters**: `ShareResult.jsx` implements a real `X/∞` losing state with its own copy, but `showShare` in `Play.jsx` only ever flips to `true` from `useEffect(() => { if (game.solved) setShowShare(true) }, [game.solved])` — there is no code path that opens it when the player does *not* solve the puzzle. A player who can't or won't solve the daily has zero closure: no reveal, no way to see the state that's already written and styled.
- **Fix**: either wire a "Give up / reveal answer" action (in `HintPanel` or near `GuessList`) that opens `ShareResult` in its unsolved branch, or remove the dead branch and its copy if endless-guessing is the intended design.
- **Suggested command**: `/impeccable onboard` (this is squarely a first-run/session-completion flow gap).

**[P2] Unrecognized guess text is a silent no-op.**
- **Why it matters**: pressing Enter with zero autocomplete matches calls `submit(undefined)`, which returns immediately with no visible feedback. A first-timer typing a plausible-but-wrong guess (e.g. "France" for a 1000 BCE puzzle) gets nothing — reads as the input being broken, not as their guess being invalid.
- **Fix**: surface inline copy on an empty-match Enter — "No match for that year — try another spelling or era."
- **Suggested command**: `/impeccable clarify`.

**[P2] Landing's only CTA routes past gameplay, not into it.**
- **Why it matters**: `Landing.jsx`'s hero button is `<Link to="/how-to-play">`, not `/play` — every first-time visitor is forced through a second page before they can play at all, even ones who already understand the concept from the hero copy.
- **Fix**: either point the hero CTA straight at `/play` (how-to-play stays one click away in nav), or add a second, primary "Play Today's Chronole" button alongside the existing one.
- **Suggested command**: `/impeccable onboard`.

**[P3] The winning guess is visually identical to a merely "close" one — a known, deliberate tradeoff.**
- **Why it matters**: `useGame.js`'s `colorFor` intentionally colors the correct answer the same as any distance-0 guess (this was changed earlier in this session specifically to fix your "winning country displayed as yellow, not green" report — removing a separate gold "winner" color that contradicted the legend). The tradeoff: the biggest emotional beat in the session now gets zero dedicated visual signal beyond the modal.
- **Fix**: something *outside* the legend's color channel — a brief pulse/glow animation on the winning polygon, or a thin gold stroke around it — preserves the "green=close" semantic while still marking the answer as distinct.
- **Suggested command**: `/impeccable delight`.

#### Persona Red Flags

**Jordan (First-Timer)**: Landing's only CTA routes to How-to-Play, not gameplay (P2 above) — an extra mandatory hop before "the fun part." A wrong-era guess produces total silence, reading as broken rather than wrong. And critically: this build's `localStorage` still had a prior solved state for a puzzle day (from earlier testing in this session) — Jordan's very first view of `/play` was a modal blocking the board with only "Copy result"/"Close," no visible path to actually understanding how to play.

**Casey (Mobile)**: `.globe-container { height: 50vh }` on mobile means the core "type a guess → watch the map light up" loop requires scrolling down to type, then back up to see the reaction — every single guess, on the device most people will actually play on. The `AdSlot` placeholder sits directly inside the single-column stacked flow between the hint panel and guess list below the 860px breakpoint, interrupting game content on the smallest screen. `.guess-suggestions li` rows measure roughly 32-36px tall — under the ~44px touch-target guideline for a scrolling tap list.

**Riley (Stress-Tester)**: No give-up/reveal path exists anywhere (P1 above) — deliberately trying to "lose" just leaves Riley stuck with infinite guesses and a hint that never gives the actual answer. The puzzle-load failure state (`Couldn't load today's puzzle. Try refreshing.`) has no retry button — the only recourse is a manual browser refresh. Repeatedly submitting gibberish produces no error, no shake, nothing — safe, but also silent.

#### Minor Observations

- Browser-injected overlay scan flagged `clipped-overflow-container` on `div.globe-container` (`Globe.jsx:38`) on both `/play` and `/practice` — not independently confirmed as visually broken, worth a quick manual check.
- `buildShareText`'s `X/∞` copy for an unsolved run is currently unreachable (ties to the P1 dead-branch finding above).
- In-game bucket labels ("Very close," "Far") are text-only and don't reuse the 🟩🟨🟧🟥 emoji that the same `bucketForDistance` function produces for the share grid — a small missed reinforcement between in-game and post-game vocabulary.
- `.guess-swatch` has a fixed `rgba(0,0,0,.25)` border regardless of theme; on the darkest guess colors in dark mode it nearly disappears.
- The About page's data-provenance section (pinned commit, GPL-3.0 attribution) is an unusually honest, well-executed piece of infrastructure.
- No loading skeleton for the globe itself — the canvas simply pops in once entity data resolves.

#### Questions to Consider

1. If the winning guess is deliberately colored identically to a "very close" one to protect the legend's honesty, what *should* signal "you won" instead — and is that worth building before the next critique pass?
2. `ShareResult` fully implements a "you didn't solve it" state that no code path can currently reach — was a give-up mechanic cut, or just not wired up yet? Either answer changes what happens to that dead branch.
3. The globe carries none of the "historical atlas" visual language the rest of the app commits to (serif type, gold accents) — is a generic dark-sphere geo-visualization the intended long-term look, or a placeholder worth revisiting?
