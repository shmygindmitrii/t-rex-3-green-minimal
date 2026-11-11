# Green Minimal

Minimal watch face for Amazfit T-Rex 3 by **Dmitrii Shmygin**.

- Big green 24-hour time in Bebas Neue.
- Latest measured heart rate in red; `--` when unavailable.
- Orange English weekday and date in `DD.MM` format.
- Green battery percentage and a pure black `#000000` background.
- Green hollow triangle selector icon, with no icons on the active face.

## Install or update

Requires Node.js and Zeus CLI. Tested with Zeus 1.10.0 / ZPM 3.5.0.

Install the CLI if needed:

```powershell
npm.cmd install -g @zeppos/zeus-cli@1.10.0
```

From the project directory:

```powershell
node check.cjs
zeus.cmd preview
```

Sign in with the same Zepp account as the phone. Scan the fresh QR code in the
paired watch's Developer Mode in Zepp, then install and select Green Minimal.
`preview` builds before generating its QR code. `zeus.cmd build` creates a local
ZAB package in `dist/` without generating a QR code.

## Preview and edit

Open `design.html` in a browser. Its dropdown includes long values and missing heart
rate. Browser typography is an approximation; final rendering must be checked on
the watch. The runtime layout and colors are in `watchface/index.js`.

`icon.svg` is the editable icon source. The generated PNG is already included.
`node make-icon.cjs` regenerates it using Sharp from the standard Windows global
Zeus installation under `%APPDATA%/npm`.

## Compatibility

Designed for Amazfit T-Rex 3 at 480 x 480. Custom always-on display is not included.
See [CHECKLIST.md](CHECKLIST.md) for build and device checks.

Heart rate follows the watch's latest measurement and does not request continuous
measurement. API 3.0 or later is required. Time refreshes on screen wake, return
to the face and minute changes. No phone-side service or network access
is used by the face.

See [CREDITS.md](CREDITS.md) for author and font attribution. The bundled Bebas Neue
font retains its SIL Open Font License in `licenses/`.

## License

Project code and original artwork are available under the [MIT License](LICENSE).
Bebas Neue is separately licensed under the [SIL Open Font License 1.1](licenses/BebasNeue-OFL.txt).

Build packages in `dist/` and `release/` are excluded from Git. Distribute them as
release attachments. The font and icon under `assets/` are required source assets
and are included in the repository.
