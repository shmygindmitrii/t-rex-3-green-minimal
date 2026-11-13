// Browser stand-ins for the Zepp OS APIs, rendering widgets as absolutely
// positioned elements inside #face. Mapped to '@zos/*' by the import map in index.html.
const ASSETS = '/assets/480x480-amazfit-t-rex-3/'
const params = new URLSearchParams(location.search)

export const mock = {
  readings: { hour: 10, minute: 9, day: 4, date: 12, month: 11, bpm: 72, battery: 82 },
  listeners: {},
  permission: 2, // queryPermission status: 2 = granted
  profile: { age: params.has('age') ? +params.get('age') : 34 }, // ?age=50 in the page URL
  edit: {}, // edit_id -> option id chosen in the page's edit controls
  editGroups: [], // options of every WATCHFACE_EDIT_GROUP the face created
  widgets: [],
}

export const widget = { TEXT: 'TEXT', FILL_RECT: 'FILL_RECT', WIDGET_DELEGATE: 'WIDGET_DELEGATE', WATCHFACE_EDIT_GROUP: 'WATCHFACE_EDIT_GROUP' }
export const align = { LEFT: 'flex-start', RIGHT: 'flex-end', CENTER_H: 'center', TOP: 'flex-start', BOTTOM: 'flex-end', CENTER_V: 'center' }
export const prop = { TEXT: 'TEXT', MORE: 'MORE', CURRENT_TYPE: 'CURRENT_TYPE' }
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
  if (type === widget.WATCHFACE_EDIT_GROUP) {
    // Shown only with Guides, as a dashed tap area.
    const el = document.createElement('div')
    el.className = 'edit-area'
    Object.assign(el.style, { left: options.x + 'px', top: options.y + 'px', width: options.w + 'px', height: options.h + 'px' })
    document.querySelector('#face').append(el)
    mock.editGroups.push(options)
    return {
      getProperty: (key) => (key === prop.CURRENT_TYPE && options.edit_id in mock.edit
        ? mock.edit[options.edit_id] : options.default_type),
    }
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

// @zos/app and @zos/user: profile permission and age
export function queryPermission({ permissions }) { return permissions.map(() => mock.permission) }
export function getProfile() { return { ...mock.profile } }

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
