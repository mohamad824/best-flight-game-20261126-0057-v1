// main.ts — entry program (Node 22, standard library only).
// Finds the entry directory from this file's own location (never a hardcoded path),
// copies game/ and screenshots/ into the output directory, and writes dossier.json
// with the competition scorer's caps via the vendored make.fun library.
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { buildDossier } from './vendor/makefun-game.ts';

const ENTRY_DIR = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : '/output';

rmSync(OUTPUT_DIR, { recursive: true, force: true });
mkdirSync(OUTPUT_DIR, { recursive: true });

for (const name of ['game', 'screenshots']) {
  const src = join(ENTRY_DIR, name);
  if (!existsSync(src)) throw new Error(`main.ts: missing ${name}/ in ${ENTRY_DIR}`);
  cpSync(src, join(OUTPUT_DIR, name), { recursive: true });
}

const dossier = buildDossier(OUTPUT_DIR, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
console.log(`wrote ${join(OUTPUT_DIR, 'dossier.json')} (${dossier.length} bytes)`);
