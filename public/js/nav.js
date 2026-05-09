// nav.js — shared navbar + footer
(function(){
  const PUB_LINKS = [
    {href:"/portfolio.html", label:"Portfolio"},
    {href:"/services.html", label:"Servizi"},
    {href:"/contact.html", label:"Contatti"},
    {href:"/index.html", label:"Scout Area", accent:true},
  ];
  const SCOUT_LINKS = [
    {href:"/index.html", label:"Dashboard"},
    {href:"/database.html", label:"Database"},
    {href:"/add-report.html", label:"Nuovo"},
    {href:"/ai-report.html", label:"AI"},
    {href:"/compare.html", label:"Compare"},
    {href:"/map.html", label:"Mappa"},
    {href:"/portfolio.html", label:"← Portfolio"},
  ];

  function renderNav(opts){
    opts = opts || {};
    const isScout = !!opts.scout;
    const links = isScout ? SCOUT_LINKS : PUB_LINKS;
    const path = location.pathname;
    const linksHtml = links.map(l=>{
      const active = path.endsWith(l.href) ? "active" : "";
      const cls = (l.accent ? "nav-cta " : "") + active;
      return `<a href="${l.href}" class="${cls}">${l.label}</a>`;
    }).join("");
    const logo = isScout ? "/assets/logo-dmscout.png" : "/assets/logo-dmfs.png";
    const brandText = isScout ? "DM Scout" : "Paolo Di Muro";
    const nav = document.createElement("nav");
    nav.className = "nav";
    nav.innerHTML = `
      <div class="nav-inner">
        <a href="${isScout?'/index.html':'/portfolio.html'}" class="nav-brand">
          <img src="${logo}" alt="logo">
          <span>${brandText}</span>
        </a>
        <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
        <div class="nav-links" id="navLinks">${linksHtml}
          ${isScout?'<a href="#" id="navLogout" style="color:var(--red)">Esci</a>':''}
        </div>
      </div>`;
    document.body.insertBefore(nav, document.body.firstChild);
    const toggle = nav.querySelector("#navToggle");
    const linksEl = nav.querySelector("#navLinks");
    toggle.onclick = ()=> linksEl.classList.toggle("open");
    const lo = nav.querySelector("#navLogout");
    if(lo) lo.onclick = e => { e.preventDefault(); window.Storage.logout(); location.href="/portfolio.html"; };
  }

  function renderFooter(){
    const f = document.createElement("footer");
    f.className = "no-print";
    f.innerHTML = `
      <div class="container">
        <div>
          <div class="label" style="margin-bottom:.5rem">// PAOLO DI MURO</div>
          <div style="font-family:var(--font-display);font-weight:700;font-size:1.2rem;text-transform:uppercase;color:var(--white)">DM Football Services</div>
          <div style="margin-top:.4rem;font-size:.85rem">Scouting · Football Management · Data</div>
        </div>
        <div style="font-family:var(--font-mono);font-size:.75rem;letter-spacing:1px;text-transform:uppercase">
          © ${new Date().getFullYear()} · Built with precision
        </div>
      </div>`;
    document.body.appendChild(f);
  }

  window.UI = { renderNav, renderFooter };
})();
