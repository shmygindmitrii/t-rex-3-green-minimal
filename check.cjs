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
const source = fs.readFileSync(__dirname + '/watchface/index.js', 'utf8').replace(/^import .*$/gm, '')
vm.runInNewContext(source, {
  Time, HeartRate, Battery,
  widget: { TEXT: 'text', FILL_RECT: 'rect' },
  align: { CENTER_H: 1, CENTER_V: 2 }, prop: { TEXT: 'text' }, text_style: { NONE: 0 },
  createWidget(type, options) {
    const instance = { ...options, type, setProperty(key, value) { this[key] = value } }
    widgets.push(instance)
    return instance
  },
  WatchFace(value) { definition = value },
})
definition.build()
assert.equal(definition.clock.text, '23:59')
assert.equal(definition.heartText.text, '199')
assert.equal(definition.batteryText.text, '100%')
assert.equal(definition.date.text, '31.12')
assert.equal(definition.weekday.text, 'SUN')
assert.equal(widgets[0].color, 0)
Object.assign(readings, { hour: 0, minute: 0, day: 1, date: 1, month: 1 })
listeners.minute()
assert.equal(definition.clock.text, '00:00')
assert.equal(definition.date.text, '01.01')
assert.equal(definition.weekday.text, 'MON')
readings.bpm = 0
listeners.heart()
assert.equal(definition.heartText.text, '--')
readings.battery = 1
listeners.battery()
assert.equal(definition.batteryText.text, '1%')
readings.minute = 1
listeners.minute()
assert.equal(definition.clock.text, '00:01')
const lateHeart = listeners.heart
const lateBattery = listeners.battery
definition.onDestroy()
assert.equal(listeners.heart, undefined)
assert.equal(listeners.battery, undefined)
Object.assign(readings, { minute: 2, bpm: 80, battery: 50 })
listeners.minute()
lateHeart()
lateBattery()
assert.equal(definition.clock.text, '00:01')
assert.equal(definition.heartText.text, '--')
assert.equal(definition.batteryText.text, '1%')
console.log('PASS: startup, midnight/date rollover, sensor updates, missing HR and listener cleanup.')
console.log('Device rendering still requires real-watch checks. Custom AOD is not included.')
