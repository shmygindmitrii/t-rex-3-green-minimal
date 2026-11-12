// Line layout engine: measures items, centers each line and keeps widgets in sync.
// Positions are never hardcoded; they are computed from config.js on every update.
import { createWidget, widget, align, prop, text_style } from '@zos/ui'
import { FONT_METRICS } from './font-metrics.js'
import { TEXT_BOX_SCALE, GHOST } from './config.js'

const H_ALIGN = { left: align.LEFT, center: align.CENTER_H, right: align.RIGHT }

// Width of `text` in px when drawn with `font` at `size`.
export function textWidth(text, font, size) {
  const metrics = FONT_METRICS[font]
  if (!metrics) throw new Error('No metrics for font ' + font + '; run node tools/font-metrics.cjs')
  let units = 0
  for (const ch of '' + text) {
    units += ch in metrics.widths ? metrics.widths[ch] : metrics.fallback
  }
  return units * size
}

const visible = (entry) => entry.show !== false

function itemText(item, values) {
  if (item.text !== undefined) return '' + item.text
  const value = values[item.value]
  return value === undefined || value === null ? '' : '' + value
}

// Current color of an item: the first matching `colorBy` rule for the numeric
// data value, otherwise the item's own color (also for non-numbers such as '--').
export function itemColor(item, values) {
  const by = item.colorBy
  if (!by) return item.color
  const raw = values[by.value]
  const n = raw === undefined || raw === null || raw === '' ? NaN : Number(raw)
  if (isNaN(n)) return item.color
  for (const rule of by.rules) {
    if (rule.below !== undefined && n < rule.below) return rule.color
    if (rule.atLeast !== undefined && n >= rule.atLeast) return rule.color
  }
  return item.color
}

const ghostColor = (item, line, color) => (item.ghostColor !== undefined ? item.ghostColor
  : line.ghostColor !== undefined ? line.ghostColor
    : dim(color, GHOST.brightness))

// Dim a 0xRRGGBB color, as an unlit segment on a black background.
export function dim(color, factor) {
  const channel = (shift) => Math.round(((color >> shift) & 0xff) * factor) << shift
  return channel(16) | channel(8) | channel(0)
}

// Ghost text for an item, or null when the item has no ghost.
// `text` is the current (unpadded) value; the ghost covers it and the reserve.
export function ghostText(item, line, text) {
  const setting = item.ghost !== undefined ? item.ghost : line.ghost
  if (!setting) return null
  if (typeof setting === 'string') return setting
  const on = GHOST.chars[item.font]
  if (!on) return null
  const reserve = item.reserve || ''
  const source = textWidth(reserve, item.font, 1) >= textWidth(text, item.font, 1) ? reserve : text
  const cell = textWidth(on, item.font, 1)
  let ghost = ''
  for (const ch of source) ghost += textWidth(ch, item.font, 1) === cell ? on : ch
  return ghost
}

// Pad `text` with blank cells until it is as wide as the ghost, so each digit
// lands on a ghost cell. Pads on the left (LCD style) unless align is 'left'.
function padToGhost(text, ghost, item) {
  if (!GHOST.chars[item.font]) return text
  const target = textWidth(ghost, item.font, 1) - 1e-6
  let padded = text
  for (let i = 0; i < 32 && textWidth(padded, item.font, 1) < target; i++) {
    padded = item.align === 'left' ? padded + GHOST.blank : GHOST.blank + padded
  }
  return padded
}

function itemWidth(item, text, ghost) {
  const reserved = item.reserve ? textWidth(item.reserve, item.font, item.size) : 0
  const ghostWidth = ghost ? textWidth(ghost, item.font, item.size) : 0
  return Math.ceil(Math.max(textWidth(text, item.font, item.size), reserved, ghostWidth))
}

function itemBox(item, line) {
  const h = Math.round(item.size * TEXT_BOX_SCALE)
  return { y: Math.round(line.y - h / 2 + (item.dy || 0)), h }
}

// Horizontal placement of one line for the given values.
// Returns { width, x, items: [{ item, text, ghost, color, x, w }] }, hidden items excluded.
export function measureLine(line, values, screenWidth) {
  const placed = []
  let width = 0
  let pendingGap = 0
  for (const item of line.items) {
    const gap = item.gap !== undefined ? item.gap : line.gap || 0
    if (!visible(item)) {
      pendingGap = Math.max(pendingGap, gap)
      continue
    }
    if (placed.length) width += Math.max(pendingGap, gap)
    pendingGap = 0
    let text = itemText(item, values)
    const ghost = ghostText(item, line, text)
    if (ghost) text = padToGhost(text, ghost, item)
    const w = itemWidth(item, text, ghost)
    placed.push({ item, text, ghost, color: itemColor(item, values), x: width, w })
    width += w
  }
  const x = Math.round(screenWidth / 2 + (line.dx || 0) - width / 2)
  placed.forEach((entry) => { entry.x += x })
  return { width, x, items: placed }
}

function textWidget(item, box, text, color) {
  return createWidget(widget.TEXT, {
    ...box,
    font: item.font,
    text_size: item.size,
    color,
    text,
    align_h: H_ALIGN[item.align || 'center'],
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
  })
}

// Create widgets for all visible lines. Returns
//   widgets  map of item id -> widget
//   ghosts   map of item id -> ghost widget (items with ghost segments only)
//   update(values)  re-measure every line and push changed text/positions
//   measure(lineId) last layout of a line ({ width, x, items })
export function buildLines(lines, screen, values) {
  const widgets = {}
  const ghosts = {}
  const state = {}
  const layouts = {}
  const shown = lines.filter(visible)

  shown.forEach((line) => {
    measureLine(line, values, screen.width).items.forEach(({ item, text, ghost, color, x, w }) => {
      const box = { x, w, ...itemBox(item, line) }
      // Created first so it is drawn behind the lit text.
      if (ghost !== null) ghosts[item.id] = textWidget(item, box, ghost, ghostColor(item, line, color))
      widgets[item.id] = textWidget(item, box, text, color)
      state[item.id] = { x, w, text, ghost, color }
    })
  })

  const update = (next) => {
    shown.forEach((line) => {
      const layout = measureLine(line, next, screen.width)
      layouts[line.id] = layout
      layout.items.forEach(({ item, text, ghost, color, x, w }) => {
        const last = state[item.id]
        if (last.x === x && last.w === w && last.text === text && last.ghost === ghost && last.color === color) return
        widgets[item.id].setProperty(prop.MORE, { x, w, text, color })
        if (ghosts[item.id]) ghosts[item.id].setProperty(prop.MORE, { x, w, text: ghost, color: ghostColor(item, line, color) })
        state[item.id] = { x, w, text, ghost, color }
      })
    })
  }

  update(values)
  return { widgets, ghosts, update, measure: (id) => layouts[id] }
}
