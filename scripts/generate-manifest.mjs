// Scans public/guidance_docs and public/manual_md and writes public/manifest.json,
// which the front end fetches at runtime to know which bundled documents are
// available as static files (used to build the local vector index).
//
// Run automatically via `npm run build` (see package.json "prebuild" script),
// or manually with `node scripts/generate-manifest.mjs`.

import { readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const PUBLIC = join(ROOT, 'public');

const SKIP = new Set(['.gitkeep', '.DS_Store']);

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => !SKIP.has(f))
    .filter((f) => statSync(join(dir, f)).isFile());
}

function classifyManualFile(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'md' || ext === 'markdown') return 'markdown';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext ?? '')) return 'image';
  return 'other';
}

function buildManualStructure() {
  const manualDir = join(PUBLIC, 'manual_md');
  if (!existsSync(manualDir)) return [];

  const folders = readdirSync(manualDir).filter((f) => statSync(join(manualDir, f)).isDirectory());

  return folders
    .sort()
    .map((folder) => {
      const files = listFiles(join(manualDir, folder)).sort();
      return {
        folder,
        title: folder,
        files: files.map((filename) => ({
          filename,
          path: `manual_md/${folder}/${filename}`,
          type: classifyManualFile(filename),
        })),
      };
    })
    .filter((chapter) => chapter.files.length > 0);
}

const manifest = {
  guidanceFiles: listFiles(join(PUBLIC, 'guidance_docs')).sort(),
  manual: buildManualStructure(),
};

writeFileSync(join(PUBLIC, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log(
  `manifest.json generated: ${manifest.guidanceFiles.length} guidance file(s), ${manifest.manual.length} manual chapter(s).`
);
