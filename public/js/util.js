// util.js — shared helpers (roles, radar, badges, PDF)
window.U = (function(){
  const POS_LABELS = {
    GK:"Portiere", CB:"Difensore Centrale", LB:"Terzino Sinistro", RB:"Terzino Destro",
    CDM:"Mediano", CM:"Mezzala", CAM:"Trequartista",
    LW:"Ala Sinistra", RW:"Ala Destra", ST:"Prima Punta", CF:"Seconda Punta"
  };
  const POS_TO_CODE = {
    "Portiere":"GK","Difensore Centrale":"CB","Terzino Sinistro":"LB","Terzino Destro":"RB",
    "Mediano":"CDM","Mezzala":"CM","Regista":"CM","Trequartista":"CAM",
    "Ala Sinistra":"LW","Ala Destra":"RW","Prima Punta":"ST","Segunda Punta":"CF","Seconda Punta":"CF"
  };
  const ROLES_BY_POS = {
    GK:[{c:"GK_SWEEPER",l:"Portiere Sweeper"},{c:"GK_SHOT_STOPPER",l:"Portiere Shot Stopper"}],
    CB:[{c:"CB_BALL_PLAYING",l:"Difensore Palla al Piede"},{c:"CB_STOPPER",l:"Stopper"},{c:"CB_LIBERO",l:"Libero"}],
    LB:[{c:"LB_WING_BACK",l:"Wing Back"},{c:"LB_INVERTED",l:"Terzino Invertito"},{c:"LB_CLASSIC",l:"Terzino Classico"}],
    RB:[{c:"RB_WING_BACK",l:"Wing Back"},{c:"RB_INVERTED",l:"Terzino Invertito"},{c:"RB_CLASSIC",l:"Terzino Classico"}],
    CDM:[{c:"CDM_SCREEN",l:"Mediano Schermo"},{c:"CDM_BOX_TO_BOX",l:"Box-to-Box"}],
    CM:[{c:"CM_REGISTA",l:"Regista"},{c:"CM_BOX",l:"Box-to-Box"},{c:"CM_MEZZALA_OFF",l:"Mezzala Offensiva"},{c:"CM_MEZZALA_DEF",l:"Mezzala Difensiva"}],
    CAM:[{c:"CAM_TREQUARTISTA",l:"Trequartista"},{c:"CAM_SHADOW",l:"Shadow Striker"}],
    LW:[{c:"LW_WINGER",l:"Ala Pura"},{c:"LW_INVERTED",l:"Ala Accentrante"}],
    RW:[{c:"RW_WINGER",l:"Ala Pura"},{c:"RW_INVERTED",l:"Ala Accentrante"}],
    ST:[{c:"ST_TARGET",l:"Centravanti Target"},{c:"ST_PRESSING",l:"Punta Pressing"}],
    CF:[{c:"CF_FALSE_9",l:"Falso Nueve"},{c:"CF_SECONDA_PUNTA",l:"Seconda Punta"}]
  };
  const FORMATIONS = ["4-3-3","4-2-3-1","4-4-2","3-5-2","3-4-3","5-3-2","4-1-4-1"];
  const REGIONS = ["Puglia","Campania","Basilicata","Calabria","Sicilia","Sardegna","Lazio","Lombardia","Veneto","Toscana","Emilia-Romagna","Piemonte","Liguria","Marche","Abruzzo","Molise","Umbria","Friuli-Venezia Giulia","Trentino-Alto Adige","Valle d'Aosta"];
  const TAGS = ["HIGH POTENTIAL","LOW COST","READY","MONITOR","RISKY","TOP PROSPECT"];

  function tagClass(t){
    if(t==="HIGH POTENTIAL"||t==="TOP PROSPECT") return "chip-accent";
    if(t==="READY"||t==="LOW COST") return "chip-accent2";
    if(t==="RISKY") return "chip-red";
    if(t==="MONITOR") return "chip-orange";
    return "";
  }

  function verdictBadge(v){
    if(v==="buy") return `<span class="chip chip-accent">BUY</span>`;
    if(v==="monitor") return `<span class="chip chip-orange">MONITOR</span>`;
    if(v==="pass") return `<span class="chip chip-red">PASS</span>`;
    return "";
  }

  function star(filled,onClick,i){
    return `<svg viewBox="0 0 24 24" class="${filled?'on':''}" ${onClick?`onclick="${onClick}(${i})"`:''}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
  }
  function starsRow(n,onClick){
    let h = '<div class="stars'+(onClick?'':' stars-static')+'">';
    for(let i=1;i<=5;i++) h += star(i<=n, onClick||"", i);
    h += '</div>'; return h;
  }

  function fmtMoney(n){
    if(!n && n!==0) return "—";
    if(n>=1e6) return "€"+(n/1e6).toFixed(1)+"M";
    if(n>=1e3) return "€"+(n/1e3).toFixed(0)+"K";
    return "€"+n;
  }

  // RADAR CHART (Canvas)
  function drawRadar(canvas, data, opts){
    opts = opts || {};
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    const cx = W/2, cy = H/2;
    const radius = Math.min(W,H)/2 - 50;
    const labels = data.labels;
    const N = labels.length;
    const maxVal = opts.max || 10;

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for(let r=1;r<=5;r++){
      ctx.beginPath();
      for(let i=0;i<N;i++){
        const ang = -Math.PI/2 + i*2*Math.PI/N;
        const rr = radius*r/5;
        const x = cx + Math.cos(ang)*rr;
        const y = cy + Math.sin(ang)*rr;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath(); ctx.stroke();
    }
    // axes
    for(let i=0;i<N;i++){
      const ang = -Math.PI/2 + i*2*Math.PI/N;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(cx+Math.cos(ang)*radius, cy+Math.sin(ang)*radius);
      ctx.stroke();
    }
    // labels
    ctx.fillStyle = "#888";
    ctx.font = "11px 'Space Mono', monospace";
    ctx.textAlign = "center"; ctx.textBaseline="middle";
    for(let i=0;i<N;i++){
      const ang = -Math.PI/2 + i*2*Math.PI/N;
      const x = cx + Math.cos(ang)*(radius+24);
      const y = cy + Math.sin(ang)*(radius+24);
      ctx.fillText(labels[i].toUpperCase(), x, y);
    }
    // datasets
    (data.datasets||[]).forEach(ds=>{
      ctx.beginPath();
      ds.values.forEach((v,i)=>{
        const ang = -Math.PI/2 + i*2*Math.PI/N;
        const rr = radius*Math.max(0,Math.min(1,v/maxVal));
        const x = cx + Math.cos(ang)*rr;
        const y = cy + Math.sin(ang)*rr;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.closePath();
      ctx.fillStyle = ds.fill;
      ctx.strokeStyle = ds.stroke;
      ctx.lineWidth = 2;
      ctx.fill(); ctx.stroke();
      // points
      ds.values.forEach((v,i)=>{
        const ang = -Math.PI/2 + i*2*Math.PI/N;
        const rr = radius*Math.max(0,Math.min(1,v/maxVal));
        const x = cx + Math.cos(ang)*rr;
        const y = cy + Math.sin(ang)*rr;
        ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2);
        ctx.fillStyle = ds.stroke; ctx.fill();
      });
    });
  }

  function tags(p){
    return (p.tags||[]).map(t=>`<span class="chip ${tagClass(t)}">${t}</span>`).join(" ");
  }

  function downloadPDF(){
    window.print();
  }

  function escapeHtml(s){
    return String(s||"").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  function playerCardHtml(p){
    const r = p.ratings || {};
    const stat = (lab,val) => `
      <div class="pcard-stat">
        <div class="lab"><span>${lab}</span><b>${(val||0).toFixed(1)}</b></div>
        <div class="b"><i style="width:${Math.min(100,(val||0)*10)}%"></i></div>
      </div>`;
    const topTags = (p.tags||[]).slice(0,2).map(t=>`<span class="chip ${tagClass(t)}" style="font-size:.62rem">${t}</span>`).join("");
    const verdict = verdictBadge(p.verdict_type);
    const obs = (p.observation_type||"").toUpperCase();
    return `
    <div class="pcard" onclick="U.openPlayerModal('${p.id}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter')U.openPlayerModal('${p.id}')">
      <div class="pcard-head">
        <span class="pcard-num">#${p.num||"000"}</span>
        <div class="pcard-tags">${topTags}${verdict}</div>
      </div>
      <div>
        <h3 class="pcard-name">${escapeHtml(p.name)}</h3>
        <div style="color:var(--gray);font-size:.88rem;margin-top:.2rem">${escapeHtml(p.club||"")}</div>
        <div class="pcard-meta" style="margin-top:.3rem">${p.flag||""} ${escapeHtml(p.position_main||"")} · ${p.birth_year||p.age||""}</div>
      </div>
      <div class="pcard-overall">
        <div>
          <div class="lbl">OVERALL</div>
          <div class="num">${(r.overall||0).toFixed(1)}</div>
        </div>
        <div>${starsRow(Math.round((r.overall||0)/2))}</div>
      </div>
      <div class="pcard-grid">
        ${stat("TECNICA", r.technical)}
        ${stat("TATTICA", r.tactical)}
        ${stat("FISICO", r.physical)}
        ${stat("MENTALITÀ", r.mental)}
      </div>
      <div class="pcard-foot">
        <span>${obs||"REPORT"} · ${p.date||""}</span>
        <span style="color:var(--accent)">APRI →</span>
      </div>
    </div>`;
  }

  function playerDetailHtml(p){
    const skillLabels = {ball_control:"Ball Control",passing:"Passaggio",dribbling:"Dribbling",finishing:"Finalizzazione",defensive_work:"Difensiva",tactical_iq:"Tattica IQ",decision_making:"Decision",aerial:"Aerei",pace:"Velocità",stamina:"Resistenza"};
    const r = p.ratings || {};
    const canEdit = window.Storage && Storage.isAuthed();
    return `
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:1rem;align-items:end;margin-bottom:1.2rem">
      <div class="label">// REPORT #${p.num||""}</div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <button class="btn btn-outline btn-sm" onclick="localStorage.setItem('dmscout_compare_id','${p.id}');location.href='/compare.html'">⇄ Compare</button>
        ${canEdit?`<a href="/edit-report.html?id=${p.id}" class="btn btn-outline btn-sm">✏ Edit</a>`:''}
        <a href="/player.html?id=${p.id}" class="btn btn-outline btn-sm" target="_blank">⤓ PDF</a>
      </div>
    </div>

    <div class="card-flat" style="display:grid;grid-template-columns:auto 1fr auto;gap:1.5rem;align-items:center;margin-bottom:1.2rem">
      ${p.photo ? `<img src="${p.photo}" class="photo-square" alt="${escapeHtml(p.name)}">` : `<div class="photo-square">${(p.name||'?').split(' ').map(s=>s[0]).join('').slice(0,2)}</div>`}
      <div>
        <div class="mono" style="color:var(--gray);font-size:.75rem;letter-spacing:2px">${p.flag||''} ${escapeHtml(p.nationality||'')}</div>
        <h1 style="margin:.3rem 0;font-size:2rem">${escapeHtml(p.name)}</h1>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.5rem">
          <span class="chip chip-accent">${escapeHtml(p.position_main||'')}</span>
          ${(p.position_secondary||[]).map(s=>`<span class="chip">${escapeHtml(s)}</span>`).join("")}
          ${verdictBadge(p.verdict_type)}
        </div>
        <div style="color:var(--gray);font-size:.95rem;margin-top:.6rem">${escapeHtml(p.club||'')} · ${escapeHtml(p.league||'')}</div>
      </div>
      <div style="text-align:right">
        <div class="stat-num" style="font-size:3rem;color:var(--accent)">${(r.overall||0).toFixed(1)}</div>
        <div class="stat-lbl">Overall</div>
      </div>
    </div>

    <div class="row row-4" style="margin-bottom:1.2rem">
      <div class="stat"><div class="stat-num" style="font-size:1.6rem">${p.age||'—'}</div><div class="stat-lbl">Età · ${p.birth_year||''}</div></div>
      <div class="stat"><div class="stat-num" style="font-size:1.6rem">${p.height||'—'}<span style="font-size:.85rem">cm</span></div><div class="stat-lbl">Altezza</div></div>
      <div class="stat"><div class="stat-num" style="font-size:1.6rem">${p.weight||'—'}<span style="font-size:.85rem">kg</span></div><div class="stat-lbl">Peso</div></div>
      <div class="stat"><div class="stat-num" style="font-size:1.6rem">${escapeHtml(p.foot||'—')}</div><div class="stat-lbl">Piede</div></div>
    </div>

    <div class="row row-2" style="margin-bottom:1.2rem;align-items:start">
      <div class="card-flat">
        <div class="label" style="margin-bottom:1rem">// VALUTAZIONI</div>
        <canvas id="modalRadar" width="380" height="380" style="max-width:100%;height:auto"></canvas>
      </div>
      <div class="card-flat">
        <div class="label" style="margin-bottom:1rem">// SKILLS</div>
        ${Object.keys(skillLabels).map(k=>`
          <div class="bar-row"><span class="lab">${skillLabels[k]}</span><div class="bar"><div class="bar-fill" style="width:${(p.skills&&p.skills[k])||0}%"></div></div><span class="val">${(p.skills&&p.skills[k])||0}</span></div>
        `).join("")}
      </div>
    </div>

    ${p.stars?`<div class="card-flat" style="margin-bottom:1.2rem">
      <div class="label" style="margin-bottom:1rem">// STELLE</div>
      <div class="row row-3">
        ${["technique","athleticism","mentality","potential","market_value"].map(k=>`
          <div><div style="font-family:var(--font-mono);font-size:.72rem;letter-spacing:2px;color:var(--gray);margin-bottom:.3rem">${({technique:"TECNICA",athleticism:"ATLETISMO",mentality:"MENTALITÀ",potential:"POTENZIALE",market_value:"VALORE"})[k]}</div>${starsRow(p.stars[k]||0)}</div>
        `).join("")}
      </div>
    </div>`:''}

    ${(p.tactical_roles||[]).length?`<div class="card-flat" style="margin-bottom:1.2rem">
      <div class="label" style="margin-bottom:1rem">// RUOLI TATTICI</div>
      <div class="row row-2">
        ${(p.tactical_roles||[]).map(rr=>`
          <div style="padding:1rem;border:0.5px solid var(--border);border-radius:6px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.6rem">
              <span class="chip chip-accent">${rr.formation}</span>
              <span class="mono" style="color:var(--accent);font-weight:700">${rr.fit_score}%</span>
            </div>
            <div style="font-family:var(--font-display);font-weight:700;text-transform:uppercase">${escapeHtml(rr.role)}</div>
            <div class="bar" style="margin-top:.6rem"><div class="bar-fill" style="width:${rr.fit_score}%"></div></div>
          </div>
        `).join("")}
      </div>
    </div>`:''}

    ${p.market?`<div class="card-flat" style="margin-bottom:1.2rem">
      <div class="label" style="margin-bottom:1rem">// MERCATO</div>
      <div class="row row-4">
        <div><div class="label">Range Valore</div><div style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;color:var(--accent)">${fmtMoney(p.market.value_min)} – ${fmtMoney(p.market.value_max)}</div></div>
        <div><div class="label">Potenziale</div><div style="font-family:var(--font-display);font-size:1.05rem;font-weight:700">${escapeHtml(p.market.potential||'—')}</div></div>
        <div><div class="label">Rischio</div><div style="font-family:var(--font-display);font-size:1.05rem;font-weight:700">${escapeHtml(p.market.risk||'—')}</div></div>
        <div><div class="label">Pronto per</div><div style="font-family:var(--font-display);font-size:1.05rem;font-weight:700">${escapeHtml(p.market.ready_level||'—')}</div></div>
      </div>
      ${p.market.timeline?`<div style="margin-top:.8rem;color:var(--gray);font-size:.9rem">Timeline: ${escapeHtml(p.market.timeline)}</div>`:''}
    </div>`:''}

    ${(p.tags||[]).length?`<div class="card-flat" style="margin-bottom:1.2rem"><div class="label" style="margin-bottom:.7rem">// TAGS</div>${tags(p)}</div>`:''}

    <div class="row row-2" style="margin-bottom:1.2rem;align-items:start">
      <div class="card-flat">
        <div class="label" style="margin-bottom:.7rem;color:var(--accent)">// PUNTI DI FORZA</div>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:.5rem">
          ${(p.strengths||[]).map(s=>`<li style="padding:.5rem .8rem;border-left:2px solid var(--accent);background:var(--accent-dim)">${escapeHtml(s)}</li>`).join("")}
        </ul>
      </div>
      <div class="card-flat">
        <div class="label" style="margin-bottom:.7rem;color:var(--orange)">// AREE DI MIGLIORAMENTO</div>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:.5rem">
          ${(p.weaknesses||[]).map(s=>`<li style="padding:.5rem .8rem;border-left:2px solid var(--orange);background:rgba(255,140,0,.08)">${escapeHtml(s)}</li>`).join("")}
        </ul>
      </div>
    </div>

    ${p.summary?`<div class="card-flat" style="margin-bottom:1.2rem">
      <div class="label" style="margin-bottom:.7rem">// ANALISI</div>
      <p style="line-height:1.7">${escapeHtml(p.summary)}</p>
    </div>`:''}

    <div class="verdict-box ${p.verdict_type||''}">
      <div class="label" style="margin-bottom:.5rem">// VERDETTO FINALE</div>
      <h3 style="font-size:1.4rem">${(p.verdict_type||'').toUpperCase()}</h3>
      <p style="margin-top:.6rem;line-height:1.6">${escapeHtml(p.verdict||'')}</p>
    </div>
    `;
  }

  function escClose(e){ if(e.key==="Escape") closePlayerModal(); }
  function openPlayerModal(id){
    const p = window.Storage && Storage.getPlayer(id);
    if(!p) return;
    closePlayerModal();
    const overlay = document.createElement("div");
    overlay.className = "pmodal";
    overlay.id = "pmodal";
    overlay.innerHTML = `<div class="pmodal-box">
      <button class="pmodal-close" aria-label="Chiudi" onclick="U.closePlayerModal()">✕</button>
      <div class="pmodal-body">${playerDetailHtml(p)}</div>
    </div>`;
    overlay.addEventListener("click", e => { if(e.target===overlay) closePlayerModal(); });
    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");
    const r = p.ratings || {};
    const canvas = overlay.querySelector("#modalRadar");
    if(canvas) drawRadar(canvas,{
      labels:["Tecnica","Tattica","Fisico","Mentalità","Overall"],
      datasets:[{values:[r.technical||0,r.tactical||0,r.physical||0,r.mental||0,r.overall||0],fill:"rgba(200,240,0,0.18)",stroke:"#c8f000"}]
    },{max:10});
    document.addEventListener("keydown", escClose);
  }
  function closePlayerModal(){
    const m = document.getElementById("pmodal");
    if(m) m.remove();
    document.body.classList.remove("modal-open");
    document.removeEventListener("keydown", escClose);
  }

  return {POS_LABELS,POS_TO_CODE,ROLES_BY_POS,FORMATIONS,REGIONS,TAGS,
    tagClass,verdictBadge,star,starsRow,fmtMoney,drawRadar,tags,downloadPDF,escapeHtml,playerCardHtml,playerDetailHtml,openPlayerModal,closePlayerModal};
})();
