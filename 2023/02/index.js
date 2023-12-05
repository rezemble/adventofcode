import fs from "fs";
import path from "path";
import params from "./params.json" assert { type: "json" };

const INPUT_SRC = path.resolve(process.cwd(), "input.txt");
fs.promises
  .readFile(INPUT_SRC, "utf-8")
  .then((r) => r.split("\n"))
  .then((lines) =>
    lines.map((l) => {
      const [name, runs] = l.split(":").map((s) => s.trim());
      return {
        name,
        id: +name.split(" ").at(-1),
        runs: runs
          .split(";")
          .map((p) => p.trim())
          .map((g) =>
            Object.fromEntries(
              g
                .split(",")
                .map((p) => p.trim())
                .map((p) => {
                  const [c, id] = p.split(" ");
                  return [id, +c];
                })
            )
          ),
      };
    })
  )
  .then((games) => {
    const validSum = games
      .filter(({ runs }) =>
        runs.every((bag) =>
          Object.entries(bag).every(([id, c]) => c <= params[id])
        )
      )
      .reduce((a, { id }) => a + id, 0);
    const powerSum = games
      .map(({ runs }) =>
        Object.values(
          runs.reduce(
            (a, b) =>
              Object.fromEntries(
                Object.entries(a).map(([k, n]) => [k, Math.max(n, b[k] || 0)])
              ),
            {
              red: 0,
              green: 0,
              blue: 0,
            }
          )
        ).reduce((a, b) => a * b, 1)
      )
      .reduce((a, b) => a + b, 0);
    return {
      validSum,
      powerSum,
    };
  })
  .then(console.log);
