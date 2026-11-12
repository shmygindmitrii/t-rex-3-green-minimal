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
//   ghost    true draws unlit LCD segments behind every text item of the line
//            ("88:88" behind "10:09"); see GHOST below
//   ghostColor  color of the unlit segments (default: item color dimmed)
//   show     false hides the whole line
//   items    list of text items (see below)
//
// Item options:
//   id       key under which the widget is exposed (face.ui.widgets[id])
//   value    data key filled by index.js: time, weekday, ddmm, heartRate, battery
//   text     fixed text instead of `value`
//   font     path from FONTS
//   size     font size, px
//   color    0xRRGGBB
//   colorBy  value-dependent color, one of COLOR_RULES (see below). Works on fixed
//            text too, so a label can follow its value.
//   reserve  sample of the widest expected text, e.g. '000'. The item always takes
//            at least that width, so the line doesn't shift when the value changes.
//   align    'left' | 'center' | 'right' inside the reserved width (default center)
//   gap      space before this item, overrides the line gap
//   dy       vertical nudge, px
//   ghost    overrides the line: false = no ghost for this item, true = ghost,
//            or an exact ghost string such as '88:88'
//   ghostColor  overrides the line's ghost color
//   show     false hides the item. Its gap carries over to the next visible item.
// T-Rex 3 screen size, fixed on purpose: calling @zos/device getDeviceInfo() while
// this module loads leaves the face blank on the watch (confirmed on device).
export const SCREEN = {
  width: 480,
  height: 480,
}
export const CX = SCREEN.width / 2
export const CY = SCREEN.height / 2

export const COLORS = {
  background: 0x000000,
  time: 0x00ff18,
  date: 0x00e90b,
  heartRate: 0x00d701,
  battery: 0x00d701,
  warning: 0xffd60a, // yellow: battery below 60%, elevated heart rate
  alert: 0xff3b30, // red: battery below 20%, high heart rate
}

// Value-dependent colors. An item with `colorBy` takes the color of the first
// rule that matches the numeric data value, otherwise its own `color`.
// Rule conditions: `below: n` (value < n) or `atLeast: n` (value >= n).
// Values that are not numbers, such as '--', keep the item's own color.
export const COLOR_RULES = {
  battery: {
    value: 'battery',
    rules: [
      { below: 20, color: COLORS.alert },
      { below: 60, color: COLORS.warning },
    ],
  },
  // Zones for a ~34-year-old: max heart rate ~ 220 - 34 = 186 bpm.
  // Yellow from ~70% of max (130 bpm), red from ~85% of max (158 bpm).
  heartRate: {
    value: 'heartRate',
    rules: [
      { atLeast: 158, color: COLORS.alert },
      { atLeast: 130, color: COLORS.warning },
    ],
  },
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

// Ghost segments: the unlit "88:88" background of an old LCD.
// The ghost text is built from the item's `reserve` (or its current text): every
// full-width character becomes the font's all-segments-on character, while
// narrow ones like ':' and '.' are kept. Shorter values are padded with the
// font's blank character so their digits sit exactly on the ghost cells
// ('72' -> '!72' over '888'). Only fonts listed in `chars` get ghosts.
export const GHOST = {
  brightness: 0.15, // default ghost color = item color * brightness (on black)
  blank: '!', // DSEG: blank character as wide as a digit
  chars: {
    [FONTS.DSEG7_BOLD]: '8',
    [FONTS.DSEG14_REGULAR]: '~',
    [FONTS.DSEG14_BOLD]: '~',
  },
}

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export const LINES = [
  {
    id: 'date',
    y: CY - 120,
    gap: 18,
    items: [
      { id: 'weekday', value: 'weekday', font: FONTS.DSEG14_REGULAR, size: 48, color: COLORS.date, reserve: 'WWW', ghost: true },
      { id: 'daymonth', value: 'ddmm', font: FONTS.DSEG7_BOLD, size: 48, color: COLORS.date,  ghost: true },
    ],
  },
  {
    id: 'time',
    y: CY,
    items: [
      { id: 'clock', value: 'time', font: FONTS.DSEG7_BOLD, size: 132, color: COLORS.time, ghost: true },
    ],
  },
  {
    id: 'stats-hrt',
    y: CY + 120,
    gap: 8,
    items: [
      { id: 'heartRatePrefix', text: 'HRT', font: FONTS.DSEG14_REGULAR, size: 40, color: COLORS.heartRate, colorBy: COLOR_RULES.heartRate, ghost: true },
      { id: 'heartRate', value: 'heartRate', font: FONTS.DSEG7_BOLD, size: 40, color: COLORS.heartRate, colorBy: COLOR_RULES.heartRate, reserve: '000', ghost: true },
    ],
  },
  {
    id: 'stats-bat',
    y: CY + 168,
    gap: 8,
    items: [
      { id: 'batteryPrefix', text: 'BAT', font: FONTS.DSEG14_REGULAR, size: 40, color: COLORS.battery, colorBy: COLOR_RULES.battery, ghost: true },
      { id: 'battery', value: 'battery', font: FONTS.DSEG7_BOLD, size: 40, color: COLORS.battery, colorBy: COLOR_RULES.battery, reserve: '000', align: 'right', ghost: true },
    ],
  },
]
