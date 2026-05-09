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

  return {POS_LABELS,POS_TO_CODE,ROLES_BY_POS,FORMATIONS,REGIONS,TAGS,
    tagClass,verdictBadge,star,starsRow,fmtMoney,drawRadar,tags,downloadPDF,escapeHtml};
})();
