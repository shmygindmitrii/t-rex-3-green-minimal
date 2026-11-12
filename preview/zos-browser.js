// Browser stand-ins for the Zepp OS APIs, rendering widgets as absolutely
// positioned elements inside #face. Mapped to '@zos/*' by the import map in index.html.
const ASSETS = '/assets/480x480-amazfit-t-rex-3/'
const params = new URLSearchParams(location.search)

export const mock = {
  device: { width: +params.get('w') || 480, height: +params.get('h') || 480 },
  readings: { hour: 10, minute: 9, day: 4, date: 12, month: 11, bpm: 72, battery: 82 },
  listeners: {},
  widgets: [],
}

export const widget = { TEXT: 'TEXT', FILL_RECT: 'FILL_RECT', WIDGET_DELEGATE: 'WIDGET_DELEGATE' }
export const align = { LEFT: 'flex-start', RIGHT: 'flex-end', CENTER_H: 'center', TOP: 'flex-start', BOTTOM: 'flex-end', CENTER_V: 'center' }
export const prop = { TEXT: 'TEXT', MORE: 'MORE' }
export const text_style = { NONE: 'NONE', WRAP: 'WRAP', ELLIPSIS: 'ELLIPSIS' }

const fonts = {}
function fontFamily(path) {
  if (!fonts[path]) {
    fonts[path] = 'zos-font-' + Object.keys(fonts).length
    const face = new FontFace(fonts[path], `url(${ASSETS}${path})`)
    document.fonts.add(face)
    face.load().catch(() => console.error('Font not found: ' + path))
  }
  return fonts[path]
}

const hex = (color) => '#' + (color >>> 0).toString(16).padStart(6, '0')

function paint(el, type, o) {
  Object.assign(el.style, { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h + 'px' })
  if (type === widget.FILL_RECT) el.style.background = hex(o.color)
  if (type === widget.TEXT) {
    Object.assign(el.style, {
      color: hex(o.color),
      fontSize: o.text_size + 'px',
      fontFamily: o.font ? fontFamily(o.font) : 'sans-serif',
      justifyContent: o.align_h || 'flex-start',
      alignItems: o.align_v || 'flex-start',
    })
    el.textContent = o.text
  }
}

export function createWidget(type, options) {
  if (type === widget.WIDGET_DELEGATE) {
    mock.listeners.resume = options.resume_call
    return {}
  }
  const el = document.createElement('div')
  el.className = 'widget widget-' + type.toLowerCase()
  const state = { ...options }
  paint(el, type, state)
  document.querySelector('#face').append(el)
  const instance = {
    el,
    state,
    setProperty(key, value) {
      if (key === prop.MORE) Object.assign(state, value)
      else if (key === prop.TEXT) state.text = value
      paint(el, type, state)
    },
  }
  mock.widgets.push(instance)
  return instance
}

export function getDeviceInfo() { return { ...mock.device } }

const { readings: r, listeners: l } = mock
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
  offLastChange() { delete l.heart }
}
export class Battery {
  getCurrent() { return r.battery }
  onChange(callback) { l.battery = callback }
  offChange() { delete l.battery }
}
export class Screen {
  onChange(callback) { l.screen = callback }
  offChange() { delete l.screen }
}
