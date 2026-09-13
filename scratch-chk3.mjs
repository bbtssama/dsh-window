import fs from "node:fs"
import { execFileSync } from "node:child_process"
const src = fs.readFileSync("src/dynamic-host.js", "utf8")
// Validate each top-level chunk of the file separately to find the unbalanced one.
const lines = src.split("\n")
// Find the `return {` that opens the plugin object.
const i = lines.findIndex((l) => l === "return {")
if (i < 0) { console.log("no return {"); process.exit(1) }
const head = lines.slice(0, i).join("\n")
const body = lines.slice(i).join("\n")
fs.writeFileSync("scratch-head.js", head + "\nexport {}\n")
fs.writeFileSync("scratch-body.js", "function outer() {\n" + body + "\n}\n")
for (const [name, f] of [["head", "scratch-head.js"], ["body", "scratch-body.js"]]) {
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); console.log(name + ": OK") }
  catch (e) { console.log(name + ": FAIL\n" + String(e.stderr || e).split("\n").slice(0, 5).join("\n")) }
}
