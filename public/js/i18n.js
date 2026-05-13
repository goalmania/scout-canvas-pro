// i18n.js — mini language switcher (IT/EN/FR/ES)
(function(){
  const KEY = "dmscout_lang";
  const DICT = {
    it: {
      "nav.portfolio":"Portfolio","nav.services":"Servizi","nav.reports":"I Miei Report","nav.map":"Mappa","nav.contact":"Contatti",
      "nav.new":"Nuovo Report","nav.compare":"Confronta","nav.back":"← Portfolio","nav.logout":"Esci",
      "hero.label":"// FOOTBALL SCOUT · MANAGEMENT · DATA",
      "hero.intro":"Osservatore calcistico certificato e founder di <strong style=\"color:var(--white)\">DM Football Services</strong>. Costruisco strumenti, dati e relazioni per chi muove il calcio professionistico. Sono un laureando in Football University, aspirante procuratore sportivo.",
      "hero.cta1":"Scopri il profilo →","hero.cta2":"I miei progetti","hero.cta3":"I miei report →","hero.cv":"⤓ Scarica CV (PDF)",
      "lbl.reports":"// DATABASE GIOCATORI","lbl.search":"Cerca","lbl.position":"Posizione","lbl.verdict":"Verdetto","lbl.region":"Regione","lbl.sort":"Ordina per",
      "btn.new":"+ Nuovo Report","btn.export":"↓ Export JSON","btn.import":"↑ Import JSON","btn.edit":"✏ Modifica","btn.delete":"🗑 Elimina","btn.pdf":"⤓ PDF","btn.compare":"⇄ Confronta",
      "modal.strengths":"// PUNTI DI FORZA","modal.weaknesses":"// AREE DI MIGLIORAMENTO","modal.summary":"// ANALISI","modal.verdict":"// VERDETTO FINALE",
      "modal.ratings":"// VALUTAZIONI","modal.skills":"// SKILLS","modal.tactical":"// RUOLI TATTICI","modal.market":"// MERCATO","modal.tags":"// TAGS","modal.report":"// REPORT",
      "lang.label":"Lingua"
    },
    en: {
      "nav.portfolio":"Portfolio","nav.services":"Services","nav.reports":"My Reports","nav.map":"Map","nav.contact":"Contact",
      "nav.new":"New Report","nav.compare":"Compare","nav.back":"← Portfolio","nav.logout":"Logout",
      "hero.label":"// FOOTBALL SCOUT · MANAGEMENT · DATA",
      "hero.intro":"Certified football scout and founder of <strong style=\"color:var(--white)\">DM Football Services</strong>. I build tools, data and relationships for the people who move professional football. I'm a Football University undergraduate and aspiring sports agent.",
      "hero.cta1":"Discover the profile →","hero.cta2":"My projects","hero.cta3":"My reports →","hero.cv":"⤓ Download CV (PDF)",
      "lbl.reports":"// PLAYERS DATABASE","lbl.search":"Search","lbl.position":"Position","lbl.verdict":"Verdict","lbl.region":"Region","lbl.sort":"Sort by",
      "btn.new":"+ New Report","btn.export":"↓ Export JSON","btn.import":"↑ Import JSON","btn.edit":"✏ Edit","btn.delete":"🗑 Delete","btn.pdf":"⤓ PDF","btn.compare":"⇄ Compare",
      "modal.strengths":"// STRENGTHS","modal.weaknesses":"// AREAS TO IMPROVE","modal.summary":"// ANALYSIS","modal.verdict":"// FINAL VERDICT",
      "modal.ratings":"// RATINGS","modal.skills":"// SKILLS","modal.tactical":"// TACTICAL ROLES","modal.market":"// MARKET","modal.tags":"// TAGS","modal.report":"// REPORT",
      "lang.label":"Language"
    },
    fr: {
      "nav.portfolio":"Portfolio","nav.services":"Services","nav.reports":"Mes Rapports","nav.map":"Carte","nav.contact":"Contact",
      "nav.new":"Nouveau Rapport","nav.compare":"Comparer","nav.back":"← Portfolio","nav.logout":"Déconnexion",
      "hero.label":"// SCOUT FOOTBALL · MANAGEMENT · DATA",
      "hero.intro":"Observateur de football certifié et fondateur de <strong style=\"color:var(--white)\">DM Football Services</strong>. Je construis outils, données et relations pour ceux qui font bouger le football professionnel. Étudiant à Football University, futur agent sportif.",
      "hero.cta1":"Découvrir le profil →","hero.cta2":"Mes projets","hero.cta3":"Mes rapports →","hero.cv":"⤓ Télécharger CV (PDF)",
      "lbl.reports":"// BASE DE JOUEURS","lbl.search":"Rechercher","lbl.position":"Position","lbl.verdict":"Verdict","lbl.region":"Région","lbl.sort":"Trier par",
      "btn.new":"+ Nouveau Rapport","btn.export":"↓ Export JSON","btn.import":"↑ Import JSON","btn.edit":"✏ Modifier","btn.delete":"🗑 Supprimer","btn.pdf":"⤓ PDF","btn.compare":"⇄ Comparer",
      "modal.strengths":"// POINTS FORTS","modal.weaknesses":"// AXES D'AMÉLIORATION","modal.summary":"// ANALYSE","modal.verdict":"// VERDICT FINAL",
      "modal.ratings":"// ÉVALUATIONS","modal.skills":"// COMPÉTENCES","modal.tactical":"// RÔLES TACTIQUES","modal.market":"// MARCHÉ","modal.tags":"// TAGS","modal.report":"// RAPPORT",
      "lang.label":"Langue"
    },
    es: {
      "nav.portfolio":"Portfolio","nav.services":"Servicios","nav.reports":"Mis Informes","nav.map":"Mapa","nav.contact":"Contacto",
      "nav.new":"Nuevo Informe","nav.compare":"Comparar","nav.back":"← Portfolio","nav.logout":"Salir",
      "hero.label":"// SCOUT DE FÚTBOL · MANAGEMENT · DATA",
      "hero.intro":"Ojeador de fútbol certificado y fundador de <strong style=\"color:var(--white)\">DM Football Services</strong>. Construyo herramientas, datos y relaciones para quienes mueven el fútbol profesional. Estudiante en Football University, aspirante a agente deportivo.",
      "hero.cta1":"Descubre el perfil →","hero.cta2":"Mis proyectos","hero.cta3":"Mis informes →","hero.cv":"⤓ Descargar CV (PDF)",
      "lbl.reports":"// BASE DE JUGADORES","lbl.search":"Buscar","lbl.position":"Posición","lbl.verdict":"Veredicto","lbl.region":"Región","lbl.sort":"Ordenar por",
      "btn.new":"+ Nuevo Informe","btn.export":"↓ Export JSON","btn.import":"↑ Import JSON","btn.edit":"✏ Editar","btn.delete":"🗑 Eliminar","btn.pdf":"⤓ PDF","btn.compare":"⇄ Comparar",
      "modal.strengths":"// PUNTOS FUERTES","modal.weaknesses":"// ÁREAS DE MEJORA","modal.summary":"// ANÁLISIS","modal.verdict":"// VEREDICTO FINAL",
      "modal.ratings":"// VALORACIONES","modal.skills":"// HABILIDADES","modal.tactical":"// ROLES TÁCTICOS","modal.market":"// MERCADO","modal.tags":"// TAGS","modal.report":"// INFORME",
      "lang.label":"Idioma"
    }
  };
  const FLAGS = {it:"🇮🇹", en:"🇬🇧", fr:"🇫🇷", es:"🇪🇸"};

  function getLang(){ return localStorage.getItem(KEY) || "it"; }
  function setLang(l){
    if(!DICT[l]) return;
    localStorage.setItem(KEY, l);
    apply();
    document.documentElement.lang = l;
    document.dispatchEvent(new CustomEvent("i18n:change",{detail:{lang:l}}));
  }
  function t(k){
    const d = DICT[getLang()] || DICT.it;
    return d[k] != null ? d[k] : (DICT.it[k] != null ? DICT.it[k] : k);
  }
  function apply(){
    document.querySelectorAll("[data-i18n]").forEach(el=>{
      const k = el.getAttribute("data-i18n");
      const v = t(k);
      if(el.hasAttribute("data-i18n-html") || /<[a-z]/i.test(v)) el.innerHTML = v;
      else el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{
      el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });
  }
  function renderSwitcher(){
    const cur = getLang();
    const wrap = document.createElement("div");
    wrap.className = "lang-switch";
    wrap.innerHTML = Object.keys(DICT).map(l=>
      `<button data-lang="${l}" class="${l===cur?'on':''}" title="${l.toUpperCase()}">${FLAGS[l]} ${l.toUpperCase()}</button>`
    ).join("");
    wrap.addEventListener("click",e=>{
      const b = e.target.closest("button[data-lang]");
      if(!b) return;
      setLang(b.dataset.lang);
      wrap.querySelectorAll("button").forEach(x=>x.classList.toggle("on", x.dataset.lang===b.dataset.lang));
    });
    return wrap;
  }

  document.addEventListener("DOMContentLoaded", ()=>{ document.documentElement.lang = getLang(); apply(); });

  window.I18N = { t, setLang, getLang, apply, renderSwitcher, DICT };
})();
