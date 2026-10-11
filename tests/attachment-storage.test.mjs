import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const alice = '10000000-0000-4000-8000-000000000001';
const bob = '10000000-0000-4000-8000-000000000002';
const businessId = '20000000-0000-4000-8000-000000000001';
const briefingId = '30000000-0000-4000-8000-000000000001';
let db;
const payload = (overrides = {}) => ({ id: randomUUID(), businessId, briefingId, name: 'reference.txt', kind: 'txt',
  mimeType: 'text/plain', size: 100, sha256: 'a'.repeat(64), ...overrides });
async function prepare(p, user = alice) {
  return (await db.query('SELECT public.pilot_prepare_attachment($1,$2::jsonb) AS result', [user, JSON.stringify(p)])).rows[0].result;
}
async function asUser(user, fn) {
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [user]);
  await db.exec('SET ROLE authenticated');
  try { return await fn(); } finally { await db.exec('RESET ROLE'); }
}
before(async () => {
  db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA storage;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE TABLE public.pilot_businesses(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES auth.users(id));
    CREATE TABLE storage.buckets(id text PRIMARY KEY,name text NOT NULL,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text,name text NOT NULL UNIQUE);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    GRANT USAGE ON SCHEMA auth,storage TO authenticated;
    GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated;
  `);
  await db.exec(await readFile(new URL('../supabase/migrations/20260910121000_private_briefing_files.sql', import.meta.url), 'utf8'));
  await db.query('INSERT INTO auth.users VALUES ($1),($2)', [alice, bob]);
});
after(async () => { await db?.close(); });
beforeEach(async () => { await db.exec('TRUNCATE storage.objects,public.pilot_attachments,public.pilot_businesses'); });

test('private attachment budget is per briefing, and a new briefing can retain historical sources', async () => {
  for (let index = 0; index < 5; index++) await prepare(payload());
  await assert.rejects(prepare(payload()), /ATTACHMENT_COUNT_LIMIT/);
  const secondBriefing = await prepare(payload({ briefingId: randomUUID() }));
  assert.equal(secondBriefing.status, 'uploading');
  assert.equal((await db.query('SELECT count(*)::int AS n FROM public.pilot_attachments')).rows[0].n, 6);
});

test('100 MB aggregate and 10 MB image limits are enforced by database', async () => {
  await prepare(payload({ size: 50 * 1024 * 1024 }));
  await prepare(payload({ size: 50 * 1024 * 1024 }));
  await assert.rejects(prepare(payload({ size: 1 })), /ATTACHMENT_TOTAL_LIMIT/);
  await assert.rejects(prepare(payload({ briefingId: randomUUID(), kind: 'image', mimeType: 'image/png', size: 11 * 1024 * 1024 })), /check constraint/);
});

test('prepare is idempotent, cannot cross accounts and cannot change a previously reserved file', async () => {
  const p = payload(); const original = await prepare(p);
  assert.deepEqual(await prepare(p), original);
  await assert.rejects(prepare({ ...p, sha256: 'b'.repeat(64) }), /ATTACHMENT_CONFLICT/);
  await assert.rejects(prepare({ ...p, briefingId: randomUUID() }), /ATTACHMENT_CONFLICT/);
  await assert.rejects(prepare(payload(), bob), /OWNERSHIP/);
  await assert.rejects(asUser(alice, () => prepare(payload())), /permission denied/);
});

test('storage policies permit the owner upload/read, deny another account, and forbid overwriting historical originals', async () => {
  const p = payload(); const prepared = await prepare(p);
  await asUser(alice, () => db.query('INSERT INTO storage.objects(bucket_id,name) VALUES($1,$2)', ['briefing-files', prepared.storagePath]));
  await db.query("UPDATE public.pilot_attachments SET status='detached' WHERE id=$1", [p.id]);
  const owned = await asUser(alice, () => db.query('SELECT name FROM storage.objects'));
  assert.equal(owned.rows.length, 1);
  const hidden = await asUser(bob, () => db.query('SELECT name FROM storage.objects'));
  assert.equal(hidden.rows.length, 0);
  assert.equal((await asUser(bob, () => db.query('SELECT id FROM public.pilot_attachments'))).rows.length, 0);
  assert.equal((await asUser(alice, () => db.query("UPDATE storage.objects SET name='overwritten' RETURNING name"))).rows.length, 0);
  assert.equal((await db.query('SELECT name FROM storage.objects')).rows[0].name, prepared.storagePath);
  await assert.rejects(asUser(bob, () => db.query('INSERT INTO storage.objects(bucket_id,name) VALUES($1,$2)', ['briefing-files', `${bob}/${businessId}/${randomUUID()}`])), /row-level security/);
});

test('detaching a source releases its draft slot without deleting the original manifest', async () => {
  const first = payload(); await prepare(first);
  for (let index = 0; index < 4; index++) await prepare(payload());
  await db.query("UPDATE public.pilot_attachments SET status='detached' WHERE id=$1", [first.id]);
  await prepare(payload());
  assert.equal((await db.query('SELECT count(*)::int AS n FROM public.pilot_attachments')).rows[0].n, 6);
  assert.equal((await db.query('SELECT status FROM public.pilot_attachments WHERE id=$1', [first.id])).rows[0].status, 'detached');
});
