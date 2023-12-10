import fs from "fs";
import path from "path";

const INPUT_SRC = path.resolve(
  process.cwd(),
  process.argv.slice(2).at(0) || "input.txt"
);
const deltas = (sequence) =>
  sequence.every((v) => v === 0) || !sequence.length
    ? { sequence }
    : {
        sequence,
        deltas: deltas(
          sequence.slice(0, -1).map((v, i) => sequence[i + 1] - v)
        ),
      };
const next = (sequence) => {
  if (sequence.sequence.every((v) => v === 0) || !sequence.sequence.length)
    return {
      sequence: [...sequence.sequence, 0],
    };
  const deltas = next(sequence.deltas);
  return {
    sequence: [
      ...sequence.sequence,
      sequence.sequence.at(-1) + deltas.sequence.at(-1),
    ],
    deltas,
  };
};
const prev = (sequence) => {
  if (sequence.sequence.every((v) => v === 0) || !sequence.sequence.length)
    return {
      sequence: [0, ...sequence.sequence],
    };
  const deltas = prev(sequence.deltas);
  return {
    sequence: [
      sequence.sequence.at(0) - deltas.sequence.at(0),
      ...sequence.sequence,
    ],
    deltas,
  };
};
const parseSequence = (line) => {
  const sequence = line
    .split(" ")
    .filter(Boolean)
    .map((n) => +n);
  return deltas(sequence);
};
const parse = async (input) => {
  const sequences = (await input).trim().split("\n").map(parseSequence);

  return {
    partA: sequences
      .map(next)
      .map(({ sequence }) => sequence.at(-1))
      .reduce((a, b) => a + b, 0),
    partB: sequences
      .map(prev)
      .map(({ sequence }) => sequence.at(0))
      .reduce((a, b) => a + b, 0),
  };
};
parse(fs.promises.readFile(INPUT_SRC, "utf-8")).then(console.log);
