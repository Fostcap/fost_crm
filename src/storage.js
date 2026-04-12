/**
 * Storage abstraction for Fost CRM.
 *
 * Claude sandbox  → window.storage (proprietary API)
 * Vercel/browser  → Supabase (PostgreSQL)
 *
 * SETUP (Supabase):
 *   1. Create project at https://supabase.com (free)
 *   2. Run this SQL in Supabase SQL Editor:
 *
 *      create table if not exists kv_store (
 *        key   text primary key,
 *        value text not null,
 *        updated_at timestamptz default now()
 *      );
 *      alter table kv_store enable row level security;
 *      create policy "allow all" on kv_store for all using (true) with check (true);
 *
 *   3. Copy project URL + anon key into .env
 */

import { createClient } from "@supabase/supabase-js";

const isClaudeSandbox =
  typeof window !== "undefined" &&
  typeof window.storage === "object" &&
  typeof window.storage.get === "function";

let _sb = null;

function getSupabase() {
  if (_sb) return _sb;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[storage] Supabase credentials missing — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env");
    return null;
  }
  _sb = createClient(url, key);
  return _sb;
}

async function supaGet(key) {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from("kv_store").select("value").eq("key", key).maybeSingle();
  if (error) { console.error("[storage.get]", error); return null; }
  if (!data) return null;
  return { key, value: data.value, shared: true };
}

async function supaSet(key, value) {
  const sb = getSupabase();
  if (!sb) return null;
  const { error } = await sb.from("kv_store").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) { console.error("[storage.set]", error); return null; }
  return { key, value, shared: true };
}

const storage = {
  async get(key, _shared) {
    if (isClaudeSandbox) return window.storage.get(key, _shared);
    return supaGet(key);
  },
  async set(key, value, _shared) {
    if (isClaudeSandbox) return window.storage.set(key, value, _shared);
    return supaSet(key, value);
  },
};

export default storage;
