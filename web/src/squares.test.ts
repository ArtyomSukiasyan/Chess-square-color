import { describe, expect, it } from "vitest";
import { FILES, randomSquare, squareColor, squareName } from "./squares";

const parse = (name: string) => ({
  file: FILES.indexOf(name[0] as (typeof FILES)[number]),
  rank: Number(name[1]),
});

describe("squareColor", () => {
  it.each([
    ["a1", "black"],
    ["h1", "white"],
    ["a8", "white"],
    ["h8", "black"],
    ["e4", "white"],
    ["d4", "black"],
    ["f3", "white"],
    ["h6", "black"],
  ])("%s is %s", (name, color) => {
    expect(squareColor(parse(name))).toBe(color);
  });

  it("has 32 squares of each color", () => {
    let white = 0;
    for (let file = 0; file < 8; file++)
      for (let rank = 1; rank <= 8; rank++)
        if (squareColor({ file, rank }) === "white") white++;
    expect(white).toBe(32);
  });
});

describe("randomSquare", () => {
  it("never repeats the excluded square", () => {
    const prev = { file: 4, rank: 4 };
    for (let n = 0; n < 500; n++) {
      const sq = randomSquare(prev);
      expect(squareName(sq)).not.toBe("e4");
      expect(sq.file).toBeGreaterThanOrEqual(0);
      expect(sq.file).toBeLessThan(8);
      expect(sq.rank).toBeGreaterThanOrEqual(1);
      expect(sq.rank).toBeLessThanOrEqual(8);
    }
  });
});
