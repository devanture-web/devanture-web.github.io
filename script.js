(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var desktop = window.matchMedia("(min-width: 1181px)");

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---- bordure de l'en-tête + barre de progression ---- */
  var header = document.getElementById("siteHeader");
  var progress = document.getElementById("scrollProgress");
  /* une seule mise à jour par image affichée, et une transformation plutôt qu'une largeur (pas de recalcul de mise en page) */
  var ticking = false;
  var onScroll = function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (header) header.classList.toggle("scrolled", window.scrollY > 8);
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
      }
    });
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  /* ---- thème sombre / clair : choix du visiteur retenu sur son appareil, sinon celui de l'appareil ---- */
  var toggle = document.getElementById("themeToggle");
  var root = document.documentElement;
  var systemLight = window.matchMedia("(prefers-color-scheme: light)");
  var isLight = function () {
    var t = root.getAttribute("data-theme");
    return t ? t === "light" : systemLight.matches;
  };
  /* calendrier Cal.com : intégration officielle (leur script), au même thème que le site, qui suit le bouton lune/soleil */
  var calBox = document.getElementById("calInline");
  var syncCal = function () {};
  if (calBox) {
    (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
    var calTheme = null, calN = 0;
    syncCal = function () {  // Cal.com ne change pas de thème à chaud : on reconstruit le calendrier
      var t = isLight() ? "light" : "dark";
      if (t === calTheme) return;
      calTheme = t; calN += 1;
      var ns = "devanture" + calN;
      calBox.innerHTML = "";
      Cal("init", ns, { origin: "https://app.cal.com" });
      Cal.ns[ns]("inline", { elementOrSelector: "#calInline", calLink: calBox.getAttribute("data-cal-link"), config: { layout: "month_view", theme: t } });
      Cal.ns[ns]("ui", { theme: t, layout: "month_view" });
    };
  }
  var syncToggle = function () {
    syncCal();
    if (!toggle) return;
    toggle.setAttribute("aria-label", toggle.getAttribute(isLight() ? "data-to-dark" : "data-to-light"));
  };
  if (toggle) {
    syncToggle();
    toggle.addEventListener("click", function () {
      var next = isLight() ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("devanture-theme", next); } catch (e) {}
      syncToggle();
    });
  }
  systemLight.addEventListener("change", syncToggle);

  /* ---- menus déroulants : le mot mène à sa page ; la flèche (ou le survol à la souris) ouvre la liste ; Échap ferme ---- */
  var groups = Array.prototype.slice.call(document.querySelectorAll(".has-menu"));
  var setGroup = function (group, open) {
    group.classList.toggle("open", open);
    var caret = group.querySelector(".nav-caret");
    if (caret) caret.setAttribute("aria-expanded", open ? "true" : "false");
  };
  var closeGroups = function (except) {
    groups.forEach(function (g) { if (g !== except) setGroup(g, false); });
  };
  groups.forEach(function (group) {
    var caret = group.querySelector(".nav-caret");
    var timer = null;
    caret.addEventListener("click", function () {
      var open = !group.classList.contains("open");
      closeGroups(group);
      setGroup(group, open);
    });
    group.addEventListener("mouseenter", function () {
      if (!desktop.matches || !finePointer) return;
      clearTimeout(timer);
      closeGroups(group);
      setGroup(group, true);
    });
    group.addEventListener("mouseleave", function () {
      if (!desktop.matches || !finePointer) return;
      timer = setTimeout(function () { setGroup(group, false); }, 140);
    });
    group.addEventListener("focusout", function (e) {
      if (desktop.matches && !group.contains(e.relatedTarget)) setGroup(group, false);
    });
  });
  document.addEventListener("click", function (e) {
    if (desktop.matches && !e.target.closest(".has-menu")) closeGroups(null);
  });

  /* ---- nouvelle version du site : la page ouverte se recharge UNE fois, au bon moment ----
     On compare le repère de la page à celui du fichier version.txt. Si le site a été republié,
     on attend que le visiteur quitte l'onglet ou s'arrête de lire : jamais de rechargement en pleine lecture. */
  (function () {
    var balise = document.querySelector('meta[name="devanture-version"]');
    if (!balise || !window.fetch) return;
    var actuelle = balise.getAttribute("content");
    var racine = document.querySelector('link[rel="stylesheet"][href*="style.css"]');
    var base = racine ? racine.getAttribute("href").replace(/style\.css.*$/, "") : "";
    var attendue = null, dernierGeste = Date.now();
    ["pointerdown", "keydown", "scroll", "touchstart"].forEach(function (e) {
      window.addEventListener(e, function () { dernierGeste = Date.now(); }, { passive: true });
    });
    var recharger = function () {
      if (!attendue) return;
      try { if (sessionStorage.getItem("devanture-recharge") === attendue) return; sessionStorage.setItem("devanture-recharge", attendue); } catch (e) {}
      location.reload();
    };
    var verifier = function () {
      if (document.hidden) return;
      fetch(base + "version.txt?t=" + Date.now(), { cache: "no-store" })
        .then(function (r) { return r.ok ? r.text() : null; })
        .then(function (t) {
          if (!t) return;
          t = t.trim();
          if (!t || t === actuelle) return;
          attendue = t;
          if (Date.now() - dernierGeste > 45000) recharger();  // page laissée de côté : on rafraîchit tout de suite
        })
        .catch(function () {});
    };
    setInterval(verifier, 300000);          // une vérification toutes les 5 minutes
    setTimeout(verifier, 20000);            // et une première, 20 secondes après l'arrivée
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) return;
      if (attendue) recharger(); else verifier();   // au retour sur l'onglet, c'est le meilleur moment
    });
  })();

  /* ---- page Tarifs sur téléphone : le carrousel s'ouvre sur l'offre recommandée ----
     Elle est donc la première vue, et on peut glisser vers la gauche comme vers la droite. */
  (function () {
    var rail = document.querySelector(".pricing");
    if (!rail) return;
    var placer = function () {
      if (window.innerWidth > 700) { rail.scrollLeft = 0; return; }
      var mise = rail.querySelector(".price-card.featured");
      if (!mise) return;
      rail.scrollLeft = mise.offsetLeft - (rail.clientWidth - mise.clientWidth) / 2;
    };
    placer();
    window.addEventListener("load", placer);
    window.addEventListener("resize", placer);
  })();

  /* ---- panneau mobile ---- */
  var burger = document.getElementById("burger");
  var panel = document.getElementById("navPanel");
  var setPanel = function (open) {
    if (!burger || !panel) return;
    panel.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open) closeGroups(null);
  };
  if (burger && panel) {
    burger.addEventListener("click", function () {
      setPanel(!panel.classList.contains("open"));
    });
    panel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function (e) {
        setPanel(false);
        // lien vers une section de la page affichée : on défile nous-mêmes, une fois le panneau refermé
        var url = new URL(a.href, location.href);
        var cible = url.hash && url.pathname === location.pathname && document.getElementById(url.hash.slice(1));
        if (!cible) return;
        e.preventDefault();
        history.pushState(null, "", url.hash);
        setTimeout(function () { cible.scrollIntoView({ block: "start" }); }, 30);
      });
    });
    desktop.addEventListener("change", function () { setPanel(false); });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var opened = document.querySelector(".has-menu.open .nav-caret");
    closeGroups(null);
    if (opened && desktop.matches) opened.focus();
    else setPanel(false);
  });

  /* ---- apparition au défilement : le contenu ne dépend JAMAIS de l'animation ----
     trois garde-fous : seuls les éléments sous la ligne de flottaison sont masqués,
     le moindre pixel visible déclenche l'apparition, et tout est libéré après 3 s. */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (reduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    revealEls.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in");
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) {
      if (!el.classList.contains("in")) io.observe(el);
    });
    setTimeout(function () {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    }, 3000);
  }

  if (!reduced && finePointer) {
    /* ---- halo lumineux qui suit le curseur sur les cartes ---- */
    Array.prototype.slice.call(document.querySelectorAll(".glow")).forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });

    /* ---- légère inclinaison 3D au survol (fenêtre du hero, exemples, offre mise en avant) ---- */
    Array.prototype.slice.call(document.querySelectorAll(".tilt")).forEach(function (el) {
      var frame = null;
      el.addEventListener("mousemove", function (e) {
        if (frame) return;
        frame = requestAnimationFrame(function () {
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform = "perspective(900px) rotateX(" + (py * -5) + "deg) rotateY(" + (px * 5) + "deg)";
          frame = null;
        });
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }
})();
