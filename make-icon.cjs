// Render the Green Minimal selector icon.
const fs = require('fs')
const path = require('path')
const sharp = require(path.join(process.env.APPDATA, 'npm/node_modules/@zeppos/zeus-cli/node_modules/sharp'))
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="324" height="324" viewBox="0 0 324 324"><rect width="324" height="324" fill="#000000"/><path d="M162 62 269 247H55Z" fill="none" stroke="#75ff69" stroke-width="12" stroke-linejoin="round"/></svg>'
fs.writeFileSync(path.join(__dirname, 'icon.svg'), svg + '\n')
sharp(Buffer.from(svg)).png().toFile(path.join(__dirname, 'assets/480x480-amazfit-t-rex-3/icon.png')).catch((error) => { console.error(error); process.exitCode = 1 })
