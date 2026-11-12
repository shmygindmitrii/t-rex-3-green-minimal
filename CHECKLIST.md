# Green Minimal release checks

Author: Dmitrii Shmygin. Target: Amazfit T-Rex 3, 480 x 480.

## Before installing

- Run `node test/check.mjs` for mock runtime checks of data updates, line centering
  and lifecycle cleanup.
- Run `zeus.cmd build` to check bundling, fonts, images and compilation.
- Run `node preview/server.mjs` and open http://localhost:8080/ to review the layout.
  Its sample controls exercise long values. There must be no "outside round screen"
  warnings.
- The browser preview approximates text rendering; the watch remains the final check.

## On the watch

1. Run `zeus.cmd preview`, scan the new QR code and install Green Minimal.
2. Confirm green time, red heart rate, orange weekday and date, and battery percentage.
3. Check the time against the phone. Time intentionally uses 24-hour HH:MM.
4. Confirm the selected face has the green hollow triangle thumbnail.
5. Check that all values fit and stay still: no clipping or scrolling. Use the browser
   stress sample for 23:59, 199 bpm, WED, 28 AUG and 100%; repeat in the simulator
   if available.
6. Confirm heart rate agrees with the latest reading on the watch. It is the most
   recent measured value, not a new continuous measurement; missing values show --.
7. Leave the screen off for several minutes, then wake it: time must be correct
   immediately. Also open an app, wait past a minute boundary, and return to the
   face. Repeat across an hour change; do not wait for a minute callback to catch up.
8. Custom AOD is not included. Confirm that the normal
   face appears after screen-off/wake cycles. A system AOD style can be used if offered
   by the watch firmware; this package does not supply its own AOD design.
9. Leave the face active across midnight and check date and weekday, or test the
   boundary with simulator time controls. Month and year boundaries need checking too.
10. Review Developer Mode logs for runtime errors. Compare battery use over a normal
    day with your usual face and the same AOD/brightness/heart monitoring settings.

## Test coverage

Build and mock checks can be completed locally. Device rendering,
sensor permission prompts and day-long battery use require the real watch and are
checked separately from the build and HTML preview.

## Artwork and credits

The green hollow triangle (`art/selector-icon.svg`) and the optional heart and battery
icons (`art/heart.svg`, `art/battery.svg`) are original SVG artwork. `node tools/make-icons.cjs`
renders them to PNG: 324 x 324 for the selector and 36 x 36 for the icons. The triangle is
not drawn on the active watch face. Font attribution and the link to the bundled DSEG license
are in `CREDITS.md`.
