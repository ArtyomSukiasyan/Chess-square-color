export type SquareColor = "white" | "black";

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export interface Square {
  file: number; // 0 = a … 7 = h
  rank: number; // 1 … 8
}

export function squareName({ file, rank }: Square): string {
  return `${FILES[file]}${rank}`;
}

// a1 is dark; a square is light when file index (0-based) + rank is even.
export function squareColor({ file, rank }: Square): SquareColor {
  return (file + rank) % 2 === 0 ? "white" : "black";
}

export function randomSquare(exclude?: Square): Square {
  let square: Square;
  do {
    square = {
      file: Math.floor(Math.random() * 8),
      rank: Math.floor(Math.random() * 8) + 1,
    };
  } while (exclude && square.file === exclude.file && square.rank === exclude.rank);
  return square;
}
