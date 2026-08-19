import type { Manifest } from '../types';

/**
 * Loads public/manifest.json, generated at build time by scripts/generate-manifest.mjs
 * from the contents of public/instruction_files, public/sub_instruction_files, and public/manual_md.
 * If the file doesn't exist (e.g. no bundled docs), returns an empty manifest.
 */
export async function loadManifest(): Promise<Manifest> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}manifest.json`, { cache: 'no-store' });
    if (!res.ok) return { instructionFiles: [], subInstructionFiles: [], manual: [] };
    return (await res.json()) as Manifest;
  } catch {
    return { instructionFiles: [], subInstructionFiles: [], manual: [] };
  }
}
