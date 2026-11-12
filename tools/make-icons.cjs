// Render art/*.svg into the PNGs the watch uses. Run: node tools/make-icons.cjs
// The PNG size is the SVG's width/height; keep the matching w/h in watchface/config.js
// (the watch draws images at native size). The color is baked into the SVG.
// Uses Sharp from the standard Windows global Zeus install under %APPDATA%/npm.
const fs = require('node:fs')
const path = require('node:path')
const sharp = require(path.join(process.env.APPDATA, 'npm/node_modules/@zeppos/zeus-cli/node_modules/sharp'))

const ROOT = path.join(__dirname, '..')
const ASSETS = path.join(ROOT, 'assets/480x480-amazfit-t-rex-3')
// source SVG -> output PNG (relative to assets/<target>/)
const ICONS = {
  'art/selector-icon.svg': 'icon.png',
  'art/heart.svg': 'icons/heart.png',
  'art/battery.svg': 'icons/battery.png',
}

Promise.all(Object.entries(ICONS).map(async ([src, out]) => {
  const target = path.join(ASSETS, out)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  await sharp(path.join(ROOT, src), { density: 72 }).png().toFile(target)
  const { width, height } = await sharp(target).metadata()
  console.log(`${src} -> ${path.relative(ROOT, target)} (${width}x${height})`)
})).catch((error) => { console.error(error); process.exitCode = 1 })
