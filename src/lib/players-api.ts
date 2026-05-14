const API_KEY = "paolodm2026";

interface Env {
  DB: D1Database;
}

interface Player {
  id: string;
  [key: string]: unknown;
}

const ALLOWED_ORIGINS = [
  "https://dimuropaolo.site",
  "https://www.dimuropaolo.site",
  "https://scout-canvas-pro.pages.dev",
];

function corsHeaders(origin?: string | null): Record<string, string> {
  const ao = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": ao,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-dmscout-key",
    "Vary": "Origin",
  };
}

function authed(request: Request): boolean {
  return request.headers.get("x-dmscout-key") === API_KEY;
}

export async function handlePlayersApi(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const parts = url.pathname.replace(/\/+$/, "").split("/");
  const playerId = parts[3] ?? null; // /api/players/:id

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  try {
    if (request.method === "GET" && !playerId) {
      const { results } = await env.DB.prepare(
        "SELECT data FROM players ORDER BY updated_at DESC"
      ).all<{ data: string }>();
      const players = results.map((r) => JSON.parse(r.data));
      return new Response(JSON.stringify(players), { headers: corsHeaders(origin) });
    }

    if (request.method === "POST") {
      if (!authed(request)) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders() });
      const player = (await request.json()) as Player;
      if (!player?.id) return new Response(JSON.stringify({ error: "id required" }), { status: 400, headers: corsHeaders() });
      await env.DB.prepare(
        "INSERT OR REPLACE INTO players (id, data, updated_at) VALUES (?, ?, unixepoch())"
      ).bind(player.id, JSON.stringify(player)).run();
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders(origin) });
    }

    if (request.method === "DELETE" && playerId) {
      if (!authed(request)) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders() });
      await env.DB.prepare("DELETE FROM players WHERE id = ?").bind(playerId).run();
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders(origin) });
    }

    return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: corsHeaders() });
  } catch (e) {
    console.error("players-api error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders() });
  }
}
