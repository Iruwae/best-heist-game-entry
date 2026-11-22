// GILDED HOUR — the hand-in program.
// Copies game/ and screenshots/ from this repository into the output
// directory, then writes the dossier buildDossier builds from them.
// Runs on Node 22 with the standard library only; no network, no install.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root is the directory holding this file.
const repoRoot = dirname(fileURLToPath(import.meta.url));

// The grader hands us /output; outside it, MAKEFUN_OUTPUT_DIR stands in.
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The dossier caps this bounty grades by.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
};

/** Replace one output path with a fresh copy of a repository path. */
function replaceCopy(from, to) {
  if (existsSync(to)) rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');
if (!existsSync(gameDir)) throw new Error('game/: no such directory in this repository');
if (!existsSync(shotsDir)) throw new Error('screenshots/: no such directory in this repository');
replaceCopy(gameDir, join(outDir, 'game'));
replaceCopy(shotsDir, join(outDir, 'screenshots'));

const dossier = buildDossier(outDir, DOSSIER_CAPS);
writeFileSync(join(outDir, 'dossier.json'), dossier);
