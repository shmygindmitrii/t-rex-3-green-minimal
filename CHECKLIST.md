# LCD Minimal release checks

Author: Dmitrii Shmygin. Target: Amazfit T-Rex 3, 480 x 480.

## Before installing

- Run `node test/check.mjs` for mock runtime checks of data updates, line centering,
  reserved widths, ghost segments, value colors, color schemes, ghost levels, edit
  mode and lifecycle cleanup. It also fails when an edit-mode image is missing.
- Run `zeus.cmd build` to check bundling, fonts, the package icon and compilation.
- Run `node preview/server.mjs` and open http://localhost:8080/ to review the layout.
  Its sample controls exercise long values. There must be no "outside round screen"
  warnings.
- The browser preview approximates text rendering; the watch remains the final check.

## On the watch

1. Run `zeus.cmd preview`, scan the new QR code and install LCD Minimal.
2. Confirm green weekday and DD.MM date, time, HRT heart rate and BAT battery
   percentage, and dim ghost segments behind them (the defaults).
3. Long-press the face → Edit. Check both areas (time: scheme, date: ghost) show
   their frame, option name and previews, and that every option can be chosen.
   Save each scheme once and check all parts change color, including warning and
   alert colors. Check every ghost level: off must leave no ghost and
   nothing may move. The face must not show a blank screen at any point.
4. Confirm value colors change on the watch, both label and value, at the
   thresholds the browser preview lists (from `COLOR_RULES` and your profile age).
   Compare with the browser `warning` and `alert` samples. The color changes at
   runtime, so watch one change happen, e.g. battery dropping through the warning
   threshold or heart rate rising after exercise, not just a color set at startup.
   Installing must not show a permission prompt for the profile.
5. Check the time against the phone. Time intentionally uses 24-hour HH:MM.
6. Confirm the selector shows the face thumbnail at 10:09.
7. Check that all values fit and stay still: no clipping or scrolling. Use the browser
   stress sample for 23:59, 199 bpm, WED 28.08 and 100% (HRT shows the alert
   color there, as expected); repeat in the simulator if available.
8. Confirm heart rate agrees with the latest reading on the watch. It is the most
   recent measured value, not a new continuous measurement; missing values show --.
9. Leave the screen off for several minutes, then wake it: time must be correct
   immediately. Also open an app, wait past a minute boundary, and return to the
   face. Repeat across an hour change; do not wait for a minute callback to catch up.
10. Custom AOD is not included. Confirm that the normal face appears after
    screen-off/wake cycles. A system AOD style can be used if offered by the watch
    firmware; this package does not supply its own AOD design.
11. Leave the face active across midnight and check date and weekday, or test the
    boundary with simulator time controls. Month and year boundaries need checking too.
12. Review Developer Mode logs for runtime errors. Compare battery use over a normal
    day with your usual face and the same AOD/brightness/heart monitoring settings.

## Test coverage

Build and mock checks can be completed locally. Device rendering,
sensor permission prompts and day-long battery use require the real watch and are
checked separately from the build and HTML preview.

## Artwork and credits

The selector icon is rendered from the face itself by `node tools/make-icon.mjs`
(324 x 324, at 10:09). The edit-mode previews come from
`node tools/make-edit-images.mjs`. Neither is drawn on the active watch face.
Font attribution and the link to the bundled DSEG license
are in `CREDITS.md`.
