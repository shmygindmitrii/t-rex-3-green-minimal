// Watch face lifecycle: reads sensors into `values` and hands them to the layout.
// Layout, fonts and colors are in config.js; the watch's edit-mode choices in edit.js.
import { createWidget, widget } from '@zos/ui'
import { Time, HeartRate, Battery, Screen } from '@zos/sensor'
import { queryPermission } from '@zos/app'
import { getProfile } from '@zos/user'
import { SCREEN, BACKGROUND, LINES, DAYS, COLOR_RULES, heartRateRules } from './config.js'
import { buildLines } from './layout.js'
import { readTheme } from './edit.js'

const pad = (value) => (value < 10 ? '0' + value : '' + value)

// Age from the Zepp profile, or undefined. Only checks the permission (granted
// silently at install, confirmed on the watch); never requests it, so no popup.
const PROFILE_PERMISSION = 'data:user.info'
const PERMISSION_GRANTED = 2
const readAge = () => {
  try {
    const [status] = queryPermission({ permissions: [PROFILE_PERMISSION] })
    if (status !== PERMISSION_GRANTED) return undefined
    return getProfile().age
  } catch (e) {
    return undefined
  }
}

WatchFace({
  build() {
    this.destroyed = false
    this.time = new Time()
    this.heartRate = new HeartRate()
    this.battery = new Battery()
    this.screen = new Screen()
    this.values = {}
    // Heart-rate zones for the user's age; falls back to the default age.
    COLOR_RULES.heartRate.rules = heartRateRules(readAge())

    createWidget(widget.FILL_RECT, {
      x: 0, y: 0, w: SCREEN.width, h: SCREEN.height, color: BACKGROUND,
    })

    // Each reader fills its part of `values`; render() pushes them to the widgets.
    const readTime = () => {
      const t = this.time
      this.values.time = pad(t.getHours()) + ':' + pad(t.getMinutes())
      this.values.weekday = DAYS[t.getDay() - 1]
      this.values.ddmm = pad(t.getDate()) + '.' + pad(t.getMonth())
    }
    const readHeart = () => {
      const bpm = this.heartRate.getLast()
      this.values.heartRate = bpm > 0 ? '' + bpm : '--'
    }
    const readBattery = () => {
      this.values.battery = '' + this.battery.getCurrent()
    }
    const render = () => this.ui.update(this.values)
    const on = (read) => () => {
      if (this.destroyed) return
      read()
      render()
    }

    readTime()
    readHeart()
    readBattery()
    this.ui = buildLines(LINES, SCREEN, this.values)
    // Edit-mode areas, created after the lines: the watch draws widgets in creation
    // order, and the option previews must cover the live face while choosing.
    // Their choice can only be read once they exist, so the lines are recolored
    // here, before anything is shown. The face restarts after the user saves a
    // choice, so reading it once is enough.
    this.theme = readTheme()
    this.ui.setTheme(this.theme)

    this.refreshHeart = on(readHeart)
    this.refreshBattery = on(readBattery)
    this.refresh = on(() => { readTime(); readHeart(); readBattery() })

    this.time.onPerMinute(this.refresh)
    // Minute events can be missed while the face is suspended.
    this.onScreenChange = (status) => {
      if (status === 1) this.refresh()
    }
    this.screen.onChange(this.onScreenChange)
    createWidget(widget.WIDGET_DELEGATE, { resume_call: () => this.refresh() })
    // Follow the latest watch reading without starting continuous measurement.
    this.heartRate.onLastChange(this.refreshHeart)
    this.battery.onChange(this.refreshBattery)
  },
  onDestroy() {
    // Time has no documented offPerMinute API; ignore any late callbacks.
    this.destroyed = true
    if (this.screen) this.screen.offChange(this.onScreenChange)
    if (this.heartRate) this.heartRate.offLastChange(this.refreshHeart)
    if (this.battery) this.battery.offChange(this.refreshBattery)
  },
})
