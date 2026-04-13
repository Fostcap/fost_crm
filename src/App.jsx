/**
 * Storage + Auth abstraction for Fost CRM.
 *
 * Claude sandbox  → window.storage (no auth)
 * Vercel/browser  → Supabase (with auth)
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
    console.warn("[storage] Supabase credentials missing");
    return null;
  }
  _sb = createClient(url, key);
  return _sb;
}

// ── Auth ────────────────────────────────────────────────
const auth = {
  async signIn(email, password) {
    const sb = getSupabase();
    if (!sb) return { error: { message: "Supabase not configured" } };
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    return { data, error };
  },

  async signOut() {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
  },

  async getUser() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getUser();
    return data?.user || null;
  },

  async getSession() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data?.session || null;
  },

  onAuthStateChange(callback) {
    const sb = getSupabase();
    if (!sb) return { data: { subscription: { unsubscribe: function(){} } } };
    return sb.auth.onAuthStateChange(callback);
  }
};

// ── Storage ─────────────────────────────────────────────
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

export { auth };
export default storage;
