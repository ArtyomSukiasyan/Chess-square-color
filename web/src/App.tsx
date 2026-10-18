import { useCallback, useEffect, useState } from "react";
import MiniBoard from "./MiniBoard";
import { Square, SquareColor, randomSquare, squareColor, squareName } from "./squares";

const AUTO_NEXT_MS = 700;
const BEST_STREAK_KEY = "square-color:best-streak";

type Answer = { guess: SquareColor; correct: boolean } | null;

function loadBestStreak(): number {
  try {
    return Number(localStorage.getItem(BEST_STREAK_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBestStreak(value: number) {
  try {
    localStorage.setItem(BEST_STREAK_KEY, String(value));
  } catch {
    // Storage unavailable (private mode etc.) — best streak just won't persist.
  }
}

export default function App() {
  const [square, setSquare] = useState<Square>(() => randomSquare());
  const [answer, setAnswer] = useState<Answer>(null);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(loadBestStreak);

  const next = useCallback(() => {
    setSquare((prev) => randomSquare(prev));
    setAnswer(null);
  }, []);

  const guess = useCallback(
    (color: SquareColor) => {
      if (answer) return;
      const isCorrect = squareColor(square) === color;

      setAnswer({ guess: color, correct: isCorrect });
      setTotal((t) => t + 1);
      if (isCorrect) {
        setCorrect((c) => c + 1);
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
          saveBestStreak(newStreak);
        }
      } else {
        setStreak(0);
      }
    },
    [answer, square, streak, bestStreak]
  );

  const reset = () => {
    setCorrect(0);
    setTotal(0);
    setStreak(0);
    next();
  };

  // Correct answers move on automatically; wrong ones wait so the board can be studied.
  useEffect(() => {
    if (!answer?.correct) return;
    const id = setTimeout(next, AUTO_NEXT_MS);
    return () => clearTimeout(id);
  }, [answer, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "w" || key === "arrowleft") guess("white");
      else if (key === "b" || key === "arrowright") guess("black");
      else if ((key === "enter" || key === " ") && answer) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guess, next, answer]);

  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const actual = squareColor(square);

  return (
    <main className="app">
      <header>
        <h1>Square Color</h1>
        <p className="subtitle">Is the square white or black?</p>
      </header>

      <section className="stats" aria-label="Score">
        <Stat label="Score" value={`${correct}/${total}`} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Streak" value={streak} />
        <Stat label="Best" value={bestStreak} />
      </section>

      <section className="prompt">
        <div
          className={`square-name${answer ? (answer.correct ? " correct" : " wrong") : ""}`}
          aria-live="polite"
        >
          {squareName(square)}
        </div>

        <div className="feedback" aria-live="polite">
          {answer &&
            (answer.correct
              ? "Correct!"
              : `Wrong — ${squareName(square)} is ${actual}.`)}
        </div>

        <div className="choices">
          <button
            className={`choice white${answer?.guess === "white" ? " picked" : ""}`}
            onClick={() => guess("white")}
            disabled={!!answer}
          >
            White <kbd>W</kbd>
          </button>
          <button
            className={`choice black${answer?.guess === "black" ? " picked" : ""}`}
            onClick={() => guess("black")}
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
            {!answer.correct && (
              <button className="next" onClick={next} autoFocus>
                Next <kbd>Enter</kbd>
              </button>
            )}
          </>
        ) : (
          <div className="mini-board placeholder" aria-hidden="true" />
        )}
      </section>

      <footer>
        <button className="link" onClick={reset}>
          Reset score
        </button>
        <a className="link" href="/privacy/">
          Privacy
        </a>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
