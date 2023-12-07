import fs from "fs";
import path from "path";

const INPUT_SRC = path.resolve(
  process.cwd(),
  process.argv.slice(2).at(0) || "input.txt"
);

const CARD_STRENGTHS = {
  a: "23456789TJQKA",
  b: "J23456789TQKA",
};

class CardSet extends Array {
  get jokers() {
    return this.find(({ card }) => card === "J")?.count || 0;
  }
  get biggestGroup() {
    return Math.max(...this.map(({ count }) => count));
  }
  get nonJokers() {
    return this.filter(({ card }) => card !== "J");
  }
  get biggestNonJoker() {
    return Math.max(...this.nonJokers.map(({ count }) => count));
  }
}

const GROUP_STRENGTH = {
  a: Object.entries({
    HIGH_CARD: (g) => g.length === 5,
    ONE_PAIR: (g) => g.length === 4,
    TWO_PAIR: (g) => g.length === 3 && g.biggestGroup === 2,
    THREE_OF_A_KIND: (g) => g.length === 3 && g.biggestGroup === 3,
    FULL_HOUSE: (g) => g.length === 2 && g.biggestGroup === 3,
    FOUR_OF_A_KIND: (g) => g.length === 2 && g.biggestGroup === 4,
    FIVE_OF_A_KIND: (g) => g.length === 1,
  }).map(([label, fn], i) => ({ label, fn, rank: i + 1 })),
  b: Object.entries({
    HIGH_CARD: (g) => g.length === 5,
    ONE_PAIR: (g) => g.length === 4 || (g.length === 5 && g.jokers),
    TWO_PAIR: (g) =>
      (g.length === 3 && g.biggestGroup === 2) || (g.length === 4 && g.jokers),
    THREE_OF_A_KIND: (g) =>
      (g.length === 3 && g.biggestGroup === 3) ||
      g.nonJokers.some(({ count }) => count + g.jokers >= 3),
    FULL_HOUSE: (g) =>
      (g.length === 2 && g.biggestGroup === 3) || (g.length === 3 && g.jokers),
    FOUR_OF_A_KIND: (g) =>
      (g.length === 2 && g.biggestGroup === 4) ||
      g.nonJokers.some(({ count }) => count + g.jokers >= 4),
    FIVE_OF_A_KIND: (g) => g.length === 1 || (g.length === 2 && g.jokers),
  }).map(([label, fn], i) => ({ label, fn, rank: i + 1 })),
};

const groupCards = (set) =>
  new CardSet(
    ...Object.entries(
      set.reduce((a, b) => ({ ...a, [b]: (a[b] || 0) + 1 }), {})
    ).map(([card, count]) => ({
      card,
      count,
    }))
  );

const buildHand = (str, bid) => {
  const getGroupFor = (part) => (groups) => {
    const [candidate] = part
      .filter(({ fn }) => fn(groups))
      .sort(({ rank: a }, { rank: b }) => b - a);
    return candidate || {};
  };
  const cards = str.split("");
  const groups = groupCards(cards);
  const group_kind = Object.fromEntries(
    Object.entries(GROUP_STRENGTH).map(([key, map]) => [
      key,
      getGroupFor(map)(groups),
    ])
  );

  return {
    groups,
    str,
    bid: +bid,
    strength: Object.fromEntries(
      Object.entries(group_kind).map(([key, kind]) => [key, kind.rank || -1])
    ),
    label: Object.fromEntries(
      Object.entries(group_kind).map(([key, kind]) => [
        key,
        kind.label || "UNKNOWN",
      ])
    ),
    cards: cards.map((card) => ({
      card,
      strength: Object.fromEntries(
        Object.entries(CARD_STRENGTHS).map(([part, order]) => [
          part,
          order.indexOf(card),
        ])
      ),
    })),
    get cardStrength() {
      return this.cards.map(({ strength }) => strength);
    },
    get valueOf() {
      return Object.fromEntries(
        Object.entries(this.strength).map(([key, strength]) => [
          key,
          [strength, ...this.cardStrength.map(({ [key]: v }) => v)],
        ])
      );
    },
  };
};

const compare =
  (part) =>
  ({ valueOf: { [part]: a } }, { valueOf: { [part]: b } }) => {
    const [ac, ...ar] = a;
    const [bc, ...br] = b;
    if (ac < bc) return -1;
    if (bc < ac) return 1;
    if (!ar.length || !br.length) return 0;
    return compare(part)(
      { valueOf: { [part]: ar } },
      { valueOf: { [part]: br } }
    );
  };
const calculateWinning = (hand, i) => ({
  ...hand,
  rank: i + 1,
  winning: hand.bid * (i + 1),
});

const parse = async (input) => {
  const hands = await input.then((r) =>
    r
      .split("\n")
      .map((line) => line.split(" "))
      .map(([hand, bid]) => buildHand(hand, bid))
      .sort(compare)
  );
  return {
    partA: [...hands]
      .sort(compare("a"))
      .map(calculateWinning)
      .reduce((a, b) => a + b.winning, 0),
    partB: [...hands]
      .sort(compare("b"))
      .map(calculateWinning)
      .reduce((a, b) => a + b.winning, 0),
  };
};
parse(fs.promises.readFile(INPUT_SRC, "utf-8")).then(console.log);
