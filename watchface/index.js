import { createWidget, widget, align, prop, text_style } from '@zos/ui'
import { Time, HeartRate, Battery, Screen } from '@zos/sensor'

const FONT = 'fonts/BebasNeue-Regular.ttf'
const CLOCK_FONT = 'fonts/DSEG7-Classic/DSEG7Classic-Bold.ttf'
const HR_FONT = 'fonts/DSEG7-Classic/DSEG7Classic-Regular.ttf'
const DATE_DDMM_FONT = 'fonts/DSEG7-Classic/DSEG7Classic-Regular.ttf'
const DATE_DW_FONT = 'fonts/DSEG14-Classic/DSEG14Classic-Light.ttf'
const BATTERY_FONT = 'fonts/DSEG7-Classic/DSEG7Classic-Regular.ttf'
const GREEN = 0x75ff69
const RED = 0xff4949
const ORANGE = 0xffa044
const BATTERY_GREEN = 0x6bde76
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

const pad = (value) => (value < 10 ? '0' + value : '' + value)

WatchFace({
  build() {
    this.destroyed = false
    this.time = new Time()
    this.heartRate = new HeartRate()
    this.battery = new Battery()
    this.screen = new Screen()
    createWidget(widget.FILL_RECT, {
      x: 0, y: 0, w: 480, h: 480, color: 0x000000,
    })
    const label = (x, y, w, h, size, color, text) => createWidget(widget.TEXT, {
      x, y, w, h, font: FONT,
      text_size: size, color, text,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
    })

    this.clock = label(32, 95, 416, 205, 200, GREEN, '')
    this.heartText = label(40, 280, 128, 96, 80, RED, '--')
    this.weekday = label(175, 280, 130, 96, 64, ORANGE, '')
    this.date = label(312, 280, 128, 96, 64, ORANGE, '')
    this.batteryText = label(160, 378, 160, 76, 54, BATTERY_GREEN, '')

    this.refreshBattery = () => {
      if (this.destroyed) return
      this.batteryText.setProperty(prop.TEXT, this.battery.getCurrent() + '%')
    }

    this.refreshHeart = () => {
      if (this.destroyed) return
      const bpm = this.heartRate.getLast()
      this.heartText.setProperty(prop.TEXT, bpm > 0 ? '' + bpm : '--')
    }

    this.refresh = () => {
      if (this.destroyed) return
      const clock = pad(this.time.getHours()) + ':' + pad(this.time.getMinutes())
      this.clock.setProperty(prop.TEXT, clock)
      this.date.setProperty(prop.TEXT,
        pad(this.time.getDate()) + '.' + pad(this.time.getMonth()))
      this.weekday.setProperty(prop.TEXT, DAYS[this.time.getDay() - 1])
      this.refreshHeart()
      this.refreshBattery()
    }
    this.refresh()
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
