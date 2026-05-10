import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT = `Sei un assistente esperto per scout calcistici. Analizza il testo del rapporto di osservazione e RESTITUISCI ESCLUSIVAMENTE UN OGGETTO JSON VALIDO (nessun testo prima/dopo, nessun blocco markdown). Compila TUTTI i campi: se un dato non è esplicito, deduci un valore plausibile e coerente con il livello del giocatore descritto.

SCHEMA OBBLIGATORIO:
{
  "name": string,
  "age": number,
  "birth_year": number,
  "nationality": string (default "Italia"),
  "flag": string emoji bandiera (default "🇮🇹"),
  "club": string,
  "league": string,
  "region": string (una di: Abruzzo,Basilicata,Calabria,Campania,Emilia-Romagna,Friuli-Venezia Giulia,Lazio,Liguria,Lombardia,Marche,Molise,Piemonte,Puglia,Sardegna,Sicilia,Toscana,Trentino-Alto Adige,Umbria,Valle d'Aosta,Veneto,Estero),
  "lat": number, "lng": number (coordinate del club, plausibili),
  "position_main": string (una di: "Portiere","Difensore Centrale","Terzino Sinistro","Terzino Destro","Mediano","Mezzala","Trequartista","Ala Sinistra","Ala Destra","Prima Punta","Seconda Punta"),
  "position_code": string (GK|CB|LB|RB|CDM|CM|CAM|LW|RW|ST|CF),
  "position_secondary": array di stringhe,
  "foot": "Destro"|"Sinistro"|"Entrambi",
  "height": number cm, "weight": number kg,
  "tactical_roles": array di 2-3 oggetti {formation, role, role_code, fit_score:0-100},
  "ratings": {technical, tactical, physical, mental, overall} 0-10 (overall = 0.25*tech+0.30*tac+0.20*phy+0.25*men),
  "skills": {ball_control, passing, dribbling, finishing, defensive_work, tactical_iq, decision_making, aerial, pace, stamina} 0-100 interi,
  "stars": {technique, athleticism, mentality, potential, market_value} 1-5 interi,
  "market": {value_min, value_max, potential, risk, timeline, ready_level},
  "tags": array da ["Talento","Prospetto","U19","U21","Nazionale","Sleeper","Veloce","Tecnico","Fisico","Leader","Bandiera","Mancino","Versatile","Esperienza"],
  "verdict_type": "buy"|"monitor"|"pass",
  "verdict": string (2-4 frasi),
  "observation_type": "Video"|"Dal vivo"|"Video + Dal vivo",
  "observation_count": number, "date": string YYYY-MM-DD,
  "strengths": array 3-6 stringhe, "weaknesses": array 2-5 stringhe,
  "summary": string 4-8 frasi
}
REGOLE: JSON valido parsabile da JSON.parse, nessun campo nullo, coerenza interna, italiano professionale.`;

export const Route = createFileRoute("/api/generate-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { text, name, club } = (await request.json()) as {
            text: string;
            name?: string;
            club?: string;
          };
          if (!text || typeof text !== "string") {
            return Response.json({ error: "text richiesto" }, { status: 400 });
          }
          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return Response.json({ error: "LOVABLE_API_KEY non configurata" }, { status: 500 });
          }
          const userMsg = `${name ? "Nome (suggerito): " + name + "\n" : ""}${club ? "Club (suggerito): " + club + "\n" : ""}\nTESTO OSSERVAZIONI / REPORT:\n${text}\n\nCompila il JSON completo.`;
          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userMsg },
              ],
            }),
          });
          if (!res.ok) {
            const t = await res.text();
            return Response.json({ error: `AI ${res.status}: ${t.slice(0, 300)}` }, { status: 500 });
          }
          const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
          let content = data.choices?.[0]?.message?.content || "";
          content = content.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
          const start = content.indexOf("{");
          const end = content.lastIndexOf("}");
          if (start >= 0 && end > start) content = content.slice(start, end + 1);
          let parsed: unknown;
          try {
            parsed = JSON.parse(content);
          } catch {
            return Response.json({ error: "Risposta AI non parsabile", raw: content }, { status: 500 });
          }
          return Response.json({ report: parsed });
        } catch (e) {
          return Response.json({ error: (e as Error).message }, { status: 500 });
        }
      },
    },
  },
});
