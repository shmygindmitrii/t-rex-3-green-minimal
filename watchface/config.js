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
  time: 0x03e97d,
  date: 0x6ae456,
  heartRate: 0x9edb03,
  battery: 0xb5d600,
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
      { id: 'clock', value: 'time', font: FONTS.DSEG7_BOLD, size: 136, color: COLORS.time, ghost: true },
    ],
  },
  {
    id: 'stats-hrt',
    y: CY + 120,
    gap: 8,
    items: [
      { id: 'heartRatePrefix', text: 'HRT', font: FONTS.DSEG14_REGULAR, size: 40, color: COLORS.heartRate, ghost: true },
      { id: 'heartRate', value: 'heartRate', font: FONTS.DSEG7_BOLD, size: 40, color: COLORS.heartRate, reserve: '000', ghost: true },
    ],
  },
  {
    id: 'stats-bat',
    y: CY + 168,
    gap: 8,
    items: [
      { id: 'batteryPrefix', text: 'BAT', font: FONTS.DSEG14_REGULAR, size: 40, color: COLORS.battery, ghost: true},
      { id: 'battery', value: 'battery', font: FONTS.DSEG7_BOLD, size: 40, color: COLORS.battery, reserve: '000', align: 'right', ghost: true },
    ],
  },
]
