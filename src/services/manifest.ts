import type { Manifest } from '../types';

/**
 * Loads public/manifest.json, generated at build time by scripts/generate-manifest.mjs
 * from the contents of public/guidance_docs and public/manual_md.
 */
export async function loadManifest(): Promise<Manifest> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}manifest.json`, { cache: 'no-store' });
    if (!res.ok) return { guidanceFiles: [], manual: [] };
    return (await res.json()) as Manifest;
  } catch {
    return { guidanceFiles: [], manual: [] };
  }
}
