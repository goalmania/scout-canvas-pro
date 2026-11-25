// nav.js — shared glass navbar, mobile tab bar, background and footer
(function(){
  const ICONS = {
    home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    services:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    reports:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    map:'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    contact:'<path d="M4 5h16v12H8l-4 4z"/>',
    add:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    compare:'<path d="M7 4v16M17 4v16M3 8h8M13 16h8"/>'
  };
  const PUB_LINKS = [
    {href:"/portfolio.html", key:"nav.portfolio", label:"Home", icon:"home"},
    {href:"/services.html", key:"nav.services", label:"Servizi", icon:"services"},
    {href:"/database.html", key:"nav.reports", label:"Report", icon:"reports"},
    {href:"/map.html", key:"nav.map", label:"Mappa", icon:"map"},
    {href:"/contact.html", key:"nav.contact", label:"Contatti", icon:"contact", cta:true},
  ];
  const SCOUT_LINKS = [
    {href:"/portfolio.html", key:"nav.portfolio", label:"Home", icon:"home"},
    {href:"/database.html", key:"nav.reports", label:"Report", icon:"reports"},
    {href:"/add-report.html", key:"nav.new", label:"Nuovo", icon:"add", cta:true},
    {href:"/compare.html", key:"nav.compare", label:"Confronta", icon:"compare"},
    {href:"/map.html", key:"nav.map", label:"Mappa", icon:"map"},
  ];

  function tt(k, fb){ const v = window.I18N && I18N.t(k); return (v && v !== k) ? v : (fb || k); }
  function authed(){ try{ return !!(window.Storage && Storage.isAuthed && Storage.isAuthed()); }catch(e){ return false; } }
  function icon(n){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICONS[n]+'</svg>'; }
  function isActive(href){ const p = location.pathname; return p.endsWith(href) || (href === "/portfolio.html" && (p === "/" || p.endsWith("/index.html"))); }

  function renderBackground(){
    if(document.querySelector(".gx-bg")) return;
    const bg = document.createElement("div");
    bg.className = "gx-bg no-print"; bg.setAttribute("aria-hidden","true");
    bg.innerHTML = '<i class="gx-orb a"></i><i class="gx-orb b"></i><i class="gx-pitch"></i>';
    document.body.insertBefore(bg, document.body.firstChild);
  }

  // Bottom tab bar for phones. Exposed so portfolio.html (own top nav) can reuse it.
  function renderTabbar(links){
    if(document.querySelector(".gx-tabbar")) return;
    links = links || (authed() ? SCOUT_LINKS : PUB_LINKS);
    const bar = document.createElement("nav");
    bar.className = "gx-tabbar no-print"; bar.setAttribute("aria-label","Navigazione");
    bar.innerHTML = links.map(l =>
      `<a href="${l.href}" class="${isActive(l.href)?'on':''} ${l.cta?'cta':''}" ${isActive(l.href)?'aria-current="page"':''}>${icon(l.icon)}<span>${l.label}</span></a>`
    ).join("");
    document.body.appendChild(bar);
    document.body.classList.add("has-tabbar");
  }

  function renderNav(opts){
    opts = opts || {};
    // Scout tools only once logged in: visitors from the portfolio always see the public menu.
    const isScout = !!opts.scout && authed();
    const links = isScout ? SCOUT_LINKS : PUB_LINKS;
    renderBackground();
    const linksHtml = links.filter(l => l.href !== "/portfolio.html").map(l=>{
      const cls = (l.cta ? "nav-cta " : "") + (isActive(l.href) ? "active" : "");
      return `<a href="${l.href}" class="${cls}" data-i18n="${l.key}">${tt(l.key, l.label)}</a>`;
    }).join("");
    const nav = document.createElement("nav");
    nav.className = "nav no-print";
    nav.innerHTML = `
      <div class="nav-inner">
        <a href="/portfolio.html" class="nav-brand"><span class="gx-dot"></span><span>Paolo Di Muro</span></a>
        <div class="nav-links" id="navLinks">${linksHtml}
          ${isScout?'<a href="#" id="navLogout" style="color:var(--red)">'+tt("nav.logout","Esci")+'</a>':''}
          <span id="navLang"></span>
        </div>
        <span id="navLangM" class="nav-lang-m"></span>
      </div>`;
    document.body.insertBefore(nav, document.body.firstChild);
    const lo = nav.querySelector("#navLogout");
    if(lo) lo.onclick = e => { e.preventDefault(); window.Storage.logout(); location.href="/portfolio.html"; };
    if(window.I18N){
      nav.querySelector("#navLang").appendChild(I18N.renderSwitcher());
      const m = I18N.renderSwitcher();
      m.querySelectorAll("button[data-lang]").forEach(b => { b.textContent = b.dataset.lang.toUpperCase(); });
      nav.querySelector("#navLangM").appendChild(m);
    }
    renderTabbar(isScout ? SCOUT_LINKS : PUB_LINKS);
  }

  function renderFooter(){
    const f = document.createElement("footer");
    f.className = "no-print";
    f.innerHTML = `
      <div class="container">
        <div>
          <div class="label" style="margin-bottom:.5rem;color:var(--accent)">Paolo Di Muro</div>
          <div style="font-family:var(--font-display);font-weight:800;font-size:1.3rem;text-transform:uppercase;color:var(--white)">DM Football Services</div>
          <div style="margin-top:.3rem;font-size:.9rem">Scouting · Analisi · Dati</div>
        </div>
        <div class="gx-foot-links">
          <a href="mailto:dimuropaolo7@gmail.com">dimuropaolo7@gmail.com</a>
          <a href="https://wa.me/393334218596" target="_blank" rel="noopener">WhatsApp</a>
          <a href="https://instagram.com/goalmania.it" target="_blank" rel="noopener">Instagram</a>
          <span>© ${new Date().getFullYear()}</span>
        </div>
      </div>`;
    document.body.appendChild(f);
  }

  window.UI = { renderNav, renderFooter, renderTabbar };
})();
