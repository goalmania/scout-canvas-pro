// storage.js — localStorage CRUD layer
(function(){
  const KEY = "dmscout_players";
  const AUTH_KEY = "dmscout_auth";
  const PASSWORD = "paolodm2026"; // hardcoded password gate

  function seed(){
    if(!localStorage.getItem(KEY)){
      localStorage.setItem(KEY, JSON.stringify(window.SEED_PLAYERS || []));
    }
  }

  function getPlayers(){
    seed();
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch(e){ return []; }
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
  function savePlayer(p){
    const all = getPlayers();
    const idx = all.findIndex(x => x.id === p.id);
    if(idx >= 0) all[idx] = p; else { if(!p.num) p.num = nextNum(); all.push(p); }
    savePlayers(all);
    return p;
  }
  function deletePlayer(id){
    const all = getPlayers().filter(p => p.id !== id);
    savePlayers(all);
  }
  function exportJSON(){
    const blob = new Blob([JSON.stringify(getPlayers(),null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dmscout-players-"+new Date().toISOString().slice(0,10)+".json";
    a.click(); URL.revokeObjectURL(url);
  }
  function importJSON(file){
    return new Promise((res,rej)=>{
      const reader = new FileReader();
      reader.onload = e => {
        try{
          const arr = JSON.parse(e.target.result);
          if(!Array.isArray(arr)) throw new Error("invalid");
          const all = getPlayers();
          arr.forEach(p=>{
            const i = all.findIndex(x=>x.id===p.id);
            if(i>=0) all[i]=p; else all.push(p);
          });
          savePlayers(all); res(arr.length);
        }catch(err){ rej(err); }
      };
      reader.onerror = rej;
      reader.readAsText(file);
    });
  }

  // Auth
  function isAuthed(){ return sessionStorage.getItem(AUTH_KEY) === "1"; }
  function tryLogin(pwd){
    if(pwd === PASSWORD){ sessionStorage.setItem(AUTH_KEY,"1"); return true; }
    return false;
  }
  function logout(){ sessionStorage.removeItem(AUTH_KEY); }

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
    function go(){
      if(tryLogin(pwd.value)){ overlay.remove(); document.body.style.overflow=""; }
      else { err.style.display="block"; pwd.value=""; pwd.focus(); }
    }
    btn.onclick = go;
    pwd.onkeydown = e => { if(e.key==="Enter") go(); };
  }

  window.Storage = { getPlayers, getPlayer, savePlayer, deletePlayer, generateId, nextNum, exportJSON, importJSON, isAuthed, tryLogin, logout, requireAuth };
})();
