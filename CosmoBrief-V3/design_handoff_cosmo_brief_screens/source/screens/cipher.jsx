/* Daily Cipher — full-screen Wordle as newspaper puzzle page */
const { useState: useStateCipher, useEffect: useEffectCipher } = React;

const SOLUTION = "ORBIT";
const ALL_WORDS = ["ORBIT","STARS","COMET","NEBLA","LUNAR","SOLAR","SPACE","FLARE","TITAN","MOONS","ALIEN","CRATR"];

function buildRow(guess, solution) {
  const sol = solution.split("");
  const g = guess.padEnd(5, " ").split("");
  const used = Array(5).fill(false);
  const out = g.map(() => "empty");
  // pass 1: correct
  g.forEach((c, i) => {
    if (c === sol[i]) { out[i] = "correct"; used[i] = true; }
  });
  // pass 2: present
  g.forEach((c, i) => {
    if (out[i] === "correct" || c === " ") return;
    const idx = sol.findIndex((s, j) => !used[j] && s === c);
    if (idx >= 0) { out[i] = "present"; used[idx] = true; }
    else out[i] = "absent";
  });
  return out;
}

const PRESET_GUESSES = ["STARS", "SOLAR", "ORBIT"];

const PAST_PUZZLES = [
  { n: "0116", word: "P L U M E", solved: true, attempts: 4 },
  { n: "0115", word: "E P O C H", solved: true, attempts: 3 },
  { n: "0114", word: "F L A R E", solved: false, attempts: 6 },
  { n: "0113", word: "C O M E T", solved: true, attempts: 2 },
  { n: "0112", word: "L U N A R", solved: true, attempts: 5 },
];

function CipherPage() {
  const [guesses, setGuesses] = useStateCipher(PRESET_GUESSES);
  const [current, setCurrent] = useStateCipher("");
  const won = guesses.includes(SOLUTION);

  const submit = () => {
    if (current.length !== 5 || guesses.length >= 6 || won) return;
    setGuesses([...guesses, current.toUpperCase()]);
    setCurrent("");
  };

  const onKey = (k) => {
    if (won || guesses.length >= 6) return;
    if (k === "ENTER") { submit(); return; }
    if (k === "DEL") { setCurrent(c => c.slice(0, -1)); return; }
    if (current.length < 5) setCurrent(c => (c + k).slice(0, 5));
  };

  // build rows
  const rows = [];
  for (let i = 0; i < 6; i++) {
    if (i < guesses.length) {
      const g = guesses[i];
      const states = buildRow(g, SOLUTION);
      rows.push(g.split("").map((c, j) => ({ c, s: states[j] })));
    } else if (i === guesses.length) {
      const padded = current.padEnd(5, " ");
      rows.push(padded.split("").map((c, j) => ({ c: c === " " ? "" : c, s: c === " " ? "empty" : "typing" })));
    } else {
      rows.push(Array(5).fill({ c: "", s: "empty" }));
    }
  }

  // letter states for keyboard
  const letterState = {};
  guesses.forEach(g => {
    const states = buildRow(g, SOLUTION);
    g.split("").forEach((c, i) => {
      const prev = letterState[c];
      const cur = states[i];
      const rank = { correct: 3, present: 2, absent: 1 };
      if (!prev || rank[cur] > rank[prev]) letterState[c] = cur;
    });
  });

  const KB = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

  return (
    <div className="cb-root cipher-root" data-screen-label="Daily Cipher">
      <CBMasthead />
      <CBBrandBar
        left={["Puzzle pages · No. 0117", "Daily cipher · 5 letters"]}
        actions={<>
          <span className="cb-chip">Archive</span>
          <span className="cb-chip">Rules</span>
        </>}
      />
      <CBTabNav active="wordle" onChange={() => {}} liveLabel="Puzzle posted at 00:00 UTC" />

      <header className="cipher-head">
        <div className="cipher-head-inner">
          <div className="cb-section-num">§ The Daily Cipher</div>
          <h1 className="cipher-title">Five letters. Six tries. <em>One</em> small astronomical word.</h1>
          <div className="cipher-rule"></div>
          <p className="cipher-deck">Submitted at <strong>00:00 UTC</strong> · Word lifted from the night-sky lexicon · Solve before midnight to keep the streak alive.</p>
        </div>
      </header>

      <main className="cipher-main">
        <section className="cipher-stage">
          <div className="cipher-stage-meta">
            <span>Cipher · 0117</span>
            <span className="dot">·</span>
            <span>Attempt {Math.min(guesses.length + (won ? 0 : 1), 6)} of 6</span>
            <span className="dot">·</span>
            <span className={"status " + (won ? "won" : "open")}>{won ? "Solved" : "Open"}</span>
          </div>
          <div className="cipher-board">
            {rows.map((row, ri) => (
              <div key={ri} className="cipher-row">
                {row.map((tile, ci) => (
                  <div key={ci} className={"cipher-tile " + tile.s}>{tile.c}</div>
                ))}
              </div>
            ))}
          </div>

          <div className="cipher-input-row">
            <input
              className="cipher-input"
              value={current}
              onChange={(e) => { const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5); setCurrent(v); }}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="type a 5-letter guess"
              maxLength={5}
              disabled={won || guesses.length >= 6}
            />
            <button className="cipher-submit" onClick={submit} disabled={current.length !== 5 || won || guesses.length >= 6}>
              Submit guess →
            </button>
          </div>

          <div className="cipher-keyboard">
            {KB.map((row, ri) => (
              <div key={ri} className="cipher-kb-row">
                {ri === 2 && <button className="cipher-key wide" onClick={() => onKey("ENTER")}>Enter</button>}
                {row.split("").map(k => (
                  <button key={k} className={"cipher-key " + (letterState[k] || "")} onClick={() => onKey(k)}>{k}</button>
                ))}
                {ri === 2 && <button className="cipher-key wide" onClick={() => onKey("DEL")}>Del</button>}
              </div>
            ))}
          </div>
        </section>

        <aside className="cipher-side">
          <div className="cipher-clue">
            <div className="cb-kicker">Clue · soft hint</div>
            <p className="cipher-clue-text">"What every Tuesday Edition does around something larger than itself."</p>
            <span className="cipher-clue-foot">— The Editor, 04:12 UTC</span>
          </div>

          <div className="cipher-stats">
            <h4>Your record</h4>
            <div className="cipher-stat-grid">
              <div><strong>14</strong><span>day streak</span></div>
              <div><strong>112</strong><span>played</span></div>
              <div><strong>91%</strong><span>win rate</span></div>
              <div><strong>3.8</strong><span>avg attempts</span></div>
            </div>
            <div className="cipher-distribution">
              <h5>Distribution</h5>
              {[
                { n: 1, c: 2 }, { n: 2, c: 8 }, { n: 3, c: 31 }, { n: 4, c: 42 }, { n: 5, c: 19 }, { n: 6, c: 8 }
              ].map(d => (
                <div key={d.n} className="cipher-dist-row">
                  <span className="dn">{d.n}</span>
                  <span className="db"><span style={{width: (d.c / 42 * 100) + "%"}}>{d.c}</span></span>
                </div>
              ))}
            </div>
          </div>

          <div className="cipher-archive">
            <h4>Past puzzles</h4>
            <ul>
              {PAST_PUZZLES.map(p => (
                <li key={p.n}>
                  <span className="num">No. {p.n}</span>
                  <span className="word">{p.word}</span>
                  <span className={"res " + (p.solved ? "ok" : "miss")}>{p.solved ? p.attempts + "/6" : "X/6"}</span>
                </li>
              ))}
            </ul>
            <a className="cipher-archive-more">See full archive →</a>
          </div>

          <div className="cipher-share">
            <button className="cipher-share-btn">Share result →</button>
            <span>Copies your tile pattern as text</span>
          </div>
        </aside>
      </main>

      <CBFooter />
    </div>
  );
}

window.CipherPage = CipherPage;
