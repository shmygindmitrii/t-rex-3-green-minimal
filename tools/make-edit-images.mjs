// Draw the watch edit-mode images into assets/<target>/edit/: one preview per
// color scheme and ghost level, the selected/unselected area frames and the tips
// background. Sizes, option ids and paths come from watchface/config.js and
// watchface/edit.js, so rerun this after changing SCHEMES, GHOST or EDIT:
//   node tools/make-edit-images.mjs
// Uses Sharp from the standard Windows global Zeus install under %APPDATA%/npm.
import { register, createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

register('../test/hooks.mjs', import.meta.url) // load watchface/*.js as ES modules
const require = createRequire(import.meta.url)
const sharp = require(path.join(process.env.APPDATA, 'npm/node_modules/@zeppos/zeus-cli/node_modules/sharp'))

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ASSETS = path.join(ROOT, 'assets/480x480-amazfit-t-rex-3')
const { SCHEMES, GHOST, EDIT } = await import('../watchface/config.js')
const { OPTIONS, IMAGES, editArea } = await import('../watchface/edit.js')
const { dim } = await import('../watchface/layout.js')

const hex = (color) => '#' + color.toString(16).padStart(6, '0')

// Seven-segment digits: lit segments per character.
const SEGMENTS = {
  0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg',
  5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg',
}
function digit(x, y, w, h, t, segments, fill) {
  const half = h / 2
  const v = half - 1.5 * t
  const boxes = {
    a: [x + t, y, w - 2 * t, t],
    b: [x + w - t, y + t, t, v],
    c: [x + w - t, y + half + t / 2, t, v],
    d: [x + t, y + h - t, w - 2 * t, t],
    e: [x, y + half + t / 2, t, v],
    f: [x, y + t, t, v],
    g: [x + t, y + half - t / 2, w - 2 * t, t],
  }
  return [...segments].map((s) => {
    const [bx, by, bw, bh] = boxes[s]
    return `<rect x="${bx + 1}" y="${by + 1}" width="${bw - 2}" height="${bh - 2}" rx="${t / 3}" fill="${fill}"/>`
  }).join('')
}

// "10:09" in `color` over a "88:88" ghost (none for level 0), centered in w x h.
function clock(w, h, color, level) {
  const ch = h * 0.66
  const cw = ch * 0.52
  const t = ch * 0.13
  const gap = cw * 0.28
  const colon = cw * 0.45
  const total = 4 * cw + colon + 4 * gap // 5 cells, 4 gaps
  let x = (w - total) / 2
  const y = (h - ch) / 2
  const ghost = level > 0 ? hex(dim(color, level)) : null
  let svg = ''
  for (const ch1 of '10:09') {
    if (ch1 === ':') {
      const d = t * 1.1
      const cx = x + colon / 2 - d / 2
      svg += `<rect x="${cx}" y="${y + ch * 0.28}" width="${d}" height="${d}" fill="${hex(color)}"/>`
      svg += `<rect x="${cx}" y="${y + ch * 0.66}" width="${d}" height="${d}" fill="${hex(color)}"/>`
      x += colon + gap
      continue
    }
    if (ghost) svg += digit(x, y, cw, ch, t, SEGMENTS[8], ghost)
    svg += digit(x, y, cw, ch, t, SEGMENTS[ch1], hex(color))
    x += cw + gap
  }
  return svg
}

const svgDoc = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`)
const background = (w, h) => `<rect width="${w}" height="${h}" rx="${Math.min(w, h) / 6}" fill="#000"/>`
const frame = (w, h, stroke, width) =>
  `<rect x="${width / 2}" y="${width / 2}" width="${w - width}" height="${h - width}" rx="${Math.min(w, h) / 6}" fill="none" stroke="${stroke}" stroke-width="${width}"/>`

const files = {}
for (const name of ['scheme', 'ghost']) {
  const { w, h } = editArea(name)
  files[IMAGES.select(name)] = svgDoc(w, h, frame(w, h, '#ffffff', 4))
  files[IMAGES.unselect(name)] = svgDoc(w, h, frame(w, h, '#8a8a8a', 2))
}
// Scheme previews: each scheme at the default ghost level.
for (const option of OPTIONS.scheme) {
  const { w, h } = editArea('scheme')
  const scheme = SCHEMES.find((s) => s.type === option.type)
  files[IMAGES.preview('scheme', option.type)] = svgDoc(w, h, background(w, h) + clock(w, h, scheme.colors.time, GHOST.default))
}
// Ghost previews: each level in the default scheme.
for (const option of OPTIONS.ghost) {
  const { w, h } = editArea('ghost')
  files[IMAGES.preview('ghost', option.type)] = svgDoc(w, h, background(w, h) + clock(w, h, SCHEMES[0].colors.time, option.level))
}
const tips = EDIT.tipsSize
files[IMAGES.tips] = svgDoc(tips.w, tips.h, `<rect width="${tips.w}" height="${tips.h}" rx="${tips.h / 2}" fill="${hex(EDIT.tipsColor)}"/>`)

// Replace the folder, so images of removed options do not linger.
const dir = path.join(ASSETS, 'edit')
fs.rmSync(dir, { recursive: true, force: true })
fs.mkdirSync(dir, { recursive: true })
for (const [file, svg] of Object.entries(files)) {
  await sharp(svg).png().toFile(path.join(ASSETS, file))
}
console.log(`${Object.keys(files).length} images -> ${path.relative(ROOT, dir)}`)
