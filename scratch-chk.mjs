import fs from "node:fs"
import { execFileSync } from "node:child_process"
const src = fs.readFileSync("src/dynamic-host.js", "utf8")
const a = src.indexOf("    function firstLineOf(s) {")
const b = src.indexOf("    harness.registerTool(ctx, harness.defineTool({\n      name: 'note_get_selections'", a)
const snippet = src.slice(a, b)
fs.writeFileSync("scratch-snippet.js", "function outer() {\n" + snippet + "\n}\n")
try { execFileSync(process.execPath, ["--check", "scratch-snippet.js"], { stdio: "pipe" }); console.log("helpers snippet: OK") }
catch (e) { console.log("helpers snippet: FAIL\n" + String(e.stderr || e).split("\n").slice(0, 6).join("\n")) }
