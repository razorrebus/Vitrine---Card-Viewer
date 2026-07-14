# Vitrine — Card Collection

A 3D baseball-card viewer and collection browser. The whole viewer is one file,
`index.html`; the cards themselves live as image files in the `cards/` folder
plus one or more manifest files (`cards.json`, `cards2027.json`, ...).

```
Vitrine/
├── index.html            the app (open this)
└── cards/
    ├── index.json        lists which manifest files exist
    ├── cards.json         a manifest: card details + which image each card uses
    ├── cards2027.json     (optional) more manifests, all merged together
    └── 2027 S1 AntVol.jpg ...your card images
```

The app reads `cards/index.json` (the list of manifest files), loads every manifest it
names, and merges them into one collection — so you can split cards across several files
or keep everything in a single `cards.json`, whichever you prefer.

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

## Adding cards
1. Open the app, hit **New**, upload the artwork, fill in the details, and choose a
   finish. Click **Save** — the card is stored locally in your browser.
2. When you're ready to publish, click **Pack**. It downloads `vitrine-cards.zip`
   containing a complete `cards/` folder (all images + a fresh `cards.json`).
3. Unzip it into this project folder (overwriting `cards/`), then commit and push.

> Cards you add in the app live in that browser until you Pack them. The files in
> `cards/` (images + manifests) are the published set everyone sees.
>
> Pack consolidates everything into a single `cards.json`. If you keep separate per-year
> manifests, treat Pack as a full-collection export — the app still loads any extra
> `cards*.json` alongside it and de-duplicates by card id.

## Publishing to GitHub Pages
1. Create a repo and push this folder to it.
2. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a
   branch**, pick your branch and `/ (root)`, save.
3. Your site appears at `https://<you>.github.io/<repo>/` (the app is `index.html`,
   so no filename is needed in the URL).

The included `.nojekyll` file tells GitHub Pages to serve the folder as-is.
