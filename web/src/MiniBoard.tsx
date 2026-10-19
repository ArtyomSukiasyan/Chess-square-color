import { FILES, RANKS, Square, squareColor, squareName } from "./squares";

interface MiniBoardProps {
  target?: Square;
  showCoords?: boolean;
}

export default function MiniBoard({ target, showCoords = true }: MiniBoardProps) {
  const ranks = [...RANKS].reverse();

  return (
    <div className="mini-board" aria-hidden="true">
      {ranks.map((rank) =>
        FILES.map((_, file) => {
          const square = { file, rank };
          const isTarget = file === target?.file && rank === target?.rank;
          return (
            <div
              key={squareName(square)}
              className={`mini-square ${squareColor(square)}${isTarget ? " target" : ""}`}
            >
              {showCoords && file === 0 && <span className="coord rank">{rank}</span>}
              {showCoords && rank === 1 && <span className="coord file">{FILES[file]}</span>}
            </div>
          );
        })
      )}
    </div>
  );
}
