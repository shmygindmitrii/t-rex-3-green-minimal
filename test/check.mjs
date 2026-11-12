// Mock-runtime checks: data updates, layout centering, ghost segments, lifecycle cleanup.
// Run: node test/check.mjs. Device rendering still needs the real watch.
import assert from 'node:assert/strict'
import { register } from 'node:module'

register('./hooks.mjs', import.meta.url)
const { mock } = await import('./zos-mock.mjs')
const { readings, listeners } = mock
let face
globalThis.WatchFace = (definition) => { face = definition }

const { LINES, SCREEN, CX, FONTS, GHOST } = await import('../watchface/config.js')
const { buildLines, measureLine, textWidth, dim } = await import('../watchface/layout.js')
await import('../watchface/index.js')

Object.assign(readings, { hour: 23, minute: 59, day: 7, date: 31, month: 12, bpm: 199, battery: 100 })
face.build()
const w = face.ui.widgets
const text = (...ids) => ids.map((id) => w[id].text).join(' ')
const ids = (lineId) => LINES.find((l) => l.id === lineId).items.filter((i) => i.show !== false).map((i) => i.id)

// --- startup values (the ghost-free part of each text is the data)
const bare = (id) => w[id].text.replace(new RegExp('\\' + GHOST.blank, 'g'), '')
assert.equal(mock.widgets[0].type, 'FILL_RECT')
assert.equal(mock.widgets[0].color, 0)
assert.deepEqual([mock.widgets[0].w, mock.widgets[0].h], [SCREEN.width, SCREEN.height])
assert.equal(bare('clock'), '23:59')
assert.equal(bare('heartRate'), '199')
assert.equal(bare('battery'), '100')
assert.equal(bare('weekday') + ' ' + bare('daymonth'), 'SUN 31.12')

// --- layout: every visible line is centered on the screen, items do not overlap,
//     and every item is vertically centered on its line
const assertCentered = () => {
  for (const line of LINES.filter((l) => l.show !== false)) {
    const items = line.items.filter((i) => i.show !== false)
    const placed = items.map((i) => w[i.id])
    const left = placed[0].x
    const right = placed[placed.length - 1].x + placed[placed.length - 1].w
    assert.ok(Math.abs((left + right) / 2 - CX - (line.dx || 0)) <= 1, `line ${line.id} centered: ${left}..${right}`)
    placed.forEach((p, i) => i && assert.ok(p.x >= placed[i - 1].x + placed[i - 1].w, `line ${line.id} overlap`))
    placed.forEach((p, i) => assert.ok(Math.abs(p.y + p.h / 2 - line.y - (items[i].dy || 0)) <= 1, `line ${line.id} vertical`))
  }
}
assertCentered()
assert.equal(textWidth('10:09', FONTS.DSEG7_BOLD, 100).toFixed(1), (4 * 81.6 + 20).toFixed(1))

// --- reserved widths keep lines still when values shrink
// every item on every line keeps its x when values shrink
const statsX = () => LINES.flatMap((l) => ids(l.id)).map((id) => w[id].x)
const before = statsX()
readings.bpm = 0
listeners.heart()
assert.equal(bare('heartRate'), '--')
readings.battery = 1
listeners.battery()
assert.equal(bare('battery'), '1')
assert.deepEqual(statsX(), before)
assertCentered()

// --- minute, day, month and year rollover
Object.assign(readings, { hour: 0, minute: 0, day: 1, date: 1, month: 1 })
listeners.minute()
assert.equal(bare('clock'), '00:00')
assert.equal(bare('weekday') + ' ' + bare('daymonth'), 'MON 01.01')
readings.minute = 1
listeners.minute()
assert.equal(bare('clock'), '00:01')

// --- stale time after sleep: no minute event is delivered during the gap
const lateHeart = listeners.heart
const lateBattery = listeners.battery
const lateScreen = listeners.screen
const resume = mock.widgets.find((entry) => entry.type === 'WIDGET_DELEGATE').resume_call
Object.assign(readings, { hour: 16, minute: 38 })
listeners.minute()
listeners.screen(2)
Object.assign(readings, { hour: 17, minute: 7 })
assert.equal(bare('clock'), '16:38')
listeners.screen(1)
assert.equal(bare('clock'), '17:07')

// --- returning from another app also catches up without a minute callback
Object.assign(readings, { hour: 0, minute: 0, day: 2, date: 2 })
resume()
assert.equal(bare('clock'), '00:00')
assert.equal(bare('weekday') + ' ' + bare('daymonth'), 'TUE 02.01')

// --- cleanup: listeners removed, late callbacks ignored
face.onDestroy()
assert.equal(listeners.heart, undefined)
assert.equal(listeners.battery, undefined)
assert.equal(listeners.screen, undefined)
Object.assign(readings, { minute: 2, bpm: 80, battery: 50 })
listeners.minute()
lateHeart()
lateBattery()
lateScreen(1)
resume()
assert.equal(bare('clock'), '00:00')
assert.equal(bare('heartRate'), '--')
assert.equal(bare('battery'), '1')

// --- hidden items: no widget, and their gap carries over to the next visible item
const hiddenLine = { id: 'hid', y: 300, gap: 8, items: [
  { id: 'hA', text: '1', font: FONTS.DSEG7_BOLD, size: 40, color: 0xffffff },
  { id: 'hB', text: '2', font: FONTS.DSEG7_BOLD, size: 40, color: 0xffffff, gap: 32, show: false },
  { id: 'hC', text: '3', font: FONTS.DSEG7_BOLD, size: 40, color: 0xffffff },
] }
const hid = buildLines([hiddenLine], SCREEN, {})
assert.equal(hid.widgets.hB, undefined)
assert.equal(hid.widgets.hC.x - (hid.widgets.hA.x + hid.widgets.hA.w), 32)
assert.ok(Math.abs(hid.measure('hid').x + hid.measure('hid').width / 2 - CX) <= 1)

// --- other screen widths: lines follow the screen center
const date = LINES.find((l) => l.id === 'date')
const narrow = measureLine(date, { weekday: 'WED', ddmm: '28.08' }, 390)
assert.ok(Math.abs(narrow.x + narrow.width / 2 - 195) <= 1)

// --- ghost segments
assert.equal(dim(0x75ff69, 0.15), 0x122610)
const G = (font) => GHOST.chars[font]
const ghostLines = [
  { id: 'gTime', y: 200, ghost: true, items: [
    { id: 'gClock', value: 'time', font: FONTS.DSEG7_BOLD, size: 100, color: 0x75ff69 },
  ] },
  { id: 'gStats', y: 300, gap: 8, ghost: true, ghostColor: 0x222222, items: [
    { id: 'gLabel', text: 'HRT', font: FONTS.DSEG14_REGULAR, size: 34, color: 0xff4949 },
    { id: 'gHeart', value: 'heartRate', font: FONTS.DSEG7_BOLD, size: 34, color: 0xff4949, reserve: '000' },
    { id: 'gNoGhost', text: 'X', font: FONTS.DSEG14_REGULAR, size: 34, color: 0xff4949, ghost: false },
    { id: 'gCustom', value: 'battery', font: FONTS.DSEG7_BOLD, size: 34, color: 0x6bde76, ghost: '888', align: 'left', ghostColor: 0x010101 },
  ] },
  { id: 'gOff', y: 400, items: [
    { id: 'gPlain', value: 'time', font: FONTS.DSEG7_BOLD, size: 40, color: 0xffffff },
  ] },
]
const before2 = mock.widgets.length
const g = buildLines(ghostLines, SCREEN, { time: '10:09', heartRate: '72', battery: '5' })
// ghost text: full-width chars -> all-on char, ':' kept; reserve sets the cell count
assert.equal(g.ghosts.gClock.text, `${G(FONTS.DSEG7_BOLD).repeat(2)}:${G(FONTS.DSEG7_BOLD).repeat(2)}`)
assert.equal(g.ghosts.gLabel.text, G(FONTS.DSEG14_REGULAR).repeat(3))
assert.equal(g.ghosts.gHeart.text, '888')
assert.equal(g.ghosts.gCustom.text, '888')
assert.equal(g.ghosts.gNoGhost, undefined)
assert.equal(g.ghosts.gPlain, undefined)
// values are padded with blank cells to sit on the ghost (left pad, or right for align: 'left')
assert.equal(g.widgets.gHeart.text, GHOST.blank + '72')
assert.equal(g.widgets.gCustom.text, '5' + GHOST.blank + GHOST.blank)
assert.equal(g.widgets.gClock.text, '10:09')
// colors: default dimmed item color, line override, item override
assert.equal(g.ghosts.gClock.color, dim(0x75ff69, GHOST.brightness))
assert.equal(g.ghosts.gHeart.color, 0x222222)
assert.equal(g.ghosts.gCustom.color, 0x010101)
// ghost is drawn behind (created just before) its text, with an identical box
for (const id of Object.keys(g.ghosts)) {
  const [ghost, lit] = [g.ghosts[id], g.widgets[id]]
  assert.equal(mock.widgets.indexOf(ghost) + 1, mock.widgets.indexOf(lit), `${id} ghost order`)
  for (const key of ['x', 'y', 'w', 'h', 'font', 'text_size', 'align_h']) assert.equal(ghost[key], lit[key], `${id} ghost ${key}`)
}
assert.equal(mock.widgets.length - before2, 6 + 4)
// value changes keep text width == ghost width, so nothing moves
const gx = Object.keys(g.ghosts).map((id) => g.widgets[id].x)
g.update({ time: '23:59', heartRate: '--', battery: '100' })
assert.equal(g.widgets.gHeart.text, GHOST.blank + '--')
assert.equal(g.widgets.gCustom.text, '100')
assert.deepEqual(Object.keys(g.ghosts).map((id) => g.widgets[id].x), gx)
assert.deepEqual(Object.keys(g.ghosts).map((id) => g.ghosts[id].x), gx)

console.log('PASS: startup, centering, reserved widths, rollover, wake/resume catch-up, cleanup, hidden items, ghosts.')
console.log('Device rendering still requires real-watch checks. Custom AOD is not included.')
