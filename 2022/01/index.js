import fs from "fs";
import path from "path";

const INPUT_SRC = path.resolve(
  process.cwd(),
  process.argv.slice(2).at(0) || "input.txt"
);
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const parse = async (input) => {
  const lines = (await input).trim().split("\n");
  const elves = lines.reduce(
    (a, b) =>
      a.length
        ? b
          ? [...a.slice(0, -1), [...a.at(-1), +b]]
          : [...a, []]
        : [[+b]],
    []
  );
  return {
    partA: sum(elves.sort((a, b) => sum(a) - sum(b)).at(-1)),
    partB: sum(
      elves
        .sort((a, b) => sum(a) - sum(b))
        .slice(-3)
        .flat()
    ),
  };
};
parse(fs.promises.readFile(INPUT_SRC, "utf-8")).then(console.log);
