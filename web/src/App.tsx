import { type ReactNode, useCallback, useEffect, useState } from "react";
import MiniBoard from "./MiniBoard";
import { Square, SquareColor, randomSquare, squareColor, squareName } from "./squares";

// How long an answer stays on screen before the next square.
const AUTO_NEXT_MS = 700;
const TIMED_CORRECT_NEXT_MS = 250;
const TIMED_WRONG_NEXT_MS = 900;

// Untimed bests are keyed by board mode ("hidden"), timed ones by mode and seconds ("hidden:60").
const BESTS_KEY = "square-color:best-streaks";
// Before bests were tracked per board mode; its value belongs to "hidden".
const LEGACY_BEST_STREAK_KEY = "square-color:best-streak";
const BOARD_MODE_KEY = "square-color:board-mode";
const TIMER_KEY = "square-color:timer";
// Phones and narrow windows, where the board and answer buttons sit below the fold.
const SMALL_SCREEN_QUERY = "(max-width: 768px)";

type Answer = { guess: SquareColor; correct: boolean } | null;

// What the board shows while the player is still guessing.
type BoardMode = "hidden" | "coords" | "plain";

const BOARD_MODES: { value: BoardMode; label: string }[] = [
  { value: "hidden", label: "No board" },
  { value: "coords", label: "With notation" },
  { value: "plain", label: "No notation" },
];

// Challenge length in seconds; 0 means no timer.
const TIMERS: { value: number; label: string }[] = [
  { value: 0, label: "Off" },
  { value: 30, label: "30s" },
  { value: 60, label: "1 min" },
  { value: 120, label: "2 min" },
];

// "ready": timer waits for the first answer; "over": time ran out, results are shown.
type RunState = "ready" | "running" | "over";

type Bests = Record<string, number>;

function bestKey(mode: BoardMode, timer: number): string {
  return timer ? `${mode}:${timer}` : mode;
}

function load(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode etc.) — the value just won't persist.
  }
}

function loadBoardMode(): BoardMode {
  const saved = load(BOARD_MODE_KEY);
  return BOARD_MODES.some((m) => m.value === saved) ? (saved as BoardMode) : "hidden";
}

function loadTimer(): number {
  const saved = Number(load(TIMER_KEY));
  return TIMERS.some((t) => t.value === saved) ? saved : 0;
}

function loadBests(): Bests {
  let bests: Bests = {};
  try {
    const saved = JSON.parse(load(BESTS_KEY) ?? "{}");
    if (saved && typeof saved === "object") bests = saved;
  } catch {
    // Corrupted value — start from zero.
  }
  bests.hidden = Math.max(Number(bests.hidden) || 0, Number(load(LEGACY_BEST_STREAK_KEY)) || 0);
  return bests;
}

export default function App() {
  const [square, setSquare] = useState<Square>(() => randomSquare());
  const [answer, setAnswer] = useState<Answer>(null);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bests, setBests] = useState(loadBests);
  const [boardMode, setBoardMode] = useState<BoardMode>(loadBoardMode);
  const [timer, setTimer] = useState(loadTimer);
  const [runState, setRunState] = useState<RunState>("ready");
  const [endsAt, setEndsAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [newRecord, setNewRecord] = useState(false);

  const best = bests[bestKey(boardMode, timer)] ?? 0;
  const timed = timer > 0;
  const remainingMs =
    runState === "running" ? Math.max(0, endsAt - now) : runState === "over" ? 0 : timer * 1000;

  const updateBest = useCallback(
    (key: string, value: number): boolean => {
      if (value <= (bests[key] ?? 0)) return false;
      const updated = { ...bests, [key]: value };
      setBests(updated);
      save(BESTS_KEY, JSON.stringify(updated));
      return true;
    },
    [bests]
  );

  const next = useCallback(() => {
    setSquare((prev) => randomSquare(prev));
    setAnswer(null);
  }, []);

  // Back to a fresh session: clears the score and puts a timed challenge back in "ready".
  const restart = useCallback(() => {
    setCorrect(0);
    setTotal(0);
    setStreak(0);
    setRunState("ready");
    setNewRecord(false);
    next();
  }, [next]);

  // Bumped on taps that change the layout below (settings, answers); the effect scrolls to the
  // end of the page once the new content has rendered.
  const [scrollRequest, setScrollRequest] = useState(0);
  const scrollToEnd = () => setScrollRequest((n) => n + 1);

  useEffect(() => {
    if (!scrollRequest || !window.matchMedia(SMALL_SCREEN_QUERY).matches) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [scrollRequest]);

  const changeBoardMode = (mode: BoardMode) => {
    scrollToEnd();
    if (mode === boardMode) return;
    setBoardMode(mode);
    save(BOARD_MODE_KEY, mode);
    // Bests are per board mode, so switching starts a new streak or challenge.
    if (timed) restart();
    else setStreak(0);
  };

  const changeTimer = (value: number) => {
    scrollToEnd();
    if (value === timer) return;
    setTimer(value);
    save(TIMER_KEY, String(value));
    restart();
  };

  const guess = useCallback(
    (color: SquareColor) => {
      if (answer || runState === "over") return;
      const isCorrect = squareColor(square) === color;

      if (timed && runState === "ready") {
        const start = Date.now();
        setRunState("running");
        setEndsAt(start + timer * 1000);
        setNow(start);
      }

      setAnswer({ guess: color, correct: isCorrect });
      setTotal((t) => t + 1);
      if (isCorrect) {
        setCorrect((c) => c + 1);
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (!timed) updateBest(bestKey(boardMode, 0), newStreak);
      } else {
        setStreak(0);
      }
    },
    [answer, runState, square, timed, timer, streak, boardMode, updateBest]
  );

  // Tick the countdown while a challenge is running.
  useEffect(() => {
    if (runState !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [runState]);

  // Time's up: show results and record the score.
  useEffect(() => {
    if (runState !== "running" || remainingMs > 0) return;
    setRunState("over");
    setAnswer(null);
    setNewRecord(updateBest(bestKey(boardMode, timer), correct));
  }, [runState, remainingMs, boardMode, timer, correct, updateBest]);

  // Move on automatically: always in a challenge, and after correct answers otherwise.
  // An untimed wrong answer waits for "Next" so the board can be studied.
  useEffect(() => {
    if (!answer || runState === "over") return;
    let delay: number;
    if (timed) delay = answer.correct ? TIMED_CORRECT_NEXT_MS : TIMED_WRONG_NEXT_MS;
    else if (answer.correct) delay = AUTO_NEXT_MS;
    else return;
    const id = setTimeout(next, delay);
    return () => clearTimeout(id);
  }, [answer, runState, timed, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "w" || key === "arrowleft") guess("white");
      else if (key === "b" || key === "arrowright") guess("black");
      else if (key === "enter" || key === " ") {
        if (runState === "over") {
          e.preventDefault();
          restart();
        } else if (answer && !timed) {
          e.preventDefault();
          next();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guess, next, restart, answer, runState, timed]);

  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const actual = squareColor(square);
  const secondsLeft = Math.ceil(remainingMs / 1000);

  return (
    <main className="app">
      <header>
        <h1>Square Color</h1>
        <p className="subtitle">Is the square white or black?</p>
      </header>

      <section className="stats" aria-label="Score">
        {timed ? (
          <>
            <Stat label="Time" value={formatSeconds(secondsLeft)} />
            <Stat label="Correct" value={correct} />
          </>
        ) : (
          <Stat label="Streak" value={streak} />
        )}
      </section>

      <div className="settings">
        <Segmented label="Board while guessing">
          {BOARD_MODES.map((mode) => (
            <SegmentButton
              key={mode.value}
              active={boardMode === mode.value}
              onClick={() => changeBoardMode(mode.value)}
            >
              <span>{mode.label}</span>
              <span className="segment-best">Best {bests[bestKey(mode.value, timer)] ?? 0}</span>
            </SegmentButton>
          ))}
        </Segmented>

        <Segmented label="Game time">
          {TIMERS.map((t) => (
            <SegmentButton key={t.value} active={timer === t.value} onClick={() => changeTimer(t.value)}>
              {t.label}
            </SegmentButton>
          ))}
        </Segmented>
      </div>

      {timed && (
        <div
          className="countdown"
          role="progressbar"
          aria-label="Time left"
          aria-valuemin={0}
          aria-valuemax={timer}
          aria-valuenow={secondsLeft}
        >
          <div className="countdown-fill" style={{ width: `${(remainingMs / (timer * 1000)) * 100}%` }} />
        </div>
      )}

      {runState === "over" ? (
        <section className="results" aria-live="polite">
          <p className="results-title">Time&apos;s up!</p>
          <p className="results-score">{correct}</p>
          <p className="results-detail">
            correct in {formatSeconds(timer)} · {total - correct} wrong · {accuracy}% accuracy
          </p>
          <p className="results-best">{newRecord ? "New best!" : `Best: ${best}`}</p>
          <button className="next" onClick={restart} autoFocus>
            Play again <kbd>Enter</kbd>
          </button>
        </section>
      ) : (
        <>
          <section className="prompt">
            <div
              className={`square-name${answer ? (answer.correct ? " correct" : " wrong") : ""}`}
              aria-live="polite"
            >
              {squareName(square)}
            </div>

            <div className="feedback" aria-live="polite">
              {answer
                ? answer.correct
                  ? "Correct!"
                  : `Wrong — ${squareName(square)} is ${actual}.`
                : timed && runState === "ready"
                  ? "The game clock starts with your first answer."
                  : null}
            </div>

            <div className="choices">
              <button
                className={`choice white${answer?.guess === "white" ? " picked" : ""}`}
                onClick={() => {
                  guess("white");
                  scrollToEnd();
                }}
                disabled={!!answer}
              >
                White <kbd>W</kbd>
              </button>
              <button
                className={`choice black${answer?.guess === "black" ? " picked" : ""}`}
                onClick={() => {
                  guess("black");
                  scrollToEnd();
                }}
                disabled={!!answer}
              >
                Black <kbd>B</kbd>
              </button>
            </div>
          </section>

          <section className="reveal">
            {answer ? (
              <>
                <MiniBoard target={square} />
                {!answer.correct && !timed && (
                  <button className="next" onClick={next} autoFocus>
                    Next <kbd>Enter</kbd>
                  </button>
                )}
              </>
            ) : boardMode === "hidden" ? (
              <div className="mini-board placeholder" aria-hidden="true" />
            ) : (
              <MiniBoard showCoords={boardMode === "coords"} />
            )}
          </section>
        </>
      )}

      <footer>
        <button className="link" onClick={restart}>
          Restart
        </button>
        <a className="link" href="/privacy/">
          Privacy
        </a>
      </footer>
    </main>
  );
}

function formatSeconds(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function Segmented({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="setting" role="radiogroup" aria-label={label}>
      <span className="setting-label">{label}</span>
      <div className="segmented">{children}</div>
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button role="radio" aria-checked={active} className={active ? "active" : undefined} onClick={onClick}>
      {children}
    </button>
  );
}
