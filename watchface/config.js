// Everything you normally tweak lives in this file: screen, colors, fonts and lines.
//
// Layout model
// ------------
// The face is a list of horizontal LINES. Each line is centered on the screen's
// vertical axis and placed so that its middle sits at `y`. Moving a line = changing
// its `y`. Items inside a line are laid out left to right with `gap` pixels between
// them; their widths are measured from the real font metrics (font-metrics.js).
//
// Line options:
//   id       name used in logs / preview
//   y        vertical center of the line, px from the top of the screen
//   dx       optional horizontal nudge of the whole line (default 0 = centered)
//   gap      default space between items, px
//   show     false hides the whole line
//   items    list of text or image items (see below)
//
// Text item options:
//   id       key under which the widget is exposed (face.ui.widgets[id])
//   value    data key filled by index.js: time, weekday, day, month, heartRate, battery
//   text     fixed text instead of `value`
//   font     path from FONTS
//   size     font size, px
//   color    0xRRGGBB
//   reserve  sample of the widest expected text, e.g. '000'. The item always takes
//            at least that width, so the line doesn't shift when the value changes.
//   align    'left' | 'center' | 'right' inside the reserved width (default center)
//   gap      space before this item, overrides the line gap
//   dy       vertical nudge, px
//   show     false hides the item. Its gap carries over to the next visible item.
//
// Image item options: { type: 'image', id, src, w, h, gap, dy, show }
//   src is relative to assets/<target>/, w/h must match the PNG size
//   (the watch draws images at native size; see tools/make-icons.cjs).
import { getDeviceInfo } from '@zos/device'

const device = getDeviceInfo() || {}

export const SCREEN = {
  width: device.width || 480,
  height: device.height || 480,
}
export const CX = SCREEN.width / 2
export const CY = SCREEN.height / 2

export const COLORS = {
  background: 0x000000,
  time: 0x75ff69,
  date: 0xffa044,
  heartRate: 0xff4949,
  battery: 0x6bde76,
}

// Fonts available in assets/<target>/fonts. After adding a font file, run
// `node tools/font-metrics.cjs` so its widths can be measured.
export const FONTS = {
  DSEG7_BOLD: 'fonts/fonts-DSEG_v046/DSEG7-Classic/DSEG7Classic-Bold.ttf',
  DSEG14_REGULAR: 'fonts/fonts-DSEG_v046/DSEG14-Classic/DSEG14Classic-Regular.ttf',
  DSEG14_BOLD: 'fonts/fonts-DSEG_v046/DSEG14-Classic/DSEG14Classic-Bold.ttf',
}

// Text box height as a multiple of font size. Generous so glyphs never clip;
// text is vertically centered in the box, so this does not move anything.
export const TEXT_BOX_SCALE = 1.8

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export const LINES = [
  {
    id: 'time',
    y: CY - 42,
    items: [
      { id: 'clock', value: 'time', font: FONTS.DSEG7_BOLD, size: 115, color: COLORS.time },
    ],
  },
  {
    id: 'date',
    y: CY + 78,
    gap: 18,
    items: [
      { id: 'weekday', value: 'weekday', font: FONTS.DSEG14_REGULAR, size: 48, color: COLORS.date, reserve: 'WWW' },
      { id: 'day', value: 'day', font: FONTS.DSEG7_BOLD, size: 48, color: COLORS.date, reserve: '00' },
      { id: 'month', value: 'month', font: FONTS.DSEG14_REGULAR, size: 48, color: COLORS.date, reserve: 'WWW' },
    ],
  },
  {
    id: 'stats',
    y: CY + 166,
    gap: 8,
    items: [
      { type: 'image', id: 'heartIcon', src: 'icons/heart.png', w: 36, h: 36, show: false },
      { id: 'heartRate', value: 'heartRate', font: FONTS.DSEG7_BOLD, size: 44, color: COLORS.heartRate, reserve: '000' },
      { type: 'image', id: 'batteryIcon', src: 'icons/battery.png', w: 36, h: 36, gap: 32, show: false },
      { id: 'battery', value: 'battery', font: FONTS.DSEG7_BOLD, size: 44, color: COLORS.battery, reserve: '000', align: 'right' },
      // DSEG7 has no % glyph, so the sign comes from DSEG14.
      { id: 'batteryPercent', text: '%', font: FONTS.DSEG14_BOLD, size: 44, color: COLORS.battery, gap: 4 },
    ],
  },
]
