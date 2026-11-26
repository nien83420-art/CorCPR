import { execFileSync } from "node:child_process"
import { copyFileSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../", import.meta.url))
const destination = mkdtempSync("/private/tmp/corcpr-staging-source-")
const configFiles = new Set([
  "components.json", "next-env.d.ts", "next.config.mjs", "package.json",
  "pnpm-lock.yaml", "pnpm-workspace.yaml", "postcss.config.mjs", "proxy.ts", "tsconfig.json",
])
const sourceFolders = new Set(["app", "components", "hooks", "lib", "public"])
const paths = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
  cwd: root, encoding: "utf8",
}).split("\0").filter(Boolean)

let count = 0
for (const path of new Set(paths)) {
  const segments = path.split("/")
  if (segments.some(part => part.startsWith("."))) continue
  if (!configFiles.has(path) && !sourceFolders.has(segments[0])) continue
  const source = join(root, path)
  if (!lstatSync(source).isFile()) throw new Error(`Staging input must be a regular file: ${path}`)
  const target = join(destination, path)
  mkdirSync(dirname(target), { recursive: true })
  copyFileSync(source, target)
  count += 1
}
if (!paths.includes("pnpm-lock.yaml") || !paths.includes("app/page.tsx") || count < 20) {
  throw new Error("The staging source is incomplete")
}

function stagingFile(file, edits) {
  const path = join(destination, file)
  let source = readFileSync(path, "utf8")
  for (const [pattern, replacement] of edits) {
    const next = source.replace(pattern, replacement)
    if (next === source) throw new Error(`Review staging sanitization for ${file}`)
    source = next
  }
  if (source.includes("localPasswordOnly")) throw new Error(`Local STAFF code remains in ${file}`)
  writeFileSync(path, source)
}

stagingFile("lib/accounts/server.ts", [
  [/  if \(parsed\.protocol !== "https:"[\s\S]*?\n  return \{ url, key \}/,
    '  if (parsed.href !== "https://nemvibypxaeuoaqdjqat.supabase.co/") return null\n  return { url, key }'],
])

writeFileSync(join(destination, "vercel.json"), JSON.stringify({
  framework: "nextjs",
  installCommand: "pnpm install --frozen-lockfile",
  buildCommand: "pnpm build --webpack",
  headers: [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }],
}, null, 2) + "\n")
console.log(destination)
