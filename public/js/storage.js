// storage.js — localStorage CRUD layer + D1 server sync
(function(){
  const KEY = "dmscout_players";
  const AUTH_KEY = "dmscout_auth";
  const MIGRATION_KEY = "dmscout_migrated_v2";
  const TOKEN_KEY = "dmscout_token";

  // IDs of old demo/seed players — purged on first load after deploy
  const DEMO_IDS = [
    "luca-mancini","matteo-russo","giuseppe-de-luca","andrea-bianchi",
    "salvatore-greco","francesco-romano","davide-conti","alessandro-marino",
    "nicola-ferrari","emanuele-vitale","marco-esposito","riccardo-galli"
  ];

  // Writes carry the session token from /api/login; the password is checked only on the server.
  function authHeaders(){
    const h = { "Content-Type": "application/json" };
    const t = sessionStorage.getItem(TOKEN_KEY);
    if(t) h.Authorization = "Bearer " + t;
    return h;
  }
  function checkWrite(r){
    if(r && r.status === 401){ logout(); alert("Sessione scaduta: rientra con la password e salva di nuovo."); }
    return r;
  }

  // Resolve API base: relative when the Worker serves the site directly (workers.dev),
  // absolute when the site is served by Cloudflare Pages (custom domain via CNAME).
  const WORKER_ORIGIN = "https://dimuropaolo.dimuropaolo7.workers.dev";
  function apiUrl(path){
    const h = typeof location !== "undefined" ? location.hostname : "";
    if(h === "dimuropaolo.dimuropaolo7.workers.dev" || h === "dimuropaolo.site") return path;
    return WORKER_ORIGIN + path;
  }

  // ── Migration ─────────────────────────────────────────────────────────────
  function removeDemoPlayers(){
    if(localStorage.getItem(MIGRATION_KEY)) return;
    try{
      const raw = localStorage.getItem(KEY);
      if(raw){
        const all = JSON.parse(raw) || [];
        const cleaned = all.filter(p => !DEMO_IDS.includes(p.id));
        localStorage.setItem(KEY, JSON.stringify(cleaned));
      }
    }catch(e){}
    localStorage.setItem(MIGRATION_KEY, "1");
  }

  // ── Deduplicazione locale ─────────────────────────────────────────────────
  // Rimuove doppioni dal localStorage al caricamento (stessa logica: nome+birth_year)
  function deduplicateLocal(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw) return;
      const all = JSON.parse(raw) || [];
      const seen = new Map();
      const deduped = all.filter(p => {
        const key = `${(p.name||"").trim().toLowerCase()}|${p.birth_year??""}`;
        if(seen.has(key)) return false;
        seen.set(key, true);
        return true;
      });
      if(deduped.length !== all.length){
        localStorage.setItem(KEY, JSON.stringify(deduped));
      }
    }catch(e){}
  }

  // ── localStorage helpers ───────────────────────────────────────────────────
  function seed(){
    if(!localStorage.getItem(KEY)){
      localStorage.setItem(KEY, JSON.stringify([]));
    }
  }

  function _read(){
    try{ return JSON.parse(localStorage.getItem(KEY)) || []; }catch(e){ return []; }
  }

  function getPlayers(){
    removeDemoPlayers();
    deduplicateLocal();
    seed();
    return _read();
  }

  function savePlayers(arr){ localStorage.setItem(KEY, JSON.stringify(arr)); }

  function getPlayer(id){ return getPlayers().find(p => p.id === id) || null; }

  function generateId(name){
    const slug = (name||"").toLowerCase().trim()
      .replace(/[àáâä]/g,"a").replace(/[èéêë]/g,"e").replace(/[ìíîï]/g,"i")
      .replace(/[òóôö]/g,"o").replace(/[ùúûü]/g,"u")
      .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    let id = slug || ("player-"+Date.now());
    let n = 1; const all = getPlayers();
    while(all.some(p=>p.id===id)){ id = slug+"-"+(++n); }
    return id;
  }

  function nextNum(){
    const all = getPlayers();
    const max = all.reduce((m,p)=>Math.max(m, parseInt(p.num)||0), 0);
    return String(max+1).padStart(3,"0");
  }

  // ── Write-through: localStorage first, then server ────────────────────────
  function savePlayer(p){
    const all = getPlayers();
    const idx = all.findIndex(x => x.id === p.id);
    if(idx >= 0) all[idx] = p; else { if(!p.num) p.num = nextNum(); all.push(p); }
    savePlayers(all);
    fetch(apiUrl("/api/players"), { method:"POST", headers:authHeaders(), body:JSON.stringify(p) })
      .then(checkWrite).catch(()=>{});
    return p;
  }

  async function deletePlayer(id){
    const all = getPlayers().filter(p => p.id !== id);
    savePlayers(all);
    try{
      checkWrite(await fetch(apiUrl("/api/players/"+encodeURIComponent(id)), { method:"DELETE", headers:authHeaders() }));
    }catch(e){}
  }

  // ── Server → localStorage sync ────────────────────────────────────────────
  // Merge strategy: server is authoritative, but local-only players (not yet
  // uploaded or present only in localStorage) are pushed up to the server.
  // This prevents an empty D1 database from wiping existing local data.
  function _syncFromServer(){
    fetch(apiUrl("/api/players"))
      .then(r => r.ok ? r.json() : null)
      .then(serverPlayers => {
        if(!Array.isArray(serverPlayers)) return;
        const local = _read();
        const serverIds = new Set(serverPlayers.map(p => p.id));

        // Players that exist locally but not on server → push them up
        // Usa nome (case-insensitive) + birth_year come fallback oltre all'id
        const serverKeys = new Set(serverPlayers.map(p =>
          `${(p.name||"").trim().toLowerCase()}|${p.birth_year??""}`
        ));
        const localOnly = local.filter(p => {
          if(serverIds.has(p.id)) return false;
          const key = `${(p.name||"").trim().toLowerCase()}|${p.birth_year??""}`;
          return !serverKeys.has(key);
        });
        localOnly.forEach(p => {
          fetch(apiUrl("/api/players"), { method:"POST", headers:authHeaders(), body:JSON.stringify(p) })
            .catch(()=>{});
        });

        // Merged list: server data wins for shared IDs, local-only appended
        const merged = [...serverPlayers, ...localOnly];
        const before = localStorage.getItem(KEY);
        const after = JSON.stringify(merged);
        savePlayers(merged);
        if(before !== after){
          document.dispatchEvent(new CustomEvent("dmscout:synced"));
        }
      })
      .catch(()=>{});
  }

  // Deferred so page renders from localStorage first, then updates from server
  setTimeout(_syncFromServer, 0);

  // ── Export / Import ───────────────────────────────────────────────────────
  function exportJSON(){
    const blob = new Blob([JSON.stringify(getPlayers(),null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dmscout-players-"+new Date().toISOString().slice(0,10)+".json";
    a.click(); URL.revokeObjectURL(url);
  }

  function normalize(p){
    p = Object.assign({}, p);
    if(!p.id) p.id = generateId(p.name||"player");
    p.ratings = Object.assign({technical:0,tactical:0,physical:0,mental:0,overall:0}, p.ratings||{});
    p.tags = Array.isArray(p.tags) ? p.tags : [];
    p.position_main = p.position_main || p.position || "—";
    return p;
  }

  function importJSON(file){
    return new Promise((res,rej)=>{
      const reader = new FileReader();
      reader.onload = e => {
        try{
          let data = JSON.parse(e.target.result);
          if(!Array.isArray(data)){
            if(Array.isArray(data.players)) data = data.players;
            else if(Array.isArray(data.data)) data = data.data;
            else if(data && typeof data === "object" && (data.id || data.name)) data = [data];
            else throw new Error("Formato JSON non riconosciuto (atteso array di report)");
          }
          const all = getPlayers();
          let count = 0;
          data.forEach(raw=>{
            const p = normalize(raw);
            // Confronta per id, poi per nome (case-insensitive) + birth_year
            let i = all.findIndex(x=>x.id===p.id);
            if(i<0){
              const key = `${(p.name||"").trim().toLowerCase()}|${p.birth_year??""}`;
              i = all.findIndex(x=>`${(x.name||"").trim().toLowerCase()}|${x.birth_year??""}`===key);
            }
            if(i>=0) all[i]=p; else { if(!p.num) p.num = String(all.length+count+1).padStart(3,"0"); all.push(p); }
            count++;
          });
          savePlayers(all);
          // Sync each imported player to server
          all.forEach(p => fetch(apiUrl("/api/players"), { method:"POST", headers:authHeaders(), body:JSON.stringify(p) }).catch(()=>{}));
          res(count);
        }catch(err){ rej(err); }
      };
      reader.onerror = () => rej(new Error("lettura file fallita"));
      reader.readAsText(file);
    });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  function isAuthed(){
    const t = sessionStorage.getItem(TOKEN_KEY);
    if(!t) return false;
    try{
      const b = t.split(".")[0].replace(/-/g,"+").replace(/_/g,"/");
      return JSON.parse(atob(b)).exp > Date.now()/1000;
    }catch(e){ return false; }
  }
  // Resolves to "ok", "wrong", "blocked" or "error".
  async function tryLogin(pwd){
    try{
      const r = await fetch(apiUrl("/api/login"), { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ password: pwd }) });
      if(r.status === 429) return "blocked";
      if(!r.ok) return r.status === 401 ? "wrong" : "error";
      const d = await r.json();
      sessionStorage.setItem(TOKEN_KEY, d.token); sessionStorage.setItem(AUTH_KEY, "1");
      return "ok";
    }catch(e){ return "error"; }
  }
  const LOGIN_MSG = { wrong:"Password errata.", blocked:"Troppi tentativi: riprova tra 15 minuti.", error:"Server non raggiungibile, riprova." };
  function logout(){ sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(AUTH_KEY); }

  function requireAuth(){
    if(isAuthed()) return;
    document.body.style.overflow = "hidden";
    const overlay = document.createElement("div");
    overlay.className = "lock-overlay";
    overlay.innerHTML = `
      <div class="lock-box">
        <div class="label" style="margin-bottom:.8rem"><span class="dot"></span>// AREA RISERVATA</div>
        <h2>Scout Access</h2>
        <p>Inserisci la password per accedere alla dashboard di scouting.</p>
        <div class="field"><label>Password</label><input type="password" id="lockPwd" autofocus></div>
        <div id="lockErr" style="color:var(--red);font-size:.85rem;margin-bottom:.8rem;display:none">Password errata.</div>
        <button class="btn btn-primary btn-block" id="lockBtn">Entra →</button>
        <div style="margin-top:1rem;text-align:center"><a href="/portfolio.html" style="color:var(--gray);font-size:.85rem">← Torna al portfolio</a></div>
      </div>`;
    document.body.appendChild(overlay);
    const pwd = overlay.querySelector("#lockPwd");
    const btn = overlay.querySelector("#lockBtn");
    const err = overlay.querySelector("#lockErr");
    async function go(){
      btn.disabled = true;
      const res = await tryLogin(pwd.value);
      btn.disabled = false;
      if(res === "ok"){ location.reload(); return; }
      err.textContent = LOGIN_MSG[res]; err.style.display="block"; pwd.value=""; pwd.focus();
    }
    btn.onclick = go;
    pwd.onkeydown = e => { if(e.key==="Enter") go(); };
  }

  async function verifyPassword(pwd){ return (await tryLogin(pwd)) === "ok"; }
  async function promptPassword(action){
    if(isAuthed()) return true;
    const pwd = window.prompt((action||"Azione protetta")+" — inserisci la password:");
    if(pwd==null) return false;
    const res = await tryLogin(pwd);
    if(res !== "ok"){ alert(LOGIN_MSG[res]); return false; }
    return true;
  }

  window.Storage = {
    getPlayers, getPlayer, savePlayer, deletePlayer,
    generateId, nextNum, exportJSON, importJSON,
    isAuthed, tryLogin, logout, requireAuth, verifyPassword, promptPassword
  };
})();
