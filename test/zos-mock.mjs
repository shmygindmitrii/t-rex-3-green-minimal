// Minimal stand-ins for the Zepp OS APIs the face uses. `mock` is the test's
// handle on sensor readings, registered listeners and created widgets.
export const mock = {
  readings: { hour: 10, minute: 9, day: 4, date: 12, month: 11, bpm: 72, battery: 82 },
  listeners: {},
  widgets: [],
}

export const widget = { TEXT: 'TEXT', FILL_RECT: 'FILL_RECT', WIDGET_DELEGATE: 'WIDGET_DELEGATE' }
export const align = { LEFT: 'LEFT', RIGHT: 'RIGHT', CENTER_H: 'CENTER_H', TOP: 'TOP', BOTTOM: 'BOTTOM', CENTER_V: 'CENTER_V' }
export const prop = { TEXT: 'TEXT', MORE: 'MORE' }
export const text_style = { NONE: 'NONE', WRAP: 'WRAP', ELLIPSIS: 'ELLIPSIS' }

export function createWidget(type, options) {
  const instance = {
    ...options,
    type,
    setProperty(key, value) {
      if (key === prop.MORE) Object.assign(this, value)
      else if (key === prop.TEXT) this.text = value
      else throw new Error('Unexpected property ' + key)
    },
  }
  mock.widgets.push(instance)
  return instance
}

const { readings: r, listeners: l } = mock
const off = (name, callback) => {
  if (l[name] !== callback) throw new Error('off* called with a different callback for ' + name)
  delete l[name]
}
export class Time {
  getHours() { return r.hour }
  getMinutes() { return r.minute }
  getDay() { return r.day }
  getDate() { return r.date }
  getMonth() { return r.month }
  onPerMinute(callback) { l.minute = callback }
}
export class HeartRate {
  getLast() { return r.bpm }
  onLastChange(callback) { l.heart = callback }
  offLastChange(callback) { off('heart', callback) }
}
export class Battery {
  getCurrent() { return r.battery }
  onChange(callback) { l.battery = callback }
  offChange(callback) { off('battery', callback) }
}
export class Screen {
  onChange(callback) { l.screen = callback }
  offChange(callback) { off('screen', callback) }
}
