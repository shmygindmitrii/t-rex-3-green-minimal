// Watch edit mode: the color scheme and ghost level the user picks on the watch
// (long-press the face > Edit). Options, ids and areas come from config.js; this
// file only turns them into WATCHFACE_EDIT_GROUP widgets and reads the choice.
// tools/make-edit-images.mjs uses the same areas and image paths.
import { createWidget, widget, prop } from '@zos/ui'
import { SCHEMES, GHOST, EDIT, LINES, CX } from './config.js'

// Edit-mode option id of a ghost level: 0.15 -> typeBase + 15.
export const ghostType = (level) => GHOST.typeBase + Math.round(level * 100)

// Scheme for an edit-mode option id; the first scheme for anything else, such
// as the -1 the watch reports while the user is choosing.
export const schemeFor = (type) => SCHEMES.find((s) => s.type === type) || SCHEMES[0]

// Ghost level for an option id; GHOST.default for anything else.
export function ghostFor(type) {
  const level = GHOST.levels.find((l) => ghostType(l) === type)
  return level === undefined ? GHOST.default : level
}

// Theme for the selected option ids: { colors, ghost }.
export const themeFor = (schemeType, ghostTypeId) => ({
  colors: schemeFor(schemeType).colors,
  ghost: ghostFor(ghostTypeId),
})

export const DEFAULT_THEME = themeFor()

// Option lists: { type, image, title_en, title_sc, title_tc }.
const percent = (level) => Math.round(level * 100) + '%'
export const OPTIONS = {
  scheme: SCHEMES.map((s) => ({
    type: s.type, title_en: s.name, title_sc: s.title_sc, title_tc: s.title_tc,
  })),
  ghost: GHOST.levels.map((level) => ({
    type: ghostType(level), level,
    title_en: 'Ghost ' + percent(level), title_sc: '暗段 ' + percent(level), title_tc: '暗段 ' + percent(level),
  })),
}
export const DEFAULT_TYPE = { scheme: SCHEMES[0].type, ghost: ghostType(GHOST.default) }

// Image paths, relative to assets/<target>/.
export const IMAGES = {
  preview: (name, type) => `edit/${name}-${type}.png`,
  select: (name) => `edit/${name}-select.png`,
  unselect: (name) => `edit/${name}-unselect.png`,
  tips: 'edit/tips.png',
}

// Screen box of an edit area: centered on its line.
export function editArea(name) {
  const area = EDIT[name]
  const line = LINES.find((l) => l.id === area.line)
  if (!line) throw new Error(`EDIT.${name}: no line '${area.line}'`)
  return { x: Math.round(CX - area.w / 2), y: Math.round(line.y - area.h / 2), w: area.w, h: area.h }
}

// Tips position relative to the area, as WATCHFACE_EDIT_GROUP expects.
function tipsOffset(name) {
  const area = EDIT[name]
  const { w, h } = EDIT.tipsSize
  return {
    tips_x: Math.round((area.w - w) / 2),
    tips_y: area.tips === 'above' ? -(h + EDIT.gap) : area.h + EDIT.gap,
    tips_width: w,
  }
}

function editGroup(name) {
  return createWidget(widget.WATCHFACE_EDIT_GROUP, {
    edit_id: EDIT[name].id,
    ...editArea(name),
    select_image: IMAGES.select(name),
    un_select_image: IMAGES.unselect(name),
    default_type: DEFAULT_TYPE[name],
    optional_types: OPTIONS[name].map(({ type, title_en, title_sc, title_tc }) => ({
      type, preview: IMAGES.preview(name, type), title_en, title_sc, title_tc,
    })),
    count: OPTIONS[name].length,
    tips_BG: IMAGES.tips,
    ...tipsOffset(name),
  })
}

// Create the edit areas and return the theme the user chose.
export function readTheme() {
  const read = (name) => {
    try {
      return editGroup(name).getProperty(prop.CURRENT_TYPE)
    } catch (e) {
      return undefined
    }
  }
  return themeFor(read('scheme'), read('ghost'))
}
