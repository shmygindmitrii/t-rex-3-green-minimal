// Mock checks cover data transitions, not Zepp firmware rendering.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const readings = { hour: 23, minute: 59, day: 7, date: 31, month: 12, bpm: 199, battery: 100 }
const listeners = {}
const widgets = []
let definition
class Time {
  getHours() { return readings.hour }
  getMinutes() { return readings.minute }
  getDay() { return readings.day }
  getDate() { return readings.date }
  getMonth() { return readings.month }
  onPerMinute(callback) { listeners.minute = callback }
}
class HeartRate {
  getLast() { return readings.bpm }
  onLastChange(callback) { listeners.heart = callback }
  offLastChange(callback) { assert.equal(callback, listeners.heart); delete listeners.heart }
}
class Battery {
  getCurrent() { return readings.battery }
  onChange(callback) { listeners.battery = callback }
  offChange(callback) { assert.equal(callback, listeners.battery); delete listeners.battery }
}
class Screen {
  onChange(callback) { listeners.screen = callback }
  offChange(callback) { assert.equal(callback, listeners.screen); delete listeners.screen }
}
const source = fs.readFileSync(__dirname + '/watchface/index.js', 'utf8').replace(/^import .*$/gm, '')
vm.runInNewContext(source, {
  Time, HeartRate, Battery, Screen,
  widget: { TEXT: 'text', FILL_RECT: 'rect', WIDGET_DELEGATE: 'delegate' },
  align: { CENTER_H: 1, CENTER_V: 2 }, prop: { TEXT: 'text', MORE: 'more' }, text_style: { NONE: 0 },
  createWidget(type, options) {
    const instance = { ...options, type, setProperty(key, value) { if (key === 'more') Object.assign(this, value); else this[key] = value } }
    widgets.push(instance)
    return instance
  },
  WatchFace(value) { definition = value },
})
definition.build()
assert.equal(definition.clock.text, '23:59')
assert.equal(definition.heartText.text, '199')
assert.equal(definition.batteryText.text, '100')
assert.equal(definition.batteryPercent.text, '%')
assert.equal([definition.weekday.text, definition.date.text, definition.month.text].join(' '), 'SUN 31 DEC')
assert.equal(widgets[0].color, 0)
Object.assign(readings, { hour: 0, minute: 0, day: 1, date: 1, month: 1 })
listeners.minute()
assert.equal(definition.clock.text, '00:00')
assert.equal([definition.weekday.text, definition.date.text, definition.month.text].join(' '), 'MON 01 JAN')
readings.bpm = 0
listeners.heart()
assert.equal(definition.heartText.text, '--')
readings.battery = 1
listeners.battery()
assert.equal(definition.batteryText.text, '1')
readings.minute = 1
listeners.minute()
assert.equal(definition.clock.text, '00:01')
const lateHeart = listeners.heart
const lateBattery = listeners.battery
const lateScreen = listeners.screen
const resume = widgets.find((entry) => entry.type === 'delegate').resume_call
// Reproduce stale time after sleep: no minute event is delivered during the gap.
Object.assign(readings, { hour: 16, minute: 38 })
listeners.minute()
listeners.screen(2)
Object.assign(readings, { hour: 17, minute: 7 })
assert.equal(definition.clock.text, '16:38')
listeners.screen(1)
assert.equal(definition.clock.text, '17:07')
// Returning from another app must also catch up without a minute callback.
Object.assign(readings, { hour: 0, minute: 0, day: 2, date: 2 })
resume()
assert.equal(definition.clock.text, '00:00')
assert.equal([definition.weekday.text, definition.date.text, definition.month.text].join(' '), 'TUE 02 JAN')
definition.onDestroy()
assert.equal(listeners.heart, undefined)
assert.equal(listeners.battery, undefined)
assert.equal(listeners.screen, undefined)
Object.assign(readings, { minute: 2, bpm: 80, battery: 50 })
listeners.minute()
lateHeart()
lateBattery()
lateScreen(1)
resume()
assert.equal(definition.clock.text, '00:00')
assert.equal(definition.heartText.text, '--')
assert.equal(definition.batteryText.text, '1')
console.log('PASS: startup, minute/date rollover, wake after missed minutes, return from app, sensor updates and cleanup.')
console.log('Device rendering still requires real-watch checks. Custom AOD is not included.')
