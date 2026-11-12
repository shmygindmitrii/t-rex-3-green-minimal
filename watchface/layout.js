// Line layout engine: measures items, centers each line and keeps widgets in sync.
// Positions are never hardcoded; they are computed from config.js on every update.
import { createWidget, widget, align, prop, text_style } from '@zos/ui'
import { FONT_METRICS } from './font-metrics.js'

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
const isImage = (item) => item.type === 'image'

function itemText(item, values) {
  if (item.text !== undefined) return '' + item.text
  const value = values[item.value]
  return value === undefined || value === null ? '' : '' + value
}

function itemWidth(item, text) {
  if (isImage(item)) return item.w
  const reserved = item.reserve ? textWidth(item.reserve, item.font, item.size) : 0
  return Math.ceil(Math.max(textWidth(text, item.font, item.size), reserved))
}

function itemBox(item, line, scale) {
  const h = isImage(item) ? item.h : Math.round(item.size * scale)
  return { y: Math.round(line.y - h / 2 + (item.dy || 0)), h }
}

// Horizontal placement of one line for the given values.
// Returns { width, x, items: [{ item, text, x, w }] }, hidden items excluded.
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
    const text = isImage(item) ? '' : itemText(item, values)
    const w = itemWidth(item, text)
    placed.push({ item, text, x: width, w })
    width += w
  }
  const x = Math.round(screenWidth / 2 + (line.dx || 0) - width / 2)
  placed.forEach((entry) => { entry.x += x })
  return { width, x, items: placed }
}

// Create widgets for all visible lines. Returns
//   widgets  map of item id -> widget
//   update(values)  re-measure every line and push changed text/positions
//   measure(lineId) last layout of a line ({ width, x, items })
export function buildLines(lines, screen, values, textBoxScale) {
  const widgets = {}
  const state = {}
  const layouts = {}
  const shown = lines.filter(visible)

  shown.forEach((line) => {
    measureLine(line, values, screen.width).items.forEach(({ item, text, x, w }) => {
      const { y, h } = itemBox(item, line, textBoxScale)
      widgets[item.id] = isImage(item)
        ? createWidget(widget.IMG, { x, y, w, h, src: item.src })
        : createWidget(widget.TEXT, {
          x, y, w, h,
          font: item.font,
          text_size: item.size,
          color: item.color,
          text,
          align_h: H_ALIGN[item.align || 'center'],
          align_v: align.CENTER_V,
          text_style: text_style.NONE,
        })
      state[item.id] = { x, w, text }
    })
  })

  const update = (next) => {
    shown.forEach((line) => {
      const layout = measureLine(line, next, screen.width)
      layouts[line.id] = layout
      layout.items.forEach(({ item, text, x, w }) => {
        const last = state[item.id]
        if (last.x === x && last.w === w && last.text === text) return
        const change = isImage(item) ? { x } : { x, w, text }
        widgets[item.id].setProperty(prop.MORE, change)
        state[item.id] = { x, w, text }
      })
    })
  }

  update(values)
  return { widgets, update, measure: (id) => layouts[id] }
}
