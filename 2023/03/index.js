import fs from "fs";
import path from "path";

const INPUT_SRC = path.resolve(
  process.cwd(),
  process.argv.slice(2).at(0) || "input.txt"
);

const adjacent = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, -1],
  [0, 1],
];
const nextTo = [
  [-1, 0],
  [1, 0],
];

const parse = async (input) => {
  const getAt = (chars, x, y) =>
    x < 0 || y < 0 || y >= chars.length || x >= chars[y].length
      ? null
      : chars[y][x];
  const chars = (await input)
    .trim()
    .split("\n")
    .map((s) => s.split(""))
    .map((l, y) =>
      l.map((c, x) => ({
        c,
        isNumeric: !isNaN(+c),
        isSymbol: isNaN(+c) && c !== ".",
        y,
        x,
        get gearNeighbors() {
          return this.neighbors
            .filter((n) => !!n && n.isNumeric)
            .reduce(
              (a, b) => (a.some((p) => p.group === b.group) ? a : [...a, b]),
              []
            );
        },
        get isGear() {
          return c === "*" && this.gearNeighbors.length === 2;
        },
        get gearRatio() {
          if (!this.isGear) return null;
          return this.gearNeighbors
            .map((n) => n.numericValue)
            .reduce((a, b) => a * b, 1);
        },
        get groupX() {
          return Math.min(this.x, ...this.partOf().map(({ x }) => x));
        },
        get groupY() {
          return Math.min(this.y, ...this.partOf().map(({ y }) => y));
        },
        get group() {
          return [this.groupX, this.groupY].join(";");
        },
        get partners() {
          return this.partOf().sort(({ x: a }, { x: b }) => a - b);
        },
        get numericValue() {
          return +this.partners.map(({ c }) => c).join("");
        },
        get neighbors() {
          return adjacent
            .map(([_x, _y]) => getAt(chars, x + _x, y + _y))
            .filter(Boolean);
        },
        partOf(ignore = []) {
          if (ignore.includes(this)) return [];
          return [
            this,
            ...new Set(
              nextTo
                .map(([_x, _y]) => getAt(chars, x + _x, y + _y))
                .filter(Boolean)
                .filter((n) => n.isNumeric)
                .flatMap((b) => [b, ...b.partOf([...ignore, this])])
            ),
          ].filter((f) => !ignore.includes(f));
        },
        get isRelevant() {
          return this.isNumeric && !!this.neighbors.some((n) => n.isSymbol);
        },
      }))
    );
  const flat = chars.flat();
  const partA = Object.values(
    flat
      .filter((n) => n.isNumeric)
      .reduce(
        (a, b) => ({
          ...a,
          [b.group]: [...(a[b.group] || []), b],
        }),
        {}
      )
  )
    .filter((g) => g.some(({ isRelevant }) => isRelevant))
    .map((g) => g.at(0).numericValue)
    .reduce((a, b) => a + b, 0);

  const partB = flat
    .filter((c) => c.isGear)
    .map((c) => c.gearRatio)
    .reduce((a, b) => a + b, 0);

  return {
    partA,
    partB,
  };
};

parse(fs.promises.readFile(INPUT_SRC, "utf-8")).then(console.log);
