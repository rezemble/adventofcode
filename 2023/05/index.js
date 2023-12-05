import fs from "fs";
import path from "path";

const INPUT_SRC = path.resolve(
  process.cwd(),
  process.argv.slice(2).at(0) || "input.txt"
);
const parseMap = (str) => {
  const [dst, src, len] = str.split(" ").map((n) => +n);
  return {
    src: {
      start: src,
      end: src + len - 1,
    },
    dst: {
      start: dst,
      end: dst + len - 1,
    },
  };
};
const separate = (str) =>
  str
    .split("\n")
    .reduce(
      (a, b) =>
        b.trim() ? [...a.slice(0, -1), [...(a.at(-1) || []), b]] : [...a, []],
      []
    );

const parseBlock = (seedFN) => (lines) => {
  const type = lines.at(0).includes("seeds:") ? "seeds" : "map";
  if (type === "seeds")
    return {
      seeds: seedFN(lines),
    };
  const kind = lines.at(0).split(" ").at(0);
  const [src, trg] = kind.split("-to-");
  return {
    [kind]: {
      src,
      trg,
      data: lines.slice(1).map(parseMap),
    },
  };
};
const parseFormat = (str, seedFN) => {
  const blocks = separate(str)
    .map(parseBlock(seedFN))
    .reduce(
      (a, b) => ({
        ...a,
        ...b,
      }),
      {}
    );
  return {
    ...blocks,
    containsSeed(seed) {
      return this.seeds.some(
        ([start, len]) => seed >= start && seed < start + len
      );
    },
  };
};

const MAPS = [
  "seed-to-soil",
  "soil-to-fertilizer",
  "fertilizer-to-water",
  "water-to-light",
  "light-to-temperature",
  "temperature-to-humidity",
  "humidity-to-location",
];

const partition = (start, end, almanac, maps, depth = 0) => {
  if (!maps.length) return [];
  const [next, ...rest] = maps;
  const partitions = [];

  const sorted = [...almanac[next].data].sort(
    ({ src: { start: a } }, { src: { start: b } }) => a - b
  );
  const smallest = sorted.at(0);
  const largest = sorted.at(-1);
  const all = [
    ...(start < smallest.src.start
      ? [
          {
            src: {
              start,
              end: smallest.src.start - 1,
            },
            dst: {
              start,
              end: smallest.src.start - 1,
            },
          },
        ]
      : []),
    ...sorted,
    ...(end > largest.src.end + 1
      ? [
          {
            src: {
              start: largest.src.end + 1,
              end,
            },
            dst: {
              start: largest.src.end + 1,
              end,
            },
          },
        ]
      : []),
  ];

  for (const part of all) {
    if (part.src.start >= end || part.src.end < start) continue;
    const overlapStart = Math.max(start, part.src.start);
    const overlapEnd = Math.min(end, part.src.end);
    const overlap = {
      name: next,
      offset: overlapStart - start,
      src: {
        start: overlapStart,
        end: overlapEnd,
      },
      dst: {
        start: overlapStart - part.src.start + part.dst.start,
        end: overlapEnd - part.src.end + part.dst.end,
      },
    };
    partitions.push({
      ...overlap,
      partitions: partition(
        overlap.dst.start,
        overlap.dst.end,
        almanac,
        rest,
        depth + 1
      ),
    });
  }

  return partitions;
};

const findSmallestPartition = (partitions, depth = 0) => {
  const endNodes = partitions.filter((part) => !part.partitions.length);
  const rest = partitions.filter((part) => part.partitions.length);
  let min;
  for (const node of endNodes) {
    if (!min || min.dst.start > node.dst.start)
      min = {
        ...node,
        min: node.dst.start,
      };
  }
  for (const node of rest) {
    const sub = findSmallestPartition(node.partitions, depth + 1);
    if (sub && (!min || sub.min < min.min))
      min = {
        ...node,
        min: sub.min,
        sub,
      };
  }
  if (!min) return null;
  return {
    ...min,
    partitions: undefined,
    min: min.min,
  };
};

const flattenPath = (partition) => {
  return partition.sub ? flattenPath(partition.sub) : partition.dst.start;
};

const parse = async (input) => {
  const almanac_a = parseFormat(await input, (lines) =>
    lines
      .at(0)
      .split(":")
      .at(1)
      .split(" ")
      .map((n) => n.trim())
      .filter(Boolean)
      .map((n) => [+n, 1])
  );
  const partitions_a = almanac_a.seeds.map(([start, len]) =>
    partition(start, start + len - 1, almanac_a, MAPS)
  );
  const smallest_a = findSmallestPartition(partitions_a.flat());
  const almanac_b = parseFormat(await input, (lines) =>
    lines
      .at(0)
      .split(":")
      .at(1)
      .split(" ")
      .map((n) => n.trim())
      .filter(Boolean)
      .map((n) => +n)
      .reduce(
        (a, b) =>
          a.at(-1)?.length >= 2
            ? [...a, [b]]
            : [...a.slice(0, -1), [...(a.at(-1) || []), b]],
        []
      )
  );
  const partitions_b = almanac_b.seeds.map(([start, len]) =>
    partition(start, start + len - 1, almanac_b, MAPS)
  );
  const smallest_b = findSmallestPartition(partitions_b.flat());
  return {
    partA: flattenPath(smallest_a),
    partB: flattenPath(smallest_b),
  };
};
parse(fs.promises.readFile(INPUT_SRC, "utf-8")).then(console.log);
