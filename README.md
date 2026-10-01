# Dots & Boxes

A simple local multiplayer Dots & Boxes game. Plain HTML, CSS and JavaScript — no build step or dependencies.

## Play

Open `index.html` in a browser.

- Hover between two dots to preview a line in your color; click to draw it.
- Close a box and it fills with your color — you go again. Otherwise the turn passes.
- When every line is drawn, the player with the most boxes wins.

The sidebar lists the players (Red and Blue by default) with live scores. You can rename players, change their colors, add up to six, and pick a grid size from 3×3 to 8×8 dots.

## Project layout

- `index.html`, `styles.css` — page and styling
- `src/game.js` — game rules (no DOM; shared by the page and the tests)
- `src/main.js` — SVG board rendering and UI
- `src/confetti.js` — end-of-game confetti
- `icons/` — favicon and iOS Home Screen icon (`.svg` sources; the `.png` files are rendered from them at 32×32 and 180×180)
- `tests/` — unit tests for the rules

## Publish

The site is static and uses only relative paths, so it works on GitHub Pages as-is. In the repository's **Settings → Pages**, choose **Deploy from a branch**, then select `main` and `/ (root)`. The empty `.nojekyll` file tells Pages to serve the files as-is without running Jekyll.

On iPhone or iPad, open the published site in Safari and choose **Share → Add to Home Screen** to get the icon.

## Test

```sh
npm test
```

Requires Node 18+.
