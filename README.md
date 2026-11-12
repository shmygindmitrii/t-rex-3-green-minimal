# Green Minimal

Minimal watch face for Amazfit T-Rex 3 by **Dmitrii Shmygin**.

- Green 24-hour time in DSEG7 Classic Bold, with DSEG7 numeric readings and DSEG14 weekdays.
- Latest measured heart rate in red; `--` when unavailable.
- Orange English weekday and date in `DD MMM` format, such as `11 NOV`.
- Green battery percentage and a pure black `#000000` background.
- Green hollow triangle selector icon. Optional heart rate and battery icons are
  included but switched off by default.

## Install or update

Requires Node.js and Zeus CLI. Tested with Zeus 1.10.0 / ZPM 3.5.0.

Install the CLI if needed:

```powershell
npm.cmd install -g @zeppos/zeus-cli@1.10.0
```

From the project directory:

```powershell
node test/check.mjs
zeus.cmd preview
```

Sign in with the same Zepp account as the phone. Scan the fresh QR code in the
paired watch's Developer Mode in Zepp, then install and select Green Minimal.
`preview` builds before generating its QR code. `zeus.cmd build` creates a local
ZAB package in `dist/` without generating a QR code.

## Preview and edit

All layout, fonts and colors are in [`watchface/config.js`](watchface/config.js).
The face is a list of horizontal lines:

- Each line is automatically centered on the screen. Move a whole line up or down
  by changing its `y`, which is the line's vertical center. Values are written
  relative to the screen center (`CY`), and `SCREEN.width`, `SCREEN.height` and `CX`
  are available.
- Items in a line are laid out left to right with `gap` pixels between them. Their
  widths are measured from the real font metrics, not hardcoded.
- Change any part's font with its `font:` field (pick from `FONTS`), and its size
  and color the same way.
- `reserve: '000'` gives an item a fixed width, so the line doesn't shift when a
  value gets shorter. `align` places the text inside that width.
- Heart rate and battery icons are image items with `show: false`. Set
  `show: true` to turn them on.

Preview the real face code in a browser:

```powershell
node preview/server.mjs
```

Then open http://localhost:8080/. The page has sample values, including long
values and missing heart rate. `Guides` shows the center lines and widget boxes.
`Show icons` turns on the optional icons. Below the face, each line's width and
position is listed, with a warning when an item goes outside the round screen.
The browser renders text slightly differently, so check final rendering on the
watch.

### Fonts and icons

- **New font:** put the TTF under `assets/480x480-amazfit-t-rex-3/fonts/` and add
  it to `FONTS`. Then run `node tools/font-metrics.cjs`, which regenerates
  `watchface/font-metrics.js` so the new font can be measured.
- **Icons:** the editable sources are SVG files in `art/`, with the color set in
  the SVG. `node tools/make-icons.cjs` renders them to PNG under `assets/` using
  Sharp from the global Zeus install in `%APPDATA%/npm`. The watch draws images at
  their native size, so the `w`/`h` in `config.js` must match the SVG size.

## Compatibility

Designed for Amazfit T-Rex 3 at 480 x 480. Custom always-on display is not included.
See [CHECKLIST.md](CHECKLIST.md) for build and device checks.

Heart rate follows the watch's latest measurement and does not request continuous
measurement. API 3.0 or later is required. Time refreshes on screen wake, return
to the face and minute changes. No phone-side service or network access
is used by the face.

See [CREDITS.md](CREDITS.md) for author and font attribution.

## License

Project code and original artwork are available under the [MIT License](LICENSE).
DSEG7 and DSEG14 are separately licensed under the [SIL Open Font License 1.1](assets/480x480-amazfit-t-rex-3/fonts/fonts-DSEG_v046/DSEG-LICENSE.txt).
The MIT license does not apply to these third-party fonts. Their original copyright
notices and license texts are included with the repository.

Build packages in `dist/` and `release/` are excluded from Git. Distribute them as
release attachments. The font and icon under `assets/` are required source assets
and are included in the repository.
