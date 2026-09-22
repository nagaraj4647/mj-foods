// Uploads the bundled sample product images to the Supabase `product-images`
// bucket and rewrites products.image_url with this project's real public URLs.
//
// Usage:
//   1. Fill backend/.env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
//   2. Run migration 001 and supabase/seed.sql first (seed creates the rows).
//   3. From the repo root: node scripts/upload-sample-images.mjs
//
// Uses only the Supabase REST/Storage APIs - no extra dependencies.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  (await readFile(path.join(root, 'backend/.env'), 'utf8'))
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; })
);
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}
const base = SUPABASE_URL.replace(/\/$/, '');
const headers = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` };
const bucket = 'product-images';

const data = JSON.parse(await readFile(path.join(root, 'supabase/sample-data/products.json'), 'utf8'));
let done = 0, skipped = 0;
for (const p of data.products) {
  if (!p.image_file) { console.log(`SKIP  ${p.slug} (no bundled image)`); skipped++; continue; }
  const ext = p.image_file.endsWith('.png') ? 'png' : 'jpeg';
  const file = await readFile(path.join(root, 'supabase/sample-data/images', p.image_file));
  const up = await fetch(`${base}/storage/v1/object/${bucket}/${p.image_file}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': `image/${ext}`, 'x-upsert': 'true' },
    body: file,
  });
  if (!up.ok) { console.error(`FAIL  ${p.slug}: ${up.status} ${await up.text()}`); process.exitCode = 1; continue; }
  const publicUrl = `${base}/storage/v1/object/public/${bucket}/${p.image_file}`;
  const patch = await fetch(`${base}/rest/v1/products?slug=eq.${encodeURIComponent(p.slug)}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ image_url: publicUrl }),
  });
  if (!patch.ok) { console.error(`FAIL  ${p.slug} image_url update: ${patch.status} ${await patch.text()}`); process.exitCode = 1; continue; }
  done++;
  console.log(`OK    ${p.slug} -> ${publicUrl}`);
}
console.log(`\nUploaded and linked ${done} images (${skipped} skipped).`);
