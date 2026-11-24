// Entry program for make.fun's news-image-20261124 bounty.
//
// The repository holds entry.png: one cover-style image summing up the world
// news of Tuesday 24 November 2026 -- one dominant visual (the Banten candy
// factory fire: 24 dead, 30 still missing) plus two supporting stories
// (COP31 collapses with no fossil-fuel deal; Gukesh v Sindarov open the
// World Chess Championship in Geneva). This program copies the image to the
// output directory. Standard library only; no network, no clock, no
// randomness, so two runs always write the same bytes.

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));

/** Fail unless the buffer is a 1024x1024 PNG (signature + IHDR check). */
function verifyPng(buf: Buffer): void {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < 33 || !sig.every((b, i) => buf[i] === b)) {
    process.stderr.write('news image: entry.png is not a PNG file\n');
    process.exit(1);
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width !== 1024 || height !== 1024) {
    process.stderr.write(`news image: entry.png is ${width}x${height}, expected 1024x1024\n`);
    process.exit(1);
  }
  if (buf.length > 1048576) {
    process.stderr.write(`news image: entry.png is ${buf.length} bytes, over the 1 MiB limit\n`);
    process.exit(1);
  }
}

/** Read a --name value from the arguments, or use the fallback. */
function option(name: string, fallback: string): string {
  const at = process.argv.indexOf(`--${name}`);
  if (at >= 0 && at + 1 < process.argv.length) return process.argv[at + 1]!;
  const joined = process.argv.find((a) => a.startsWith(`--${name}=`));
  return joined === undefined ? fallback : joined.slice(name.length + 3);
}

const outDir = option('output', process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const source = join(here, 'entry.png');

if (!existsSync(source)) {
  process.stderr.write('news image: entry.png is missing from the repository\n');
  process.exit(1);
}
verifyPng(readFileSync(source));

mkdirSync(outDir, { recursive: true });
const target = join(outDir, 'entry.png');
copyFileSync(source, target);
// Confirm the copy landed whole: the grader reads exactly these bytes.
if (statSync(target).size !== statSync(source).size) {
  process.stderr.write('news image: entry.png copy is incomplete\n');
  process.exit(1);
}
process.stdout.write(`news image: wrote ${target} (${statSync(target).size} bytes)\n`);
