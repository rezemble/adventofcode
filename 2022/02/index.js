import fs from "fs";
import path from "path";

const INPUT_SRC = path.resolve(
  process.cwd(),
  process.argv.slice(2).at(0) || "input.txt"
);
const TOKENS = {
  you: "ABC".split(""),
  me: "XYZ".split(""),
  results: "YXZ".split(""),
};
const SCORES = {
  LETTERS: [null, ...TOKENS.me],
  RESULTS: ["TIE", "LOSS", "WIN"],
  WIN: 6,
  TIE: 3,
  LOSS: 0,
};
const score = (you, me) =>
  SCORES.RESULTS[
    (TOKENS.you.indexOf(you) - TOKENS.me.indexOf(me) + TOKENS.me.length) %
      TOKENS.me.length
  ];
const shape = (you, result) =>
  1 +
  ((TOKENS.you.indexOf(you) -
    TOKENS.results.indexOf(result) +
    TOKENS.me.length) %
    TOKENS.me.length);
const parse = async (input) => {
  const turns = (await input)
    .trim()
    .split("\n")
    .map((row) => row.split(" "))
    .map(([you, me]) => ({
      you,
      me,
      score: score(you, me),
      shape: shape(you, me),
    }))
    .map((r) => ({
      ...r,
      points: SCORES[r.score] + SCORES.LETTERS.indexOf(r.me),
      reverse: r.shape + SCORES[SCORES.RESULTS[TOKENS.results.indexOf(r.me)]],
    }));
  return {
    partA: turns.map(({ points }) => points).reduce((a, b) => a + b, 0),
    partB: turns.map(({ reverse }) => reverse).reduce((a, b) => a + b, 0),
  };
};
parse(fs.promises.readFile(INPUT_SRC, "utf-8")).then(console.log);
