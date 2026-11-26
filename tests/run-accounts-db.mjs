import { spawnSync } from "node:child_process"

const url = new URL(process.env.CORCPR_TEST_DB_URL)
if (url.protocol !== "postgresql:" || url.hostname !== "127.0.0.1") {
  throw new Error("The authorisation test suite may run only on the disposable local Supabase database")
}
const result = spawnSync(process.env.CORCPR_PSQL || "psql", [
  "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "--dbname", url.href, "--file", "supabase/tests/account_access.sql",
], { encoding: "utf8" })
if (result.error) throw result.error
process.stdout.write(result.stdout)
process.stderr.write(result.stderr)
const lines = result.stdout.split("\n")
const expected = Number(lines.find(line => /^1\.\.\d+$/.test(line))?.slice(3))
const passed = lines.filter(line => /^ok \d+\b/.test(line)).length
if (result.status !== 0 || !expected || passed !== expected || lines.some(line => line.startsWith("not ok"))) {
  process.exitCode = 1
}
