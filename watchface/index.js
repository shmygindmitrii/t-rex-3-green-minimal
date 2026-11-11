import { createWidget, widget, align, prop, text_style } from '@zos/ui'
import { Time, HeartRate, Battery, Screen } from '@zos/sensor'

const CLOCK_FONT = 'fonts/fonts-DSEG_v046/DSEG7-Classic/DSEG7Classic-Bold.ttf'
const HR_FONT = 'fonts/fonts-DSEG_v046/DSEG7-Classic/DSEG7Classic-Bold.ttf'
const DATE_DDMM_FONT = 'fonts/fonts-DSEG_v046/DSEG7-Classic/DSEG7Classic-Bold.ttf'
const DATE_WORD_FONT = 'fonts/fonts-DSEG_v046/DSEG14-Classic/DSEG14Classic-Regular.ttf'
const BATTERY_FONT = 'fonts/fonts-DSEG_v046/DSEG7-Classic/DSEG7Classic-Bold.ttf'
const BATTERY_PERCENT_FONT = 'fonts/fonts-DSEG_v046/DSEG14-Classic/DSEG14Classic-Bold.ttf'
const GREEN = 0x75ff69
const RED = 0xff4949
const ORANGE = 0xffa044
const BATTERY_GREEN = 0x6bde76
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

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
    const label = (x, y, w, h, size, color, text, font) => createWidget(widget.TEXT, {
      x, y, w, h, font,
      text_size: size, color, text,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
    })

    this.clock = label(32, 95, 416, 205, 115, GREEN, '', CLOCK_FONT)
    this.weekday = label(64, 280, 118, 76, 48, ORANGE, '', DATE_WORD_FONT)
    this.date = label(200, 280, 80, 76, 48, ORANGE, '', DATE_DDMM_FONT)
    this.month = label(298, 280, 118, 76, 48, ORANGE, '', DATE_WORD_FONT)
    this.heartText = label(80, 368, 128, 76, 44, RED, '--', HR_FONT)
    this.batteryText = label(240, 368, 160, 76, 44, BATTERY_GREEN, '', BATTERY_FONT)
    this.batteryPercent = label(364, 368, 36, 76, 44, BATTERY_GREEN, '%', BATTERY_PERCENT_FONT)

    this.refreshBattery = () => {
      if (this.destroyed) return
      const value = '' + this.battery.getCurrent()
      // Use DSEG14's percent glyph alongside the DSEG7 digits.
      const width = Math.ceil(value.length * 0.816 * 44)
      const x = Math.floor(316 - (width + 40) / 2)
      this.batteryText.setProperty(prop.MORE, { x, w: width, text: value })
      this.batteryPercent.setProperty(prop.MORE, { x: x + width + 4 })
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
      this.weekday.setProperty(prop.TEXT, DAYS[this.time.getDay() - 1])
      this.date.setProperty(prop.TEXT, pad(this.time.getDate()))
      this.month.setProperty(prop.TEXT, MONTHS[this.time.getMonth() - 1])
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
