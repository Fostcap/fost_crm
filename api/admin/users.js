// /api/admin/users.js
// Vercel serverless function — Supabase Admin API
// SECURITY: This endpoint uses the service_role key (bypasses RLS).
// Every request is gated by:
//   1. Valid Supabase JWT in Authorization header
//   2. JWT email must match ADMIN_EMAIL env var

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// Admin client (service_role — bypasses RLS, server-side only)
const supaAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function requireAdmin(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing Bearer token" };
  }
  const token = authHeader.slice(7);

  const { data, error } = await supaAdmin.auth.getUser(token);
  if (error || !data || !data.user) {
    return { ok: false, status: 401, error: "Invalid token" };
  }
  if ((data.user.email || "").toLowerCase() !== (ADMIN_EMAIL || "").toLowerCase()) {
    return { ok: false, status: 403, error: "Not an admin" };
  }
  return { ok: true, user: data.user };
}

export default async function handler(req, res) {
  // CORS — same origin only (Vercel handles this, but be explicit)
  res.setHeader("Content-Type", "application/json");

  // Env var sanity check
  if (!SUPABASE_URL || !SERVICE_KEY || !ADMIN_EMAIL) {
    return res.status(500).json({ error: "Server misconfigured (missing env vars)" });
  }

  // Auth gate
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    if (req.method === "GET") {
      // List users
      const { data, error } = await supaAdmin.auth.admin.listUsers();
      if (error) return res.status(500).json({ error: error.message });
      const users = (data.users || []).map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        banned_until: u.banned_until || null
      }));
      return res.status(200).json({ users });
    }

    if (req.method === "POST") {
      // Create user
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const { email, password } = body;
      if (!email || !password) {
        return res.status(400).json({ error: "email and password required" });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      const { data, error } = await supaAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true
      });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({
        user: { id: data.user.id, email: data.user.email, created_at: data.user.created_at }
      });
    }

    if (req.method === "PATCH") {
      // Reset password
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const { userId, newPassword } = body;
      if (!userId || !newPassword) {
        return res.status(400).json({ error: "userId and newPassword required" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      const { data, error } = await supaAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ user: { id: data.user.id, email: data.user.email } });
    }

    if (req.method === "DELETE") {
      // Soft delete = ban user (revocable)
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const { userId, unban } = body;
      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }
      const { data, error } = await supaAdmin.auth.admin.updateUserById(userId, {
        ban_duration: unban ? "none" : "876000h" // ~100 years = effectively forever, but reversible
      });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({
        user: { id: data.user.id, email: data.user.email, banned_until: data.user.banned_until }
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: (e && e.message) || "Unknown error" });
  }
}
