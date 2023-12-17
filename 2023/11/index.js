import fs from "fs";
import path from "path";

const INPUT_SRC = path.resolve(
  process.cwd(),
  process.argv.slice(2).at(0) || "input.txt"
);

const parseUniverse = (grid) =>
  ((universe) =>
    universe.map((row) =>
      row.map((cell) => ({
        ...cell,
        id: cell.isEmpty
          ? "."
          : 1 +
            universe
              .flat()
              .filter((c) => !c.isEmpty)
              .indexOf(cell),
      }))
    ))(
    grid.map((row) =>
      row.map((c) => ({
        c,
        isEmpty: c !== "#",
      }))
    )
  );

const expandGalaxies = (grid, n = 2) => {
  const emptyRows = grid
    .map((r, i) => ({
      i,
      isEmpty: r.every((c) => c.isEmpty),
    }))
    .filter(({ isEmpty }) => isEmpty);
  const emptyColumns = grid
    .at(0)
    .map((c, i) => ({
      i,
      isEmpty: grid.every((r) => r[i].isEmpty),
    }))
    .filter(({ isEmpty }) => isEmpty);
  const galaxies = grid
    .flatMap((row, y) =>
      row.map((cell, x) => ({
        ...cell,
        y: y + (n - 1) * emptyRows.filter(({ i }) => i < y).length,
        x: x + (n - 1) * emptyColumns.filter(({ i }) => i < x).length,
      }))
    )
    .filter(({ isEmpty }) => !isEmpty);
  return galaxies;
};

const chart = (grid) =>
  grid.map((row, y) =>
    row.map((cell, x) => ({
      ...cell,
      x,
      y,
    }))
  );

const pixelDist = (_, a, b) => {
  const dx = Math.abs(b.x - a.x);
  const sx = a.x < b.x ? 1 : -1;
  const dy = -Math.abs(b.y - a.y);
  const sy = a.y < b.y ? 1 : -1;
  let er = dx + dy;
  let e2;
  let ch = 0;
  for (let x = a.x, y = a.y; x !== b.x || y !== b.y; ) {
    ch++;
    if (x === b.x && y === b.y) break;

    e2 = 2 * er;

    if (e2 > dy) {
      er += dy;
      x += sx;
    } else if (e2 < dx) {
      er += dx;
      y += sy;
    }
  }
  return { length: ch };
};

const measureExpanded = (grid, factor) =>
  expandGalaxies(grid, factor).map((g, i, a) => ({
    ...g,
    to: a.slice(i + 1).map((o, j, x) => ({
      ...o,
      dist: pixelDist(g, o),
    })),
  }));

const parse = async (input) => {
  const compact = chart(
    parseUniverse(
      (await input)
        .trim()
        .split("\n")
        .map((r) => r.trim().split(""))
    )
  );
  return {
    partA: measureExpanded(compact, 2)
      .flatMap(({ to }) => to.map((t) => t.dist))
      .reduce((a, b) => a + b, 0),
    partB: measureExpanded(compact, 1_000_000)
      .flatMap(({ to }) => to.map((t) => t.dist))
      .reduce((a, b) => a + b, 0),
  };
};
parse(fs.promises.readFile(INPUT_SRC, "utf-8")).then(console.log);
