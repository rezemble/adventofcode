import fs from "fs";
import path from "path";

import colors from "colors";

const INPUT_SRC = path.resolve(
  process.cwd(),
  process.argv.slice(2).at(0) || "input.txt"
);

const DIRECTIONS = {
  LEFT: 0b1000,
  TOP: 0b0100,
  RIGHT: 0b0010,
  DOWN: 0b0001,
};
const DIRMAP = [
  [null, "LEFT", null],
  ["TOP", null, "DOWN"],
  [null, "RIGHT", null],
];
const INVERT = {
  LEFT: "RIGHT",
  RIGHT: "LEFT",
  TOP: "DOWN",
  DOWN: "TOP",
};
const PIPE_TYPES = {
  ".": 0b0000,
  F: 0b0011,
  "-": 0b1010,
  7: 0b1001,
  "|": 0b0101,
  L: 0b0110,
  J: 0b1100,
  S: 0b1111,
};

const CHARS = {
  ".": "⌯",
  F: "┌",
  "-": "─",
  7: "┐",
  "|": "│",
  L: "└",
  J: "┘",
  S: "⎋",
};
const PIPE_WEIGHTS = {
  "|": 1,
  "-": 0,
  F: -0.25,
  7: 0.25,
  J: -0.25,
  L: 0.25,
};

const parsePipes = (text) => {
  const grid = text
    .trim()
    .split("\n")
    .map((line, y) =>
      line
        .trim()
        .split("")
        .map((c, x) => {
          const type = PIPE_TYPES[c];
          return {
            c: CHARS[c],
            x,
            y,
            isStart: c === "S",
            isPipe: type > 0 && type < 15,
            connects: {
              LEFT: !!(DIRECTIONS.LEFT & type),
              TOP: !!(DIRECTIONS.TOP & type),
              RIGHT: !!(DIRECTIONS.RIGHT & type),
              DOWN: !!(DIRECTIONS.DOWN & type),
            },
            get connectsFrom() {
              return {
                LEFT: !!this.neighbors.LEFT?.connects.RIGHT,
                TOP: this.neighbors.TOP?.connects.DOWN,
                RIGHT: !!this.neighbors.RIGHT?.connects.LEFT,
                DOWN: !!this.neighbors.DOWN?.connects.TOP,
              };
            },
            get implied() {
              const res = Object.entries(this.connectsFrom)
                .filter(([_, v]) => !!v)
                .map(([dir]) => DIRECTIONS[dir])
                .reduce((a, b) => a | b, 0b0000);
              return this.isStart
                ? Object.entries(PIPE_TYPES)
                    .find(([_, v]) => v === res)
                    ?.at(0)
                : c;
            },
            neighbors: {
              get LEFT() {
                return x < 1 ? null : grid[y][x - 1];
              },
              get RIGHT() {
                return x >= grid[y].length - 1 ? null : grid[y][x + 1];
              },
              get TOP() {
                return y < 1 ? null : grid[y - 1][x];
              },
              get DOWN() {
                return y >= grid.length - 1 ? null : grid[y + 1][x];
              },
            },
            to(x, y) {
              const dir = DIRMAP[x + 1][y + 1];
              const weights = [PIPE_WEIGHTS[this.implied]];
              let next = this;
              while (next.connectsTo(next.neighbors[dir])) {
                next = next.neighbors[dir];
                weights.push(PIPE_WEIGHTS[next.implied]);
              }
              const sum = Math.min(
                1,
                Math.ceil(
                  Math.abs(
                    weights
                      .filter((w) => typeof w !== "undefined")
                      .reduce((a, b) => a + b, 0)
                  )
                )
              );
              return {
                node: next.neighbors[dir],
                sum,
              };
            },
            connectsTo(other) {
              return this.canReach.includes(other);
            },
            get nextTo() {
              return Object.values(this.neighbors);
            },
            get canReach() {
              return Object.entries(this.connects)
                .filter(([dir, b]) => b)
                .map(([dir]) => [dir, this.neighbors[dir]])
                .filter(
                  ([dir, cell]) =>
                    cell && cell.isPipe && cell.connects[INVERT[dir]]
                )
                .map(([_, cell]) => cell);
            },
            other(p) {
              return this.canReach.find((s) => s !== p);
            },
          };
        })
    );
  grid.start = grid
    .find((r) => r.some((c) => c.isStart))
    .find((c) => c.isStart);
  return grid;
};

const walk = (point) => {
  const next = point.canReach;
  const left = {
    cur: next.at(0),
    prev: point,
    update() {
      const c = this.cur;
      this.cur = this.cur.other(this.prev);
      this.prev = c;
    },
  };
  const right = {
    cur: next.at(1),
    prev: point,
    update() {
      const c = this.cur;
      this.cur = this.cur.other(this.prev);
      this.prev = c;
    },
  };
  const min = {
    x: Infinity,
    y: Infinity,
  };
  const max = {
    x: -1,
    y: -1,
  };
  const path = [point];
  for (let steps = 1; ; steps++) {
    min.x = Math.min(left.cur.x - 1, right.cur.x - 1, min.x);
    min.y = Math.min(left.cur.y - 1, right.cur.y - 1, min.y);
    max.x = Math.max(left.cur.x + 1, right.cur.x + 1, max.x);
    max.y = Math.max(left.cur.y + 1, right.cur.y + 1, max.y);
    path.push(left.cur, right.cur);
    if (
      left.cur === right.cur ||
      left.cur === right.prev ||
      left.prev === right.cur
    )
      return {
        steps,
        left: left.cur,
        right: right.cur,
        min,
        max,
        path,
      };
    left.update();
    right.update();
  }
};

const findArea = (grid, bounds, path) => {
  const rest = grid.flat();
  const seen = [...path];
  const inside = [];
  const outside = [];
  while (rest.some((p) => !seen.includes(p))) {
    const todo = [];
    const point = rest.find((p) => !seen.includes(p));
    todo.push(point);
    const candidates = [point];
    let failed = false;
    let distOutside = -Infinity;
    while (todo.length) {
      const cell = todo.pop();
      seen.push(cell);
      if (
        [bounds.min.x, bounds.max.x].includes(cell.x) ||
        [bounds.min.y, bounds.max.y].includes(cell.y)
      ) {
        failed = true;
      }
      if (!candidates.includes(cell)) {
        candidates.push(cell);
      }
      const next = cell.nextTo;
      if (next.some((v) => !v)) failed = true;
      const border = next.find((p) => path.includes(p));
      if (!failed && border) {
        const dir = {
          x: border.x - cell.x,
          y: border.y - cell.y,
        };
        let steps = 0;
        for (
          let look = cell;
          look &&
          ![bounds.min.x, bounds.max.x].includes(look.x) &&
          ![bounds.min.y, bounds.max.y].includes(look.y);

        ) {
          if (
            !look ||
            look.y + dir.y < 0 ||
            look.x + dir.yx < 0 ||
            look.y + dir.y >= grid.length - 1 ||
            look.x + dir.x >= grid.length[look.y] - 1
          )
            break;
          const { node, sum } = look.to(dir.x, dir.y);
          if (path.includes(look)) steps += sum;
          look = node;
        }
        distOutside = Math.max(distOutside, steps % 2);
      }
      todo.push(
        ...next.filter(
          (c) =>
            c && !seen.includes(c) && !todo.includes(c) && !path.includes(c)
        )
      );
    }
    if (!distOutside) failed = true;
    (failed ? outside : inside).push(...candidates);
  }
  let rownum = 0;
  for (const row of grid) {
    console.log(
      rownum++,
      row
        .map((cell) =>
          path.includes(cell)
            ? colors.gray(cell.c)
            : inside.includes(cell)
            ? colors.green(cell.dist ?? cell.c)
            : outside.includes(cell)
            ? colors.red(cell.c)
            : colors.gray(cell.c)
        )
        .join("")
    );
  }
  return {
    outside: outside.length,
    inside: inside.length,
  };
};

const parse = async (input) => {
  const grid = parsePipes(await input);
  const depth = walk(grid.start);
  return {
    partA: depth.steps,
    partB: findArea(
      grid,
      {
        min: depth.min,
        max: depth.max,
      },
      depth.path
    ).inside,
  };
};
parse(fs.promises.readFile(INPUT_SRC, "utf-8")).then(console.log);
