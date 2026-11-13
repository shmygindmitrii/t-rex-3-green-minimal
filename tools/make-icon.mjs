// Render the package (watch selector / store) icon from the real face: the
// browser preview at 10:09 with the 'normal' sample values, default scheme and
// ghost level, cut to the round screen and scaled to 324 x 324 (Zepp's preview
// size for 480 x 480 screens) -> assets/<target>/icon.png.
//   node tools/make-icon.mjs
// Needs Microsoft Edge (headless) and Sharp from the global Zeus install.
import { spawn, execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const sharp = require(path.join(process.env.APPDATA, 'npm/node_modules/@zeppos/zeus-cli/node_modules/sharp'))

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TARGET = path.join(ROOT, 'assets/480x480-amazfit-t-rex-3/icon.png')
const SCREEN = 480
const ICON = 324
const PORT = 8187
const EDGE = ['ProgramFiles(x86)', 'ProgramFiles']
  .map((v) => process.env[v] && path.join(process.env[v], 'Microsoft/Edge/Application/msedge.exe'))
  .find((p) => p && fs.existsSync(p))
if (!EDGE) throw new Error('Microsoft Edge not found')

const server = spawn(process.execPath, [path.join(ROOT, 'preview/server.mjs'), '' + PORT], { stdio: 'ignore' })
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lcd-icon-'))
try {
  await new Promise((resolve) => setTimeout(resolve, 800)) // let the server start
  const shot = path.join(tmp, 'face.png')
  execFileSync(EDGE, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${path.join(tmp, 'profile')}`,
    `--window-size=${SCREEN},${SCREEN}`, '--virtual-time-budget=5000', `--screenshot=${shot}`,
    `http://127.0.0.1:${PORT}/?shot=1&sample=normal`,
  ], { stdio: 'ignore', timeout: 60000 })
  const circle = Buffer.from(`<svg width="${SCREEN}" height="${SCREEN}"><circle cx="${SCREEN / 2}" cy="${SCREEN / 2}" r="${SCREEN / 2}"/></svg>`)
  const face = await sharp(shot).extract({ left: 0, top: 0, width: SCREEN, height: SCREEN })
    .composite([{ input: circle, blend: 'dest-in' }]).png().toBuffer()
  await sharp(face).resize(ICON, ICON).png().toFile(TARGET)
  console.log(`face at 10:09 -> ${path.relative(ROOT, TARGET)} (${ICON}x${ICON})`)
} finally {
  server.kill()
  fs.rmSync(tmp, { recursive: true, force: true })
}
