import { useState, useEffect, useCallback } from "react";
import { getWordleWords } from "../api/wordle";
import { useAuth } from "../context/AuthContext";
import EditorialShell from "../components/EditorialShell";

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const EPOCH = new Date("2026-01-01").getTime();

type TileState = "empty" | "filled" | "correct" | "present" | "absent";
type KeyState = "correct" | "present" | "absent" | "unused";

interface GameState {
  guesses: string[];
  results: TileState[][];
  gameOver: boolean;
  won: boolean;
  date: string;
}

interface StatsData {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  lastWonDate: string;
  lastPlayedDate: string;
  distribution: Record<number, number>;
}

const EMPTY_STATS: StatsData = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastWonDate: "",
  lastPlayedDate: "",
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 },
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function pickDailyWord(words: string[]): string {
  const dayIndex = Math.floor((Date.now() - EPOCH) / 86400000);
  return words[dayIndex % words.length];
}

function puzzleNumberFor(date: Date): number {
  const dayIndex = Math.floor((date.getTime() - EPOCH) / 86_400_000);
  return dayIndex + 1;
}

function dayIndexFor(date: Date): number {
  return Math.floor((date.getTime() - EPOCH) / 86_400_000);
}

function evaluateGuess(guess: string, answer: string): TileState[] {
  const result: TileState[] = Array(WORD_LENGTH).fill("absent");
  const answerChars = answer.split("");
  const guessChars = guess.split("");

  guessChars.forEach((ch, i) => {
    if (ch === answerChars[i]) {
      result[i] = "correct";
      answerChars[i] = "#";
    }
  });

  guessChars.forEach((ch, i) => {
    if (result[i] === "correct") return;
    const idx = answerChars.indexOf(ch);
    if (idx !== -1) {
      result[i] = "present";
      answerChars[idx] = "#";
    }
  });

  return result;
}

function buildKeyStates(guesses: string[], results: TileState[][]): Record<string, KeyState> {
  const states: Record<string, KeyState> = {};
  const priority: Record<string, number> = { correct: 3, present: 2, absent: 1, empty: 0, filled: 0, unused: 0 };

  guesses.forEach((guess, gi) => {
    guess.split("").forEach((ch, ci) => {
      const newState = results[gi]?.[ci];
      if (!newState || newState === "empty" || newState === "filled") return;
      const existing = states[ch];
      if (!existing || priority[newState] > priority[existing]) {
        states[ch] = newState as KeyState;
      }
    });
  });

  return states;
}

function loadGameState(userId: string): GameState | null {
  try {
    const raw = localStorage.getItem(`wordle_${userId}_${todayKey()}`);
    return raw ? (JSON.parse(raw) as GameState) : null;
  } catch {
    return null;
  }
}

function loadGameResult(userId: string, key: string): string | null {
  try {
    const raw = localStorage.getItem(`wordle_${userId}_${key}`);
    if (!raw) return null;
    const state = JSON.parse(raw) as GameState;
    if (!state.gameOver) return null;
    return state.won ? `${state.guesses.length}/6` : "X/6";
  } catch {
    return null;
  }
}

function saveGameState(state: GameState, userId: string) {
  localStorage.setItem(`wordle_${userId}_${todayKey()}`, JSON.stringify(state));
}

function loadStats(userId: string): StatsData {
  try {
    const raw = localStorage.getItem(`wordle_stats_${userId}`);
    if (!raw) return { ...EMPTY_STATS };
    return { ...EMPTY_STATS, ...(JSON.parse(raw) as Partial<StatsData>) };
  } catch {
    return { ...EMPTY_STATS };
  }
}

function saveStats(stats: StatsData, userId: string) {
  localStorage.setItem(`wordle_stats_${userId}`, JSON.stringify(stats));
}

function updateStats(stats: StatsData, didWin: boolean, guessCount: number): StatsData {
  const today = todayKey();
  if (stats.lastPlayedDate === today) return stats;

  const updated: StatsData = {
    ...stats,
    distribution: { ...stats.distribution },
  };
  updated.played += 1;
  updated.lastPlayedDate = today;

  if (didWin) {
    updated.won += 1;
    updated.distribution[guessCount] = (updated.distribution[guessCount] ?? 0) + 1;
    if (stats.lastWonDate === getYesterday()) {
      updated.currentStreak = stats.currentStreak + 1;
    } else if (stats.lastWonDate === today) {
      // already won today — no-op
    } else {
      updated.currentStreak = 1;
    }
    updated.maxStreak = Math.max(updated.maxStreak, updated.currentStreak);
    updated.lastWonDate = today;
  } else {
    updated.distribution[0] = (updated.distribution[0] ?? 0) + 1;
    updated.currentStreak = 0;
  }

  return updated;
}

function getDisplayStreak(stats: StatsData): number {
  const today = todayKey();
  const yesterday = getYesterday();
  if (stats.currentStreak > 0 && stats.lastWonDate !== today && stats.lastWonDate !== yesterday) {
    return 0;
  }
  return stats.currentStreak;
}

const KEYBOARD_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];

export default function Wordle() {
  const { user } = useAuth();
  const [words, setWords] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [guesses, setGuesses] = useState<string[]>([]);
  const [results, setResults] = useState<TileState[][]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shakingRow, setShakingRow] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [revealingRow, setRevealingRow] = useState<number | null>(null);

  const [stats, setStats] = useState<StatsData>({ ...EMPTY_STATS });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getWordleWords();
        setWords(data.words);
        const daily = pickDailyWord(data.words);
        setAnswer(daily);

        setStats(loadStats(user!.userId));

        const saved = loadGameState(user!.userId);
        if (saved) {
          setGuesses(saved.guesses);
          setResults(saved.results);
          setGameOver(saved.gameOver);
          setWon(saved.won);
          if (saved.won) setMessage("Stellar! Come back tomorrow for a new word.");
          else if (saved.gameOver) setMessage(`The word was ${daily}. Try again tomorrow!`);
        }
      } catch {
        setError("Failed to load word list.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [user]);

  const handleKey = useCallback((key: string) => {
    if (gameOver) return;

    if (key === "ENTER" || key === "Enter") {
      if (currentGuess.length < WORD_LENGTH) {
        setShakingRow(guesses.length);
        setTimeout(() => setShakingRow(null), 400);
        return;
      }
      if (!words.includes(currentGuess)) {
        setShakingRow(guesses.length);
        setTimeout(() => setShakingRow(null), 400);
        setMessage("Not a valid space word!");
        setTimeout(() => setMessage(""), 1800);
        return;
      }

      const result = evaluateGuess(currentGuess, answer);
      const newGuesses = [...guesses, currentGuess];
      const newResults = [...results, result];

      setRevealingRow(guesses.length);
      setTimeout(() => setRevealingRow(null), WORD_LENGTH * 120 + 200);

      setGuesses(newGuesses);
      setResults(newResults);
      setCurrentGuess("");

      const isWin = result.every((r) => r === "correct");
      const isLoss = !isWin && newGuesses.length >= MAX_GUESSES;

        if (isWin) {
          setWon(true);
          setGameOver(true);
          setMessage("Stellar! Come back tomorrow for a new word.");
          saveGameState({ guesses: newGuesses, results: newResults, gameOver: true, won: true, date: todayKey() }, user!.userId);
          const newStats = updateStats(stats, true, newGuesses.length);
          setStats(newStats);
          saveStats(newStats, user!.userId);
        } else if (isLoss) {
          setGameOver(true);
          setMessage(`The word was ${answer}. Try again tomorrow!`);
          saveGameState({ guesses: newGuesses, results: newResults, gameOver: true, won: false, date: todayKey() }, user!.userId);
          const newStats = updateStats(stats, false, newGuesses.length);
          setStats(newStats);
          saveStats(newStats, user!.userId);
        } else {
        saveGameState({ guesses: newGuesses, results: newResults, gameOver: false, won: false, date: todayKey() }, user!.userId);
      }
    } else if (key === "⌫" || key === "Backspace") {
      setCurrentGuess((g) => g.slice(0, -1));
    } else if (/^[A-Za-z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
      setCurrentGuess((g) => g + key.toUpperCase());
    }
  }, [gameOver, currentGuess, guesses, results, answer, words, user, stats]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const relevant = /^[A-Za-z]$/.test(e.key) || e.key === "Backspace" || e.key === "Enter" || e.key === "Tab";
      if (relevant) e.preventDefault();
      handleKey(e.key);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  function getTileState(rowIdx: number, colIdx: number): TileState {
    if (rowIdx < guesses.length) {
      return results[rowIdx]?.[colIdx] ?? "absent";
    }
    if (rowIdx === guesses.length) {
      return currentGuess[colIdx] ? "filled" : "empty";
    }
    return "empty";
  }

  function getTileChar(rowIdx: number, colIdx: number): string {
    if (rowIdx < guesses.length) return guesses[rowIdx][colIdx] ?? "";
    if (rowIdx === guesses.length) return currentGuess[colIdx] ?? "";
    return "";
  }

  function getTileClass(rowIdx: number, colIdx: number): string {
    const state = getTileState(rowIdx, colIdx);
    const base = "cipher-tile";
    const isRevealing = revealingRow === rowIdx;
    const flip = isRevealing ? " flipping" : "";
    if (state === "empty") return `${base} empty`;
    if (state === "filled") return `${base} typing`;
    return `${base} ${state}${flip}`;
  }

  function getTileStyle(rowIdx: number, colIdx: number): React.CSSProperties {
    if (revealingRow === rowIdx && rowIdx < guesses.length) {
      return { animationDelay: `${colIdx * 120}ms` };
    }
    return {};
  }

  function handleShare() {
    const emojiMap: Record<TileState, string> = {
      correct: "🟩",
      present: "🟨",
      absent: "⬛",
      empty: "⬜",
      filled: "⬜",
    };
    const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const result = won ? `${guesses.length}/6` : "X/6";
    const grid = results.map((row) => row.map((t) => emojiMap[t]).join("")).join("\n");
    const text = `Space Wordle — ${date}\n${result}\n\n${grid}`;

    const doShare = async () => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // fallback for HTTP / non-secure contexts
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;opacity:0;top:0;left:0;pointer-events:none";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    };

    void doShare();
  }

  const keyStates = buildKeyStates(guesses, results);

  function getKeyClass(key: string): string {
    const state = keyStates[key] ?? "unused";
    const wide = key === "ENTER" || key === "⌫" ? " wide" : "";
    return `cipher-key${wide} ${state !== "unused" ? state : ""}`.trim();
  }

  const distValues = [1, 2, 3, 4, 5, 6].map((k) => stats.distribution[k] ?? 0);
  const maxDist = Math.max(...distValues, 1);

  const statBoxes = [
    { value: stats.played, label: "Played" },
    { value: stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0, label: "Win %" },
    { value: getDisplayStreak(stats), label: "Current Streak" },
    { value: stats.maxStreak, label: "Max Streak" },
  ];
  const todayPuzzleNo = puzzleNumberFor(new Date());
  const statusLabel = gameOver ? (won ? "Solved" : "Missed") : "Open";
  const statusClass = gameOver ? (won ? "won" : "lost") : "open";
  const pastPuzzles = user && words.length > 0
    ? Array.from({ length: 5 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const dayIndex = dayIndexFor(d);
      const idx = ((dayIndex % words.length) + words.length) % words.length;
      const word = words[idx] ?? "";
      const result = loadGameResult(user.userId, key);
      return {
        key,
        puzzleNo: puzzleNumberFor(d),
        word,
        result,
        dateLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
    })
    : [];

  if (loading || error) {
    return (
      <EditorialShell>
        <div className="cipher-root">
          <div className="cipher-head">
            <div className="cipher-head-inner">
              <div className="cipher-title">Daily <em>Cipher</em></div>
              <div className="cipher-rule" />
              <div className="cipher-deck">Guess the five-letter space word.</div>
            </div>
          </div>
          <div className="cipher-main">
            <div className="cipher-stage">
              <div className="cipher-msg">{error || "Loading word list…"}</div>
            </div>
          </div>
        </div>
      </EditorialShell>
    );
  }

  return (
    <EditorialShell>
      <div className="cipher-root">
        <div className="cipher-head">
          <div className="cipher-head-inner">
            <div className="cipher-title">Daily <em>Cipher</em></div>
            <div className="cipher-rule" />
            <div className="cipher-deck">
              Guess the five-letter space word · <strong>{MAX_GUESSES}</strong> attempts · <strong>{words.length}</strong> words in rotation
            </div>
          </div>
        </div>

        <div className="cipher-main">
          <div className="cipher-stage">
            <div className="cipher-stage-meta">
              <span>Puzzle #{String(todayPuzzleNo).padStart(4, "0")}</span>
              <span className="dot">·</span>
              <span className={`status ${statusClass}`}>{statusLabel}</span>
            </div>

            <div className="cipher-msg">{message || " "}</div>

            <div className="cipher-board">
              {Array.from({ length: MAX_GUESSES }, (_, rowIdx) => (
                <div
                  key={rowIdx}
                  className={`cipher-row${shakingRow === rowIdx ? " shake" : ""}`}
                >
                  {Array.from({ length: WORD_LENGTH }, (_, colIdx) => (
                    <div
                      key={colIdx}
                      className={getTileClass(rowIdx, colIdx)}
                      style={getTileStyle(rowIdx, colIdx)}
                    >
                      {getTileChar(rowIdx, colIdx)}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="cipher-keyboard">
              {KEYBOARD_ROWS.map((row, i) => (
                <div key={i} className="cipher-kb-row">
                  {row.map((key) => (
                    <button
                      key={key}
                      className={getKeyClass(key)}
                      onClick={() => handleKey(key === "⌫" ? "Backspace" : key === "ENTER" ? "Enter" : key)}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="cipher-side">
            <div className="cipher-clue">
              <div className="cb-kicker naked">Editor's clue</div>
              <div className="cipher-clue-text">
                {gameOver
                  ? won
                    ? "A stellar solve — your orbit is finely tuned."
                    : "The cosmos keeps its secrets for now. Return tomorrow."
                  : "Five letters, one orbit. The answer hides in plain starlight."}
              </div>
              <span className="cipher-clue-foot">— The Editor</span>
            </div>

            <div>
              <h4>Stats</h4>
              <div className="cipher-stats-grid">
                {statBoxes.map(({ value, label }) => (
                  <div key={label}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="cipher-distribution">
              <h4>Guess distribution</h4>
              {[1, 2, 3, 4, 5, 6].map((n) => {
                const count = stats.distribution[n] ?? 0;
                const pct = Math.max((count / maxDist) * 100, 7);
                const isCurrent = gameOver && won && guesses.length === n;
                return (
                  <div key={n} className="cipher-dist-row">
                    <span className="dn">{n}</span>
                    <div className="db">
                      <span style={{ width: `${pct}%`, opacity: isCurrent ? 1 : 0.8 }}>{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cipher-share">
              <button className="cipher-share-btn" onClick={handleShare} disabled={!gameOver}>
                {copied ? "Copied ✓" : "Share"}
              </button>
              <span className="cipher-share-note">{gameOver ? "Share your grid" : "Solve today to share"}</span>
            </div>

            {pastPuzzles.length > 0 && (
              <div className="cipher-archive">
                <h4>Past puzzles</h4>
                <div className="cipher-archive-list">
                  {pastPuzzles.map((p) => (
                    <div key={p.key} className="cipher-archive-row">
                      <div className="cipher-archive-num">No. {String(p.puzzleNo).padStart(4, "0")}</div>
                      <div className="cipher-archive-word">{p.word.split("").join(" ")}</div>
                      <div className="cipher-archive-result">{p.result ?? "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </EditorialShell>
  );
}
