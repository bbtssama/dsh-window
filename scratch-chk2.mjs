import fs from "node:fs"
import { execFileSync } from "node:child_process"
const src = fs.readFileSync("src/dynamic-host.js", "utf8")
const a = src.indexOf("    // ── 笔记管理工具（本次升级新增）")
const b = src.indexOf("    harness.handle('state', async function (args) {", a)
const snippet = src.slice(a, b)
fs.writeFileSync("scratch-snippet2.js", "function outer() {\n" + snippet + "\n}\n")
try { execFileSync(process.execPath, ["--check", "scratch-snippet2.js"], { stdio: "pipe" }); console.log("tools+rpc snippet: OK") }
catch (e) { console.log("tools+rpc snippet: FAIL\n" + String(e.stderr || e).split("\n").slice(0, 8).join("\n")) }
