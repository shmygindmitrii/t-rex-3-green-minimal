// Watch face lifecycle: reads sensors into `values` and hands them to the layout.
// Layout, fonts and colors are in config.js.
import { createWidget, widget } from '@zos/ui'
import { Time, HeartRate, Battery, Screen } from '@zos/sensor'
import { SCREEN, COLORS, LINES, DAYS } from './config.js'
import { buildLines } from './layout.js'

const pad = (value) => (value < 10 ? '0' + value : '' + value)

WatchFace({
  build() {
    this.destroyed = false
    this.time = new Time()
    this.heartRate = new HeartRate()
    this.battery = new Battery()
    this.screen = new Screen()
    this.values = {}

    createWidget(widget.FILL_RECT, {
      x: 0, y: 0, w: SCREEN.width, h: SCREEN.height, color: COLORS.background,
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
