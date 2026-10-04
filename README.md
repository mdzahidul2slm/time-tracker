# Time tracker

Color in what you did each half hour of the day, like a paper time chart.
Works on iPhone and iPad, installs to the Home Screen, and runs offline.
Everything is saved on the person's own device. No accounts.

Live app: https://mdzahidul2slm.github.io/time-tracker/

## Files
- `index.html` – the whole app
- `manifest.webmanifest` – Home Screen name, icon and full-screen mode
- `sw.js` – offline support (caches the app after the first visit)
- `icons/` – app icons
- `.nojekyll` – tells GitHub Pages to serve files as-is

## Updating the app
1. Edit `index.html`.
2. In `sw.js`, change `VERSION` (for example `tt-v1` to `tt-v2`).
3. Commit and push. Phones pick up the new version the next time the app is opened online, and show it on the open after that.

People's charts are not affected by updates. They live in each device's storage, not in this repo.
