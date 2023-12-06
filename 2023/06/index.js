import fs from "fs";
import path from "path";

const INPUT_SRC = path.resolve(
  process.cwd(),
  process.argv.slice(2).at(0) || "input.txt"
);

const run = (hold, move) => ({
  ms: hold + move,
  mm: hold * move,
});

const sol = (T, D) =>
  ((opt) =>
    1 + Math.ceil(Math.max(...opt) - 1) - Math.floor(Math.min(...opt) + 1))([
    (-T + Math.sqrt(Math.pow(T, 2) - 4 * D)) / -2,
    (-T - Math.sqrt(Math.pow(T, 2) - 4 * D)) / -2,
  ]);
const parse = async (input) => {
  const [times, distances] = await input.then((r) =>
    r
      .trim()
      .split("\n")
      .map((r) =>
        r
          .split(":")
          .at(1)
          .replace(/[ ]+/g, " ")
          .trim()
          .split(" ")
          .map((n) => +n)
      )
  );
  const races = times.map((ms, i) => ({
    ms,
    mm: distances[i],
  }));
  const [time, distance] = await input.then((r) =>
    r
      .trim()
      .split("\n")
      .map((r) => +r.split(":").at(1).replace(/ /g, ""))
  );
  const partA = races
    .map(({ mm, ms }) => sol(ms, mm))
    .reduce((a, b) => a * b, 1);
  const partB = sol(time, distance);
  return { partA, partB };
};
parse(fs.promises.readFile(INPUT_SRC, "utf-8")).then(console.log);
