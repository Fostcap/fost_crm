import { createClient } from "@supabase/supabase-js";

const isSandbox = typeof window !== "undefined" && typeof window.storage !== "undefined";

const supa = !isSandbox
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
  : null;

const storage = {
  get: async (key, shared) => {
    if (isSandbox) return window.storage.get(key, shared);
    const { data, error } = await supa
      .from("kv_store")
      .select("value")
      .eq("key", key)
      .single();
    if (error || !data) return null;
    return { value: data.value };
  },
  set: async (key, value, shared) => {
    if (isSandbox) return window.storage.set(key, value, shared);
    const { data, error } = await supa
      .from("kv_store")
      .upsert({ key, value, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) return null;
    return { value: data.value };
  },
};

export default storage;
