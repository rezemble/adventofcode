import fs from "fs";
import path from "path";

const INPUT_SRC = path.resolve(process.cwd(), "input.txt");
fs.promises
  .readFile(INPUT_SRC, "utf-8")
  .then((r) =>
    r
      .trim()
      .split("\n")
      .map((l) => l.replace(/[^0-9]/g, ""))
      .map((n) => +[n.slice(0, 1), n.slice(-1)].join(""))
      .reduce((a, b) => a + b, 0)
  )
  .then((x) => console.log(`result is [%s]!`, x));
