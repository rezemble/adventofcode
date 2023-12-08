import fs from "fs";
import path from "path";

const INPUT_SRC = path.resolve(
  process.cwd(),
  process.argv.slice(2).at(0) || "input.txt"
);
const parseList = (rows) => {
  const nodes = rows.map(
    (s) =>
      [
        ...s.matchAll(
          /(?<source>[A-Z]+) = \((?<left>[A-Z]+), (?<right>[A-Z]+)\)/gim
        ),
      ].at(0).groups
  );
  const tree = {
    ...Object.fromEntries(
      nodes.map(({ source, left, right }) => [
        source,
        {
          source,
          left,
          right,
          get L() {
            return tree[left];
          },
          get R() {
            return tree[right];
          },
          get isEnd() {
            return source.endsWith("Z");
          },
        },
      ])
    ),
    get startingKeys() {
      return Object.keys(this).filter((k) => k.endsWith("A"));
    },
    get endingKeys() {
      return Object.keys(this).filter((k) => k.endsWith("Z"));
    },
  };
  return tree;
};
const gcd = (x, y) => (y ? gcd(y, x % y) : x);
const lcm = (...n) => n.reduce((x, y) => (x * y) / gcd(x, y));
const traverse = (tree, steps, startAt = "AAA") => {
  const taken = [];
  for (
    let node = tree[startAt], idx = 0;
    !node.isEnd;
    idx = (idx + 1) % steps.length
  ) {
    const step = steps[idx];
    node = node[step];
    taken.push(node);
  }
  return taken.length;
};
const traverseParallel = (tree, steps) => {
  const start = tree.startingKeys;
  const deltas = start.map((key) => ({
    key,
    len: traverse(tree, steps, key),
  }));
  return lcm(...deltas.map(({ len }) => len));
};
const parse = async (input) => {
  const [route, nodes] = (await input).split("\n\n").map((p) => p.trim());
  const tree = parseList(nodes.split("\n").map((r) => r.trim()));
  const steps = route.split("");

  return {
    partA: traverse(tree, steps),
    partB: traverseParallel(tree, steps),
  };
};
parse(fs.promises.readFile(INPUT_SRC, "utf-8")).then(console.log);
