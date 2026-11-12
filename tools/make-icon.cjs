// Render the package (watch selector) icon: art/selector-icon.svg -> assets/<target>/icon.png.
// Run: node tools/make-icon.cjs
// Uses Sharp from the standard Windows global Zeus install under %APPDATA%/npm.
const path = require('node:path')
const sharp = require(path.join(process.env.APPDATA, 'npm/node_modules/@zeppos/zeus-cli/node_modules/sharp'))

const ROOT = path.join(__dirname, '..')
const SOURCE = path.join(ROOT, 'art/selector-icon.svg')
const TARGET = path.join(ROOT, 'assets/480x480-amazfit-t-rex-3/icon.png')

sharp(SOURCE, { density: 72 }).png().toFile(TARGET)
  .then(({ width, height }) => console.log(`${path.relative(ROOT, SOURCE)} -> ${path.relative(ROOT, TARGET)} (${width}x${height})`))
  .catch((error) => { console.error(error); process.exitCode = 1 })
