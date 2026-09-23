/* Menu commun des démos Devanture (22-09-2026), même logique que le site Devanture :
   - le NOM d'une catégorie mène à sa page (#/c/N) qui présente ses sous-catégories en cartes ;
   - la petite FLÈCHE à côté ouvre la liste (et le survol à la souris) ;
   - chaque sous-catégorie : icône dans un carré, titre en gras, ligne d'explication ;
   - point de couleur après la flèche pour la catégorie en cours, et sur la sous-catégorie en cours.
   DemoNav({ lang, menu, pages, home, view, titleClass, homeLabel, sansPhoto:[ids], photos:true })
   Adresses : #/id (sous-page), #/c/N (page de catégorie), #ancre (section de l'accueil). ?menu=N ouvre le N-ième menu (vignettes). */
(function () {
  "use strict";
  var esc = function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); };
  var svg = function (d, w) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 1.9) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>"; };
  var CHEVRON = svg('<path d="m6 9 6 6 6-6"/>', 2), BURGER = svg('<path d="M4 7h16M4 12h16M4 17h16"/>', 2), FLECHE = svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 2);
  var CAMERA = svg('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/>', 1.8);
  var I = {
    main: '<path d="M8 13V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V5.5a1.5 1.5 0 0 1 3 0V14c0 4-3 7-7 7-3 0-5-2-6-5l-1-3.5a1.5 1.5 0 0 1 2.8-1L8 13"/>',
    visage: '<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M8.5 15c2 1.6 5 1.6 7 0"/>',
    coeur: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
    vapeur: '<path d="M4 18c2-2 4-2 6 0s4 2 6 0 3-2 4-1M8 3c-1 2 1 3 0 5M12 3c-1 2 1 3 0 5M16 3c-1 2 1 3 0 5"/>',
    maison: '<path d="M4 10.5 12 4l8 6.5V20H4Z"/><path d="M10 20v-6h4v6"/>',
    feuille: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15ZM5 19l7-7"/>',
    cadeau: '<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M3 12h18M12 8v13M12 8c-2-4-6-4-6-1s6 1 6 1Zm0 0c2-4 6-4 6-1s-6 1-6 1Z"/>',
    tasse: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5ZM17 10h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2"/>',
    fleur: '<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5C12 6 14 4 12 3c-2 1 0 3 0 6.5ZM14.5 12c3.5 0 5.5 2 6.5 0-1-2-3 0-6.5 0ZM12 14.5c0 3.5-2 5.5 0 6.5 2-1 0-3 0-6.5ZM9.5 12C6 12 4 14 3 12c1-2 3 0 6.5 0Z"/>',
    balance: '<path d="M12 3v18M5 21h14M5 7h14M7 7l-3 7a3 3 0 0 0 6 0Zm10 0-3 7a3 3 0 0 0 6 0Z"/>',
    flamme: '<path d="M12 21c-4 0-7-3-7-7 0-4 4-6 4-10 3 2 5 5 5 8 1-1 2-2 2-4 2 2 3 4 3 6 0 4-3 7-7 7Z"/>',
    moulin: '<path d="M7 10h10l-1 11H8Z"/><path d="M9 10V6h6v4M12 6V3M12 3h5"/>',
    goutte: '<path d="M6 4h12l-4 7v5l-4 3v-8Z"/>',
    marmite: '<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4ZM2 10h20M9 6c0-1 1-2 3-2s3 1 3 2"/>',
    bain: '<path d="M3 12h18v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5ZM6 12V6a2 2 0 0 1 4 0M7 20l-1 2M17 20l1 2"/>',
    rouleau: '<rect x="3" y="3" width="15" height="6" rx="1.5"/><path d="M18 6h3v6h-9v3M10 15h4v6h-4Z"/>',
    sol: '<path d="M3 20h18M5 16l4-4 4 4 4-4 4 4M3 12l9-8 9 8"/>',
    equipe: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17.5" cy="9" r="2.5"/><path d="M16 14.2A5 5 0 0 1 21.5 19"/>',
    bouclier: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
    tour: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 4v3M12 17v3"/>',
    axes: '<path d="M12 12V3M12 12l8 5M12 12l-8 5"/><circle cx="12" cy="12" r="2"/>',
    etincelle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    regle: '<path d="m3 17 14-14 4 4L7 21Z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
    avion: '<path d="M21 16v-2l-8-5V4a1.5 1.5 0 0 0-3 0v5l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5Z"/>',
    croix: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
    eclair: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>',
    lit: '<path d="M3 20V10M21 20v-6M3 16h18M3 14h7a3 3 0 0 1 3 3v-3h8a2 2 0 0 0-2-2h-6"/><circle cx="7" cy="11" r="2"/>',
    arbre: '<path d="M12 22v-7M12 15c-4 0-7-2.5-7-6a7 7 0 0 1 14 0c0 3.5-3 6-7 6Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    journal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.4-2.8 4.2M12 17.6h.01"/>',
    enveloppe: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    defaut: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/>'
  };
  var ICONE_PAGE = {
    massages: "main", visage: "visage", duo: "coeur", hammam: "vapeur", espace: "maison", approche: "feuille", cadeaux: "cadeau",
    cafes: "tasse", doux: "fleur", equilibre: "balance", intense: "flamme", moulins: "moulin", methodes: "goutte",
    cuisine: "marmite", sdb: "bain", peinture: "rouleau", sol: "sol", equipe: "equipe", garanties: "bouclier",
    tournage: "tour", fraisage: "axes", finitions: "etincelle", controle: "regle", aero: "avion", medical: "croix", energie: "eclair",
    tilleul: "lit", verger: "lit", cabane: "arbre", petitdej: "tasse", jardin: "arbre", infos: "info",
    actus: "journal", faq: "question", contact: "enveloppe"
  };
  var icone = function (page) { return svg(I[ICONE_PAGE[page]] || I.defaut); };

  /* Emplacement photo : DemoPhoto("Photo : la salle", "fr", "classe", "style") */
  window.DemoPhoto = function (label, lang, cls, style) {
    return '<div class="dn-photo' + (cls ? " " + cls : "") + '"' + (style ? ' style="' + style + '"' : "") + ' role="img" aria-label="' + esc(label) + '">' + CAMERA +
      "<small>" + (lang === "en" ? "Photo slot" : "Emplacement photo") + "</small><span>" + esc(label) + "</span></div>";
  };

  window.DemoNav = function (cfg) {
    var lang = cfg.lang || "fr", route = "";
    var bar = document.getElementById("dn"), burger = document.getElementById("dnBurger");
    var home = document.getElementById(cfg.home), view = document.getElementById(cfg.view);
    var desktop = window.matchMedia("(min-width: 861px)"), fine = window.matchMedia("(pointer: fine)");
    var L = function (o) { return o ? (o[lang] || o.fr) : ""; };
    if (burger) burger.innerHTML = BURGER;
    function categorie(r) { var m = /^c\/(\d+)$/.exec(r || ""); return m ? +m[1] : -1; }
    function parent(id) {
      for (var i = 0; i < cfg.menu.length; i++) {
        var m = cfg.menu[i];
        if (m.page === id) return { m: m, i: i };
        if (m.children) for (var j = 0; j < m.children.length; j++) if (m.children[j].page === id) return { m: m, c: m.children[j], i: i };
      }
      return null;
    }
    function renderBar() {
      bar.innerHTML = cfg.menu.map(function (m, i) {
        var cur = !!route && (m.page === route || categorie(route) === i || (m.children || []).some(function (c) { return c.page === route; }));
        if (!m.children) {
          var href = m.page ? "#/" + m.page : m.href;
          return '<div class="dn-item"><a class="dn-top' + (cur ? " cur" : "") + '" href="' + href + '"' + (cur ? ' aria-current="page"' : "") + ">" + esc(L(m.label)) + "</a></div>";
        }
        var liens = m.children.map(function (c) {
          var ici = c.page === route;
          return '<a href="#/' + c.page + '"' + (ici ? ' class="cur" aria-current="page"' : "") + '><span class="dn-ico">' + icone(c.page) + '</span><span class="dn-txt"><b>' + esc(L(c.label)) + "</b>" + (c.desc ? "<small>" + esc(L(c.desc)) + "</small>" : "") + "</span></a>";
        }).join("");
        return '<div class="dn-item dn-has"><div class="dn-topwrap' + (cur ? " cur" : "") + '"><a class="dn-top dn-lien" href="#/c/' + i + '"' + (categorie(route) === i ? ' aria-current="page"' : "") + ">" + esc(L(m.label)) +
          '</a><button type="button" class="dn-caret" aria-expanded="false" aria-controls="dn-m' + i + '" aria-label="' + esc(L(m.label)) + (lang === "en" ? ": show the submenu" : " : afficher le sous-menu") + '">' + CHEVRON + "</button></div>" +
          '<div class="dn-menu" id="dn-m' + i + '">' + liens + "</div></div>";
      }).join("");
      bar.querySelectorAll(".dn-has").forEach(function (item) {
        var caret = item.querySelector(".dn-caret"), t;
        caret.addEventListener("click", function () { var o = !item.classList.contains("open"); fermer(item); ouvrir(item, o); });
        item.addEventListener("mouseenter", function () { if (desktop.matches && fine.matches) { clearTimeout(t); fermer(item); ouvrir(item, true); } });
        item.addEventListener("mouseleave", function () { if (desktop.matches && fine.matches) t = setTimeout(function () { ouvrir(item, false); }, 140); });
      });
    }
    function ouvrir(item, o) { item.classList.toggle("open", o); var b = item.querySelector(".dn-caret"); if (b) b.setAttribute("aria-expanded", String(o)); }
    function fermer(sauf) { bar.querySelectorAll(".dn-item.open").forEach(function (i) { if (i !== sauf) ouvrir(i, false); }); }
    function panneau(o) { if (!burger) return; bar.classList.toggle("open", o); burger.setAttribute("aria-expanded", String(o)); }
    function filAriane(parts) {
      return '<nav class="dn-crumbs" aria-label="' + (lang === "en" ? "Breadcrumb" : "Fil d'Ariane") + '"><span><a href="#/">' + esc(L(cfg.homeLabel)) + "</a></span>" + parts.join("") + "</nav>";
    }
    function pageCategorie(i) {
      var m = cfg.menu[i], pre = lang === "en" ? "Photo: " : "Photo : ";
      var cartes = m.children.map(function (c) {
        return '<a class="dn-card dn-cat" href="#/' + c.page + '">' + window.DemoPhoto(pre + L(c.label), lang) + '<span class="dn-ico">' + icone(c.page) + '</span><h3 class="' + (cfg.titleClass || "") + '">' + esc(L(c.label)) + "</h3><p>" + esc(L(c.desc)) + '</p><span class="dn-go">' + FLECHE + "</span></a>";
      }).join("");
      view.innerHTML = '<section class="dn-page">' + filAriane(['<span aria-current="page">' + esc(L(m.label)) + "</span>"]) + '<h1 class="' + (cfg.titleClass || "") + '">' + esc(L(m.label)) + '</h1><p class="dn-intro">' +
        esc(m.intro ? L(m.intro) : (lang === "en" ? "Choose what interests you: each page goes into the detail." : "Choisissez ce qui vous intéresse : chaque page entre dans le détail.")) + '</p><div class="dn-grid">' + cartes + "</div></section>";
    }
    function renderPage() {
      var ci = categorie(route), p = cfg.pages[route];
      if (p && p.action) {
        home.hidden = false; view.hidden = true; document.body.classList.remove("dn-sous-page");
        p.action();
        var cible = document.getElementById(p.target);
        if (cible) setTimeout(function () { cible.scrollIntoView({ block: "start" }); }, 30);
        return;
      }
      var sous = !!p || (ci >= 0 && !!cfg.menu[ci] && !!cfg.menu[ci].children);
      home.hidden = sous; view.hidden = !sous;
      document.body.classList.toggle("dn-sous-page", sous);
      if (!sous) return;
      window.scrollTo(0, 0);
      if (!p) { pageCategorie(ci); return; }
      var d = p[lang] || p.fr, pa = parent(route), freres = "";
      if (pa && pa.c && pa.m.children.length > 1) {
        freres = '<nav class="dn-sub" aria-label="' + esc(L(pa.m.label)) + '">' + pa.m.children.map(function (c) {
          return '<a href="#/' + c.page + '"' + (c.page === route ? ' class="cur" aria-current="page"' : "") + ">" + esc(L(c.label)) + "</a>";
        }).join("") + "</nav>";
      }
      var photos = cfg.photos !== false && (cfg.sansPhoto || []).indexOf(route) === -1, pre = lang === "en" ? "Photo: " : "Photo : ";
      var cartes = (d.items || []).map(function (it) {
        return '<article class="dn-card">' + (photos ? window.DemoPhoto(pre + it.t, lang) : "") + (it.tag ? '<span class="dn-tag">' + esc(it.tag) + "</span>" : "") + '<h3 class="' + (cfg.titleClass || "") + '">' + esc(it.t) + "</h3><p>" + esc(it.d) + "</p>" + (it.m ? '<div class="dn-m">' + esc(it.m) + "</div>" : "") + "</article>";
      }).join("");
      var cta = (d.cta || []).map(function (c, i) { return '<a href="' + c[1] + '"' + (i ? ' class="dn-line"' : "") + ">" + esc(c[0]) + "</a>"; }).join("");
      var chemin = pa && pa.c ? ['<span><a href="#/c/' + pa.i + '">' + esc(L(pa.m.label)) + "</a></span>"] : [];
      chemin.push('<span aria-current="page">' + esc(d.title) + "</span>");
      view.innerHTML = '<section class="dn-page">' + filAriane(chemin) + '<h1 class="' + (cfg.titleClass || "") + '">' + esc(d.title) + '</h1><p class="dn-intro">' + esc(d.intro) + "</p>" +
        (photos ? window.DemoPhoto(pre + d.title, lang, "dn-banner") : "") + freres + '<div class="dn-grid">' + cartes + "</div>" + (cta ? '<div class="dn-cta">' + cta + "</div>" : "") + "</section>";
    }
    function lireAdresse() {
      var h = location.hash || "";
      if (h.indexOf("#/") === 0) { route = h.slice(2); }
      else {
        var etaitSous = !!route && !(cfg.pages[route] && cfg.pages[route].action);
        route = "";
        if (etaitSous && h.length > 1) { renderBar(); renderPage(); var el = document.getElementById(h.slice(1)); if (el) setTimeout(function () { el.scrollIntoView({ block: "start" }); }, 30); if (cfg.onRoute) cfg.onRoute(route); return; }
      }
      renderBar(); renderPage();
      if (cfg.onRoute) cfg.onRoute(route);
    }
    window.addEventListener("hashchange", lireAdresse);
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".dn-item")) fermer(null);
      if (e.target.closest("#dn a")) { fermer(null); panneau(false); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { fermer(null); panneau(false); } });
    if (burger) burger.addEventListener("click", function () { panneau(!bar.classList.contains("open")); });
    lireAdresse();
    try { var n = new URLSearchParams(location.search).get("menu"); if (n !== null) { var it = bar.querySelectorAll(".dn-item")[+n]; if (it) ouvrir(it, true); } } catch (e) {}
    return { setLang: function (l) { lang = l; renderBar(); renderPage(); } };
  };
})();
