// Worker "dimuropaolo": serves public/ as static assets and the players API.
// Writes need a session token from POST /api/login; the password lives only in
// the ADMIN_PASSWORD secret, the token is signed with SESSION_SECRET.

const ALLOWED_ORIGINS = [
  "https://dimuropaolo.site",
  "https://www.dimuropaolo.site",
  "https://scout-canvas-pro.pages.dev",
];
const SESSION_TTL = 12 * 3600;          // seconds
const MAX_FAILS = 5, FAIL_WINDOW = 900; // 5 wrong passwords per IP every 15 min
const MAX_BODY = 3_000_000;             // reports carry base64 photos

const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

function cors(origin) {
  const h = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}
const json = (data, status, origin) => new Response(JSON.stringify(data), { status, headers: cors(origin) });

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", key, enc.encode(data));
}
// constant-time comparison: compare HMACs of both values
async function safeEqual(secret, a, b) {
  const [x, y] = await Promise.all([hmac(secret, a), hmac(secret, b)]);
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let d = 0; for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i];
  return d === 0;
}

async function makeToken(env) {
  const payload = b64u(enc.encode(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL })));
  return payload + "." + b64u(await hmac(env.SESSION_SECRET, payload));
}
async function validToken(env, request) {
  const m = (request.headers.get("Authorization") || "").match(/^Bearer ([\w-]+)\.([\w-]+)$/);
  if (!m) return false;
  if (!(await safeEqual(env.SESSION_SECRET, b64u(await hmac(env.SESSION_SECRET, m[1])), m[2]))) return false;
  try { return JSON.parse(new TextDecoder().decode(fromB64u(m[1]))).exp > Date.now() / 1000; } catch { return false; }
}

async function tooManyFails(env, ip) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS login_fails (ip TEXT PRIMARY KEY, n INTEGER, first INTEGER)").run();
  const row = await env.DB.prepare("SELECT n, first FROM login_fails WHERE ip = ?").bind(ip).first();
  return !!row && row.n >= MAX_FAILS && Date.now() / 1000 - row.first < FAIL_WINDOW;
}
async function recordFail(env, ip) {
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    `INSERT INTO login_fails (ip, n, first) VALUES (?1, 1, ?2)
     ON CONFLICT(ip) DO UPDATE SET n = CASE WHEN ?2 - first > ${FAIL_WINDOW} THEN 1 ELSE n + 1 END,
                                   first = CASE WHEN ?2 - first > ${FAIL_WINDOW} THEN ?2 ELSE first END`
  ).bind(ip, now).run();
}

async function readJson(request) {
  const len = Number(request.headers.get("content-length") || 0);
  if (len > MAX_BODY) throw Object.assign(new Error("too large"), { status: 413 });
  const text = await request.text();
  if (text.length > MAX_BODY) throw Object.assign(new Error("too large"), { status: 413 });
  return JSON.parse(text);
}

async function api(request, env, url) {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json({ error: "server not configured" }, 500, origin);

  if (url.pathname === "/api/login" && request.method === "POST") {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (await tooManyFails(env, ip)) return json({ error: "too many attempts" }, 429, origin);
    let body; try { body = await readJson(request); } catch { return json({ error: "bad request" }, 400, origin); }
    const pwd = typeof body?.password === "string" ? body.password : "";
    if (!pwd || !(await safeEqual(env.SESSION_SECRET, pwd, env.ADMIN_PASSWORD))) {
      await recordFail(env, ip);
      return json({ error: "wrong password" }, 401, origin);
    }
    await env.DB.prepare("DELETE FROM login_fails WHERE ip = ?").bind(ip).run();
    return json({ token: await makeToken(env), ttl: SESSION_TTL }, 200, origin);
  }

  const parts = url.pathname.replace(/\/+$/, "").split("/");
  if (parts[2] !== "players" || parts.length > 4) return json({ error: "not found" }, 404, origin);
  const playerId = parts[3] ? decodeURIComponent(parts[3]) : null;

  if (request.method === "GET" && !playerId) {
    const { results } = await env.DB.prepare("SELECT data FROM players ORDER BY updated_at DESC").all();
    return json(results.map((r) => JSON.parse(r.data)), 200, origin);
  }

  if (request.method !== "POST" && request.method !== "DELETE") return json({ error: "method not allowed" }, 405, origin);
  if (!(await validToken(env, request))) return json({ error: "unauthorized" }, 401, origin);

  if (request.method === "POST" && !playerId) {
    let p; try { p = await readJson(request); } catch (e) { return json({ error: e.status === 413 ? "too large" : "bad json" }, e.status || 400, origin); }
    if (!p || typeof p !== "object" || Array.isArray(p) || typeof p.id !== "string" || !p.id || p.id.length > 120)
      return json({ error: "invalid player" }, 400, origin);
    await env.DB.prepare("INSERT OR REPLACE INTO players (id, data, updated_at) VALUES (?, ?, unixepoch())")
      .bind(p.id, JSON.stringify(p)).run();
    return json({ ok: true }, 200, origin);
  }
  if (request.method === "DELETE" && playerId) {
    await env.DB.prepare("DELETE FROM players WHERE id = ?").bind(playerId).run();
    return json({ ok: true }, 200, origin);
  }
  return json({ error: "not found" }, 404, origin);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try { return await api(request, env, url); }
      catch (e) { console.error("api error", e); return json({ error: "server error" }, 500, request.headers.get("Origin")); }
    }
    return env.ASSETS.fetch(request);
  },
};
