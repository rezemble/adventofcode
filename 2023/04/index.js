import fs from "fs";
import path from "path";

const INPUT_SRC = path.resolve(
  process.cwd(),
  process.argv.slice(2).at(0) || "input.txt"
);

const getNumbers = (s) =>
  s
    .split(" ")
    .map((n) => n.trim())
    .filter(Boolean)
    .map((n) => +n);

const winValue = (win, res) =>
  ((s) => s && Math.pow(2, s - 1))(res.filter((n) => win.includes(n)).length);

const parse = async (input) => {
  const exc = /\:[ ]+(?<preset>([0-9]+[ ]+)+)\|(?<sol>([ ]+[0-9]+)+)/gm;
  const cards = input.then((c) => [...c.matchAll(exc)]);
  const won = await cards.then((lines) =>
    lines
      .map(({ groups: { preset, sol } }, i) => ({
        preset: getNumbers(preset),
        sol: getNumbers(sol),
        id: i + 1,
      }))
      .map((l) => ({
        ...l,
        value: winValue(l.preset, l.sol),
        count: l.sol.filter((n) => l.preset.includes(n)).length,
      }))
  );
  const partA = won.reduce((a, { value: b }) => a + b, 0);
  const deep = won.map((card, idx) => ({
    ...card,
    get all() {
      return [
        ...deep
          .slice(idx + 1, idx + 1 + this.count)
          .flatMap((c) => [c, ...c.all]),
      ];
    },
  }));
  const partB =
    deep.length + deep.map((c) => c.all.length).reduce((a, b) => a + b, 0);
  return {
    partB,
    partA,
  };
};

parse(fs.promises.readFile(INPUT_SRC, "utf-8")).then(console.log);
