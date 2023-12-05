import fs from "fs";
import path from "path";

const INPUT_SRC = path.resolve(process.cwd(), "input.txt");
const LUT = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];

const getNumbers = (str) => {
  if (!str.length) return [];
  const numAt = +str.slice(0, 1);
  if (!isNaN(numAt)) return [numAt, ...getNumbers(str.slice(1))];
  const wordAt = LUT.find((s) => str.startsWith(s));
  if (wordAt) return [LUT.indexOf(wordAt), ...getNumbers(str.slice(1))];
  return getNumbers(str.slice(1));
};
fs.promises
  .readFile(INPUT_SRC, "utf-8")
  .then((r) => {
    const lines = r.trim().split("\n");

    const A = lines
      .map((l) => l.replace(/[^0-9]/g, ""))
      .map((n) => +[n.slice(0, 1), n.slice(-1)].join(""))
      .reduce((a, b) => a + b, 0);
    const B = lines
      .map((l) => {
        const n = getNumbers(l);
        console.log(l, n.join(""));
        return n;
      })
      .map((n) => +[n.at(0), n.at(-1)].join(""))
      .reduce((a, b) => a + b, 0);
    return [A, B];
  })
  .then(([a, b]) => console.log(`result is [%s] - part 2 is [%s]!`, a, b));
