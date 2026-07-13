# Vitrine — Card Collection

A 3D baseball-card viewer and collection browser. The whole viewer is one file,
`index.html`; the cards themselves live as image files in the `cards/` folder
plus one or more manifest files (`cards.json`, `cards2027.json`, `cards2028.json`, ...).

```
Vitrine/
├── index.html            the app (open this)
├── cards/
│   ├── index.json        auto-generated: which manifest files exist
│   ├── cards2027.json     manifest for the 2027 cards
│   ├── cards2028.json     manifest for the 2028 cards (once you add some)
│   ├── original-card.png
│   └── 2027 S1 AntVol.jpg ...your card images
└── tools/
    └── build-manifest.mjs  helper for the "drop images in a folder" workflow
```

### Manifests split by year — automatic
Cards are organized into one manifest file per year, and **the generator sorts them for
you based on the filename**. Drop an image whose name contains a year (any `19xx` or
`20xx`) into `cards/` and run the generator with no arguments:
```
node tools/build-manifest.mjs
```
- `2028 S1 Whoever.jpg` → filed into `cards2028.json` (created automatically if new)
- `1998 Griffey.png`    → filed into `cards1998.json`
- a name with no year   → filed into the default `cards.json`

A card already listed in a manifest **stays in that file** (it's never moved), and any
details you've filled in are preserved on re-runs. The app reads `cards/index.json` —
the list of manifest files, which the generator regenerates every run — and merges them
all into one collection.

> Want to force everything into a specific file regardless of year? Pass it explicitly:
> `node tools/build-manifest.mjs cards-inserts.json`.

## Running it

Because the app reads the `cards/` folder over the network, it must be **served over
http** — double-clicking `index.html` directly (`file://`) won't let it load the
folder, and you'll only see cards saved locally in that browser, not the ones on disk.
(The app detects this and shows a banner if it happens.)

**On Windows: double-click `Start Vitrine.bat`.** It starts a local server (needs
Python, which it will tell you if missing) and opens the app in your default browser.
Keep the console window it opens alongside it running while you use the app; closing
it stops the server.

To start it manually instead (any OS), from this folder:
```
python -m http.server 8123
```
then open <http://localhost:8123/>. (Any static server works.)

On your phone: publish to GitHub Pages (below) and open the URL there.

## Adding cards — two ways

### A. Drop images in the folder, then generate the manifest
1. Put image files into `cards/`. Filename conventions (case-insensitive):
   - `julio-rodriguez.png` → the **front** of a card named "Julio Rodriguez"
   - `julio-rodriguez-back.png` → its **back** image (optional)
   - `julio-rodriguez-mask.png` → a grayscale **foil mask** (optional)
   Supported types: `.png .jpg .jpeg .webp .gif`
2. Run the generator (needs Node.js), naming a manifest if you want to split by group:
   ```
   node tools/build-manifest.mjs                  (writes cards.json)
   node tools/build-manifest.mjs cards2028.json    (writes cards2028.json)
   ```
   It adds an entry for each new image and **keeps details you've already filled in**.
3. Open the manifest it printed and fill in team / year / brand / etc. for the new cards.

### B. Build cards in the app, then "Pack"
1. Open the app, hit **New**, upload art, fill in the details, choose a foil style.
   Click **Save** — it's stored locally in your browser.
2. When you're ready to publish, click **Pack**. It downloads `vitrine-cards.zip`
   containing a complete `cards/` folder (all images + a fresh `cards.json`).
3. Unzip it into this project folder (overwriting `cards/`), then commit.

You can mix both: locally-saved cards and folder cards show up together, and **Pack**
bundles everything into one publishable folder.

> **Note:** Pack always consolidates everything into a single `cards.json` — it
> doesn't know which year-specific manifest a card "belongs" in. If you're using split
> manifests (option A), treat Pack as an occasional full-collection export rather than
> your everyday workflow, or re-split the packed `cards.json` back out afterward.

> Cards you add in the app (option B) live in that browser only until you Pack them.
> Cards in `cards/cards.json` (option A) are the published set everyone sees.

## Publishing to GitHub Pages
1. Create a repo and push this folder to it.
2. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a
   branch**, pick your branch and `/ (root)`, save.
3. Your site appears at `https://<you>.github.io/<repo>/` (the app is `index.html`,
   so no filename is needed in the URL).

The included `.nojekyll` file tells GitHub Pages to serve the folder as-is.
