// Everything you normally tweak lives in this file: screen, color schemes, fonts,
// lines and the watch's edit-mode options.
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
//   ghostColor  color of the unlit segments (default: item color dimmed by the
//            ghost level chosen on the watch, see GHOST)
//   show     false hides the whole line
//   items    list of text items (see below)
//
// Item options:
//   id       key under which the widget is exposed (face.ui.widgets[id])
//   value    data key filled by index.js: time, weekday, ddmm, heartRate, battery
//   text     fixed text instead of `value`
//   font     path from FONTS
//   size     font size, px
//   color    a color role from SCHEMES ('time', 'date', ...), so it follows the
//            scheme chosen on the watch, or a fixed 0xRRGGBB
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

// Background, the same for every scheme (Zepp requires black faces).
export const BACKGROUND = 0x000000

// Color schemes, chosen on the watch: long-press the face > Edit > tap the time.
// The first scheme is the default. Items and COLOR_RULES name colors by role
// ('time', 'warning', ...), so every scheme must define every role.
// `warning` and `alert` (see COLOR_RULES) must stand out from the scheme's own
// colors. Shades: date and values are dimmer than the time, by the same ratio in
// every scheme (date ~0.91, values ~0.84).
// `type` is the edit-mode option id (>= 100000). The watch stores the user's
// choice by it, so never change or reuse an id. After changing schemes, run
// `node tools/make-edit-images.mjs` to redraw the edit-mode previews.
export const SCHEMES = [
  {
    type: 100001, name: 'Green', title_sc: '绿色', title_tc: '綠色',
    colors: { time: 0x00ff18, date: 0x00e90b, heartRate: 0x00d701, battery: 0x00d701, warning: 0xffd60a, alert: 0xff3b30 },
  },
  {
    type: 100002, name: 'Cyan', title_sc: '青色', title_tc: '青色',
    colors: { time: 0x00e5ff, date: 0x00d1e9, heartRate: 0x00c1d7, battery: 0x00c1d7, warning: 0xffd60a, alert: 0xff3b30 },
  },
  {
    type: 100003, name: 'Orange', title_sc: '橙色', title_tc: '橙色',
    colors: { time: 0xff8a1a, date: 0xe97e18, heartRate: 0xd77416, battery: 0xd77416, warning: 0xfff200, alert: 0xff2d6f },
  },
  {
    type: 100004, name: 'Red', title_sc: '红色', title_tc: '紅色',
    colors: { time: 0xff2020, date: 0xe91d1d, heartRate: 0xd71b1b, battery: 0xd71b1b, warning: 0xffd60a, alert: 0xffffff },
  },
]

export const FONT_SIZES = {
  time: 132,
  date: 50,
  heartRate: 44,
  battery: 44,
}

export const LINE_OFFSETS_Y = {
  time: 0, // center
  date: -120, // top
  heartRate: 120,
  battery: 175,
}

// Heart-rate zones as a share of max heart rate, estimated as 220 - age. The age
// comes from the Zepp profile when the face starts; `defaultAge` is used when the
// profile has no usable age (outside `minAge`..`maxAge`).
export const HEART_RATE_ZONES = {
  defaultAge: 34,
  minAge: 10,
  maxAge: 100,
  warning: 0.70, // yellow from this share of max
  alert: 0.85, // red from this share of max
}

// Heart-rate color rules for an age (the preview shows the resulting bpm).
export function heartRateRules(age) {
  const z = HEART_RATE_ZONES
  const valid = typeof age === 'number' && age >= z.minAge && age <= z.maxAge
  const max = 220 - (valid ? age : z.defaultAge)
  return [
    { atLeast: Math.round(max * z.alert), color: 'alert' },
    { atLeast: Math.round(max * z.warning), color: 'warning' },
  ]
}

// Value-dependent colors. An item with `colorBy` takes the color of the first
// rule that matches the numeric data value, otherwise its own `color`.
// Rule conditions: `below: n` (value < n) or `atLeast: n` (value >= n).
// Rule colors are scheme roles. Values that are not numbers, such as '--', keep
// the item's own color.
export const COLOR_RULES = {
  battery: {
    value: 'battery',
    rules: [
      { below: 20, color: 'alert' },
      { below: 50, color: 'warning' },
    ],
  },
  // Built for `defaultAge`; index.js replaces the rules with the profile age.
  heartRate: {
    value: 'heartRate',
    rules: heartRateRules(HEART_RATE_ZONES.defaultAge),
  },
}

// Fonts available in assets/<target>/fonts. After adding a font file, run
// `node tools/font-metrics.cjs` so its widths can be measured.
export const FONTS = {
  DSEG7_BOLD: 'fonts/fonts-DSEG_v046/DSEG7-Classic/DSEG7Classic-Bold.ttf',
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
// The brightness (ghost color = item color * level) is chosen on the watch
// from `levels`: long-press the face > Edit > tap the date. Level 0 hides the
// ghosts (drawn in the background color); the layout stays the same. Each
// level's edit-mode option id is `typeBase + level * 100` (0.15 -> 100115);
// keep `typeBase` unchanged.
export const GHOST = {
  levels: [0, 0.05, 0.1, 0.15, 0.2],
  default: 0.15,
  typeBase: 100100,
  blank: '!', // DSEG: blank character as wide as a digit
  chars: {
    [FONTS.DSEG7_BOLD]: '8',
    [FONTS.DSEG14_BOLD]: '~',
  },
}

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export const LINES = [
  {
    id: 'date',
    y: CY + LINE_OFFSETS_Y.date,
    gap: 18,
    items: [
      { id: 'weekday', value: 'weekday', font: FONTS.DSEG14_BOLD, size: FONT_SIZES.date, color: 'date', reserve: 'WWW', ghost: true },
      { id: 'daymonth', value: 'ddmm', font: FONTS.DSEG7_BOLD, size: FONT_SIZES.date, color: 'date',  ghost: true },
    ],
  },
  {
    id: 'time',
    y: CY + LINE_OFFSETS_Y.time,
    items: [
      { id: 'clock', value: 'time', font: FONTS.DSEG7_BOLD, size: FONT_SIZES.time, color: 'time', ghost: true },
    ],
  },
  {
    id: 'stats-hrt',
    y: CY + LINE_OFFSETS_Y.heartRate,
    gap: 8,
    items: [
      { id: 'heartRatePrefix', text: '!HR', font: FONTS.DSEG14_BOLD, size: FONT_SIZES.heartRate, color: 'heartRate', colorBy: COLOR_RULES.heartRate, ghost: true },
      { id: 'heartRate', value: 'heartRate', font: FONTS.DSEG7_BOLD, size: FONT_SIZES.heartRate, color: 'heartRate', colorBy: COLOR_RULES.heartRate, reserve: '000', ghost: true },
    ],
  },
  {
    id: 'stats-bat',
    y: CY + LINE_OFFSETS_Y.battery,
    gap: 8,
    items: [
      { id: 'batteryPrefix', text: 'BAT', font: FONTS.DSEG14_BOLD, size: FONT_SIZES.battery, color: 'battery', colorBy: COLOR_RULES.battery, ghost: true },
      { id: 'battery', value: 'battery', font: FONTS.DSEG7_BOLD, size: FONT_SIZES.battery, color: 'battery', colorBy: COLOR_RULES.battery, reserve: '000', align: 'right', ghost: true },
    ],
  },
]

// Edit mode (long-press the face > Edit): each option list is a tappable area
// centered on a line. `id` must stay unique and unchanged (the watch stores the
// choice under it). `tips` places the option name above or below the area.
// After changing sizes, run `node tools/make-edit-images.mjs`.
export const EDIT = {
  scheme: { id: 101, line: 'time', w: 464, h: 120, tips: 'below' }, // covers the clock
  ghost: { id: 102, line: 'date', w: 340, h: 90, tips: 'above' },
  tipsSize: { w: 180, h: 44 },
  tipsColor: 0xf0f0f0, // label background; the watch draws the option name in dark text
  gap: 6, // between an area and its tips
}
