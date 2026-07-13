#!/usr/bin/env node
/*
 * build-manifest.mjs — scaffold the cards/*.json manifests from the images in cards/.
 *
 * Usage (from the project root):
 *     node tools/build-manifest.mjs                 -> auto-route each image by year
 *     node tools/build-manifest.mjs cards2028.json   -> force all NEW images into one file
 *
 * AUTO-ROUTING (no argument): each image is filed into a manifest named after the year
 * in its filename — "2028 S1 Whoever.jpg" goes to cards2028.json, "1998 Griffey.png"
 * goes to cards1998.json (any 19xx / 20xx year). The file is created if it doesn't
 * exist yet. Images with no year in the name go to the default cards.json. A card
 * that's already cataloged in some manifest STAYS in that file (it's never moved),
 * and any metadata you've filled in is preserved on re-runs.
 *
 * The app reads cards/index.json (the list of manifest files), which this script
 * regenerates every run — a static host like GitHub Pages can't list a folder itself.
 *
 * Filename conventions (all case-insensitive):
 *     2028 s1 julio.png        -> front of a card (routed to cards2028.json)
 *     2028 s1 julio-back.png   -> back image for that same card
 *     2028 s1 julio-mask.png   -> foil mask for that same card
 *
 * Supported image types: .png .jpg .jpeg .webp .gif
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CARDS_DIR = join(ROOT, 'cards');
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const MANIFEST_RE = /^cards[^.]*\.json$/i;   // cards.json, cards2027.json, cards-vintage.json, ...

// Optional override: force every NEW image into this one file instead of auto-routing.
const forced = process.argv[2] || null;
if (forced && !MANIFEST_RE.test(forced)){
  console.error(`Manifest filename must look like "cards<something>.json" (e.g. cards2028.json), got "${forced}".`);
  process.exit(1);
}

function titleCase(base){
  return base.replace(/[-_]+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
}
// The manifest an image belongs in: cardsYYYY.json from a 19xx/20xx year in the name,
// else the default cards.json.
function manifestFor(stem){
  const m = stem.match(/\b(19|20)\d{2}\b/);
  return m ? `cards${m[0]}.json` : 'cards.json';
}

if (!existsSync(CARDS_DIR)){
  console.error(`No cards/ folder found at ${CARDS_DIR}. Create it and add images first.`);
  process.exit(1);
}

// Load every existing manifest so we know where each front image is already cataloged
// (a card is never moved between files) and can preserve its metadata.
const existingFiles = readdirSync(CARDS_DIR).filter(f => MANIFEST_RE.test(f) && f.toLowerCase() !== 'index.json');
const priorByFront = new Map();  // front(lowercase) -> { file, card }
for (const name of existingFiles){
  let data;
  try { data = JSON.parse(readFileSync(join(CARDS_DIR, name), 'utf8')); }
  catch (e){
    console.error(`${name} exists but is not valid JSON — fix or delete it first.\n  ${e.message}`);
    process.exit(1);
  }
  for (const c of (Array.isArray(data) ? data : (data.cards || [])))
    if (c && c.front) priorByFront.set(c.front.toLowerCase(), { file: name, card: c });
}

// Group image files by base name, splitting out -back / -mask variants.
const files = readdirSync(CARDS_DIR).filter(f => IMAGE_EXTS.has(extname(f).toLowerCase()));
const groups = new Map(); // baseKey -> { front, back, mask }
for (const file of files){
  const stem = basename(file, extname(file));
  const lower = stem.toLowerCase();
  let role = 'front', key = stem;
  if (lower.endsWith('-back') || lower.endsWith('-mask')){
    role = lower.endsWith('-back') ? 'back' : 'mask';
    key = stem.slice(0, -5);
  }
  const g = groups.get(key.toLowerCase()) || { key, front: null, back: null, mask: null };
  g[role] = file;
  if (role === 'front') g.key = key; // prefer the front's casing for the name
  groups.set(key.toLowerCase(), g);
}

// Rewrite every existing manifest (start them empty so cards whose images were deleted
// drop out), then route each on-disk image into the right file.
const targets = new Map();               // filename -> array of cards
for (const name of existingFiles) targets.set(name, []);
const push = (name, card) => { if (!targets.has(name)) targets.set(name, []); targets.get(name).push(card); };

let added = 0;
const newFiles = new Set();
for (const g of [...groups.values()].sort((a, b) => a.key.localeCompare(b.key))){
  if (!g.front){
    console.warn(`  ⚠  Skipping "${g.key}" — has a -back/-mask but no front image.`);
    continue;
  }
  const prior = priorByFront.get(g.front.toLowerCase());
  if (prior){
    // Already cataloged — keep it in its current file, refresh linked back/mask.
    push(prior.file, { ...prior.card, front: g.front, back: g.back || prior.card.back || null, mask: g.mask || prior.card.mask || null });
  } else {
    // New image: forced file if given, else auto-route by year in the filename.
    const dest = forced || manifestFor(g.key);
    if (!existingFiles.includes(dest) && !targets.has(dest)) newFiles.add(dest);
    added++;
    push(dest, {
      id: 'card-' + g.key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      cardName: titleCase(g.key),
      year: (g.key.match(/\b(19|20)\d{2}\b/) || [''])[0], cardNumber: '', series: '',
      cardSet: '', brand: '', type: '', team: '', category: '', position: '',
      rookie: false, additional: '',
      batterStats: '', pitcherStats: '', showBatter: false, showPitcher: false,
      coating: 'matte', pattern: 'crackle', foilOpacity: 0.85, bezel: 16,
      front: g.front, back: g.back || null, mask: g.mask || null,
    });
  }
}

// Write each manifest, then regenerate index.json.
let totalCards = 0;
for (const [name, cards] of [...targets].sort((a, b) => a[0].localeCompare(b[0]))){
  cards.sort((a, b) => (a.front || '').localeCompare(b.front || ''));
  writeFileSync(join(CARDS_DIR, name), JSON.stringify({ app: 'vitrine', version: 1, cards }, null, 2) + '\n');
  totalCards += cards.length;
  const tag = newFiles.has(name) ? '  (new)' : '';
  console.log(`  ${name}: ${cards.length} card(s)${tag}`);
}

const allManifests = readdirSync(CARDS_DIR).filter(f => MANIFEST_RE.test(f) && f.toLowerCase() !== 'index.json').sort();
writeFileSync(join(CARDS_DIR, 'index.json'), JSON.stringify(allManifests, null, 2) + '\n');

console.log(`✓ ${totalCards} card(s) across ${targets.size} manifest(s); ${added} new.`);
if (newFiles.size) console.log(`✓ Created ${[...newFiles].join(', ')}`);
console.log(`✓ index.json lists ${allManifests.length}: ${allManifests.join(', ')}`);
if (added) console.log(`  Fill in team / year details for the new cards in their manifest file(s).`);
