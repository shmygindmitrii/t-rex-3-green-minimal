// Mock-runtime checks: data updates, layout centering, lifecycle cleanup.
// Run: node test/check.mjs. Device rendering still needs the real watch.
import assert from 'node:assert/strict'
import { register } from 'node:module'

register('./hooks.mjs', import.meta.url)
const { mock } = await import('./zos-mock.mjs')
const { readings, listeners } = mock
let face
globalThis.WatchFace = (definition) => { face = definition }

const { LINES, SCREEN, CX, FONTS } = await import('../watchface/config.js')
const { buildLines, measureLine, textWidth } = await import('../watchface/layout.js')
await import('../watchface/index.js')

Object.assign(readings, { hour: 23, minute: 59, day: 7, date: 31, month: 12, bpm: 199, battery: 100 })
face.build()
const w = face.ui.widgets
const text = (...ids) => ids.map((id) => w[id].text).join(' ')

// --- startup values
assert.equal(mock.widgets[0].type, 'FILL_RECT')
assert.equal(mock.widgets[0].color, 0)
assert.deepEqual([mock.widgets[0].w, mock.widgets[0].h], [SCREEN.width, SCREEN.height])
assert.equal(text('clock'), '23:59')
assert.equal(text('heartRate'), '199')
assert.equal(text('battery', 'batteryPercent'), '100 %')
assert.equal(text('weekday', 'day', 'month'), 'SUN 31 DEC')

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

// --- reserved widths keep the line still when values shrink
const statsX = () => ['heartRate', 'battery', 'batteryPercent'].map((id) => w[id].x)
const before = statsX()
readings.bpm = 0
listeners.heart()
assert.equal(text('heartRate'), '--')
readings.battery = 1
listeners.battery()
assert.equal(text('battery'), '1')
assert.deepEqual(statsX(), before)
assertCentered()

// --- minute, day, month and year rollover
Object.assign(readings, { hour: 0, minute: 0, day: 1, date: 1, month: 1 })
listeners.minute()
assert.equal(text('clock'), '00:00')
assert.equal(text('weekday', 'day', 'month'), 'MON 01 JAN')
readings.minute = 1
listeners.minute()
assert.equal(text('clock'), '00:01')

// --- stale time after sleep: no minute event is delivered during the gap
const lateHeart = listeners.heart
const lateBattery = listeners.battery
const lateScreen = listeners.screen
const resume = mock.widgets.find((entry) => entry.type === 'WIDGET_DELEGATE').resume_call
Object.assign(readings, { hour: 16, minute: 38 })
listeners.minute()
listeners.screen(2)
Object.assign(readings, { hour: 17, minute: 7 })
assert.equal(text('clock'), '16:38')
listeners.screen(1)
assert.equal(text('clock'), '17:07')

// --- returning from another app also catches up without a minute callback
Object.assign(readings, { hour: 0, minute: 0, day: 2, date: 2 })
resume()
assert.equal(text('clock'), '00:00')
assert.equal(text('weekday', 'day', 'month'), 'TUE 02 JAN')

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
assert.equal(text('clock'), '00:00')
assert.equal(text('heartRate'), '--')
assert.equal(text('battery'), '1')

// --- icons: enabling them creates image widgets and keeps the line centered;
//     a hidden item's gap carries over to the next visible item
const stats = LINES.find((l) => l.id === 'stats')
const values = { heartRate: '72', battery: '82' }
const withIcons = { ...stats, items: stats.items.map((i) => ({ ...i, show: true })) }
const ui = buildLines([withIcons], SCREEN, values, 1.8)
assert.equal(ui.widgets.heartIcon.type, 'IMG')
assert.equal(ui.widgets.batteryIcon.src, 'icons/battery.png')
const iconLine = ui.measure('stats')
assert.ok(Math.abs(iconLine.x + iconLine.width / 2 - CX) <= 1)
const hidden = measureLine(stats, values, SCREEN.width).items
assert.equal(hidden[1].x - (hidden[0].x + hidden[0].w), stats.items.find((i) => i.id === 'batteryIcon').gap)

// --- other screen widths: lines follow the screen center
const narrow = measureLine(LINES[1], { weekday: 'WED', day: '28', month: 'AUG' }, 390)
assert.ok(Math.abs(narrow.x + narrow.width / 2 - 195) <= 1)

console.log('PASS: startup, centering, reserved widths, rollover, wake/resume catch-up, cleanup, icons.')
console.log('Device rendering still requires real-watch checks. Custom AOD is not included.')
