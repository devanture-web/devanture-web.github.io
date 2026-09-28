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

/* Accueil : le mot qui tourne dans le titre, et une vraie démo qui défile
   dans la fenêtre du héros à la place de la maquette dessinée (24/09/2026).
   Rien ne se charge tant que la fenêtre n'est pas à l'écran, et rien sur téléphone. */
(function () {
  var doux = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* La phrase entière du titre tourne : site internet, application, agent IA.
     Le premier texte reste dans le HTML, c'est celui que lisent Google et les IA. */
  var phrase = document.querySelector('.phrase');
  if (phrase && !doux) {
    var textes = [phrase.innerHTML].concat(
      (phrase.getAttribute('data-phrases') || '').split('|||').filter(Boolean));
    if (textes.length > 1) {
      var p = 0;
      /* La phrase du site internet reste affichée plus longtemps que les deux autres :
         c'est l'offre principale, les applications et les agents IA sont des compléments. */
      var duree = function (i) { return i === 0 ? 6000 : 3600; };
      var gele = false;
      var titre = phrase.closest('h1') || phrase;

      /* Les trois phrases n'ont pas la même longueur : sans hauteur figée, le titre
         passe de 3 à 4 lignes et toute la page saute. On mesure la plus haute des
         trois à la largeur courante, et on réserve cette place une fois pour toutes. */
      var caler = function () {
        var memo = phrase.innerHTML;
        titre.style.minHeight = '';
        var maxi = 0;
        textes.forEach(function (t) {
          phrase.innerHTML = t;
          if (titre.offsetHeight > maxi) maxi = titre.offsetHeight;
        });
        phrase.innerHTML = memo;
        titre.style.minHeight = maxi + 'px';
      };
      caler();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(caler);
      var minuteur = null;
      window.addEventListener('resize', function () {
        clearTimeout(minuteur);
        minuteur = setTimeout(caler, 200);
      });
      titre.addEventListener('mouseenter', function () { gele = true; });
      titre.addEventListener('mouseleave', function () { gele = false; });
      titre.addEventListener('focusin', function () { gele = true; });
      titre.addEventListener('focusout', function () { gele = false; });
      var tourner = function () {
        if (gele) { setTimeout(tourner, 500); return; }
        p = (p + 1) % textes.length;
        phrase.classList.add('sort');
        setTimeout(function () {
          phrase.innerHTML = textes[p];
          phrase.classList.remove('sort');
          phrase.classList.add('entre');
          setTimeout(function () { phrase.classList.remove('entre'); }, 380);
          window.dispatchEvent(new CustomEvent('devanture:phrase', { detail: p }));
          setTimeout(tourner, duree(p));
        }, 300);
      };
      setTimeout(tourner, duree(0));
    }
  }

  var mot = document.querySelector('.tournant');
  if (mot && !doux) {
    var mots = (mot.getAttribute('data-mots') || '').split('|').filter(Boolean);
    if (mots.length > 1) {
      var i = 0;
      setInterval(function () {
        i = (i + 1) % mots.length;
        mot.classList.add('sort');
        setTimeout(function () {
          mot.textContent = mots[i];
          mot.classList.remove('sort');
          mot.classList.add('entre');
          setTimeout(function () { mot.classList.remove('entre'); }, 340);
        }, 270);
      }, 2800);
    }
  }

  /* La fenêtre du héros redevient une maquette dessinée, mais elle change avec la phrase :
     un site, puis une application, puis un agent IA. Aux couleurs du site, donc rien ne jure. */
  var corps = Array.prototype.slice.call(document.querySelectorAll('.mock .body'));
  if (corps.length > 1) {
    window.addEventListener('devanture:phrase', function (e) {
      corps.forEach(function (c, k) { c.hidden = (k !== e.detail % corps.length); });
    });
  }
})();

/* Chiffres clés de l'accueil : ils comptent depuis zéro quand ils arrivent à l'écran.
   Seule la partie numérique compte (« 1 mois » compte le 1, garde « mois »). */
(function () {
  var cles = Array.prototype.slice.call(document.querySelectorAll('[data-compte]'));
  if (!cles.length || !window.IntersectionObserver) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  cles.forEach(function (el) {
    var brut = el.getAttribute('data-compte');
    var m = brut.match(/^(\d+)(.*)$/);
    if (!m) return;
    var cible = parseInt(m[1], 10), suite = m[2];
    if (cible === 0) return;
    var obs = new IntersectionObserver(function (e) {
      if (!e[0].isIntersecting) return;
      obs.disconnect();
      var t0 = null, duree = 900;
      var pas = function (t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / duree);
        k = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(cible * k) + suite;
        if (k < 1) requestAnimationFrame(pas);
      };
      el.textContent = '0' + suite;
      requestAnimationFrame(pas);
      /* Filet de sécurité : si l'animation est freinée (onglet en arrière-plan),
         la vraie valeur s'affiche quand même. */
      setTimeout(function () { el.textContent = brut; }, duree + 250);
    }, { threshold: 0.6 });
    obs.observe(el);
  });
})();

/* Page Contact : configurateur de projet en 5 étapes, envoyé en TICKET (24/09/2026).
   Le formulaire part vers FormSubmit, qui le transmet à la boîte de Paul-Emile et envoie
   au visiteur une copie avec son numéro de ticket. Les photos sont réduites avant l'envoi
   (FormSubmit accepte 10 Mo au total). */
(function () {
  var f = document.querySelector('.compo');
  if (!f) return;
  var D;
  try { D = JSON.parse(f.querySelector('.compo-donnees').textContent); } catch (e) { return; }
  var M = D.mail;
  var panneaux = Array.prototype.slice.call(f.querySelectorAll('.compo-panneau'));
  var pastilles = Array.prototype.slice.call(f.querySelectorAll('.compo-etape'));
  var prec = f.querySelector('[data-compo-prec]');
  var suiv = f.querySelector('[data-compo-suiv]');
  var recap = f.querySelector('.compo-recap');
  var zone = f.querySelector('.compo-texte');
  var depot = f.querySelector('.compo-depot');
  var entree = f.querySelector('input[name="attachment"]');
  var vignettes = f.querySelector('.compo-vignettes');
  var noteDepot = f.querySelector('[data-depot-note]');
  var etape = 0, retouche = false, photos = [];
  var MAX_TOTAL = 9.5 * 1024 * 1024, MAX_PHOTOS = 8;

  /* Retour de FormSubmit : ?ticket=... => écran de confirmation */
  var retour = new URLSearchParams(location.search).get('ticket');
  if (retour && /^DEV-[0-9A-Z-]{6,20}$/.test(retour)) {
    Array.prototype.slice.call(f.children).forEach(function (x) {
      if (!x.classList.contains('compo-ok') && x.tagName !== 'INPUT' && x.tagName !== 'SCRIPT') x.hidden = true;
    });
    var ok = f.querySelector('.compo-ok');
    ok.hidden = false;
    ok.querySelector('[data-ok-texte]').textContent = D.ok_p.replace('{ticket}', retour);
    ok.querySelector('[data-ok-nouveau]').href = location.pathname + '#rdv';
    setTimeout(function () { f.scrollIntoView({ block: 'center' }); }, 300);
    return;
  }

  var un = function (n) { var x = f.querySelector('input[name="' + n + '"]:checked'); return x ? x.value : ''; };
  var plusieurs = function (n) {
    return Array.prototype.slice.call(f.querySelectorAll('input[name="' + n + '"]:checked')).map(function (x) { return x.value; });
  };
  var liste = function (t) {
    return t.length < 2 ? t.join('') : t.slice(0, -1).join(', ') + ' ' + M.et + ' ' + t[t.length - 1];
  };

  var adapter = function () {
    var p = un('projet');
    Array.prototype.slice.call(f.querySelectorAll('[data-si]')).forEach(function (b) {
      b.hidden = b.getAttribute('data-si') !== p;
    });
    Array.prototype.slice.call(f.querySelectorAll('[data-plus]')).forEach(function (b) {
      var cache = b.getAttribute('data-plus') === p;
      b.hidden = cache;
      if (cache) b.querySelector('input').checked = false;
    });
    var aSite = p === 'site' || plusieurs('plus').indexOf('site') !== -1;
    var photo = f.querySelector('[data-si-photo]');
    photo.hidden = !aSite;
    if (!aSite) photo.querySelector('input').checked = false;
    var autre = f.querySelector('[data-si-autre]');
    autre.hidden = plusieurs('agent').indexOf('autre') === -1;
    var nat = f.querySelector('[data-si-langues]');
    nat.hidden = un('langues') === '1' || un('langues') === '';
    if (nat.hidden) nat.querySelector('input').checked = false;
  };

  var resume = function () {
    var p = un('projet'), bouts = [D.projets[p]];
    if (p === 'site') {
      bouts.push(D.recap.pages.replace('{x}', f.querySelector('input[name="pages"]:checked + span').textContent));
      var l = un('langues');
      bouts.push(l === '1' ? D.recap.langues1 : D.recap.languesN.replace('{x}', l === '3' ? '3+' : l));
    }
    plusieurs('plus').forEach(function (k) { bouts.push('+ ' + D.projets[k]); });
    bouts.push(D.recap.delai.replace('{x}', un('delai')));
    recap.textContent = bouts.join('  ·  ');
  };

  var rediger = function () {
    var p = un('projet');
    var act = (f.querySelector('input[name="activite"]').value || '').trim();
    var L = [M.bonjour, '', M.intro.replace('{projet}', M.projet[p]).replace('{activite}', act ? M.pour.replace('{x}', act) : '')];
    if (p === 'site') {
      L.push(M[un('site')]);
      L.push(M.pages.replace('{pages}', M.pages_v[un('pages')]).replace('{langues}', M.langues_v[un('langues')]));
      if (f.querySelector('input[name="natifs"]').checked) L.push(M.natifs);
    } else if (p === 'agent') {
      var prec2 = (f.querySelector('input[name="autre"]').value || '').trim();
      var u = plusieurs('agent').map(function (k) { return k === 'autre' && prec2 ? prec2 : M.agents_v[k]; });
      if (u.length) L.push(M.agent.replace('{liste}', liste(u)));
    } else {
      L.push(M.app.replace('{pour}', M.app_pour_v[un('app_pour')]).replace('{ou}', M.app_ou_v[un('app_ou')]));
    }
    var pl = plusieurs('plus').map(function (k) { return M.plus_v[k]; });
    if (pl.length) L.push(M.plus.replace('{liste}', liste(pl)));
    if (f.querySelector('input[name="photo"]').checked) L.push(M.photo);
    L.push(M.delai[un('delai')]);
    if (photos.length) L.push(photos.length === 1 ? M.photos1 : M.photosN.replace('{n}', photos.length));
    L.push('', M.fin, '', M.merci);
    return L.join('\n');
  };

  var tout = function () {
    adapter();
    resume();
    if (!retouche) zone.value = rediger();
  };

  var aller = function (n) {
    etape = Math.max(0, Math.min(panneaux.length - 1, n));
    panneaux.forEach(function (x, k) { x.hidden = k !== etape; });
    pastilles.forEach(function (x, k) {
      x.classList.toggle('actif', k === etape);
      x.classList.toggle('fait', k < etape);
    });
    prec.style.visibility = etape === 0 ? 'hidden' : 'visible';
    suiv.hidden = etape === panneaux.length - 1;
  };

  /* Photos : réduites à 1600 px de côté en JPEG, ce qui fait passer une photo de
     téléphone de 4 Mo à environ 300 Ko, et en autorise plusieurs sous la limite de 10 Mo. */
  var reduire = function (fi) {
    return new Promise(function (ok) {
      var img = new Image();
      var url = URL.createObjectURL(fi);
      img.onload = function () {
        var k = Math.min(1, 1600 / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          if (!b || b.size >= fi.size) return ok(fi);
          ok(new File([b], fi.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(url); ok(fi); };
      img.src = url;
    });
  };
  var poids = function () { return photos.reduce(function (t, x) { return t + x.size; }, 0); };
  var montrer = function () {
    vignettes.innerHTML = '';
    photos.forEach(function (fi, k) {
      var d = document.createElement('div');
      d.className = 'compo-vignette';
      var img = document.createElement('img');
      img.alt = fi.name;
      img.src = URL.createObjectURL(fi);
      img.onload = function () { URL.revokeObjectURL(img.src); };
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', D.retirer + ' ' + fi.name);
      b.textContent = '×';
      b.addEventListener('click', function () { photos.splice(k, 1); montrer(); retouche = false; tout(); });
      d.appendChild(img); d.appendChild(b);
      vignettes.appendChild(d);
    });
  };
  var ajouter = function (liste_) {
    var fichiers = Array.prototype.slice.call(liste_).filter(function (fi) { return /^image\//.test(fi.type); });
    Promise.all(fichiers.map(reduire)).then(function (reduits) {
      var refus = false;
      reduits.forEach(function (fi) {
        if (photos.length >= MAX_PHOTOS || poids() + fi.size > MAX_TOTAL) { refus = true; return; }
        photos.push(fi);
      });
      montrer();
      noteDepot.hidden = !refus;
      noteDepot.textContent = D.depot_trop;
      retouche = false; tout();
    });
  };
  entree.addEventListener('change', function () { ajouter(entree.files); entree.value = ''; });
  ['dragenter', 'dragover'].forEach(function (t) {
    depot.addEventListener(t, function (e) { e.preventDefault(); depot.classList.add('survol'); });
  });
  ['dragleave', 'drop'].forEach(function (t) {
    depot.addEventListener(t, function (e) { e.preventDefault(); depot.classList.remove('survol'); });
  });
  depot.addEventListener('drop', function (e) { if (e.dataTransfer) ajouter(e.dataTransfer.files); });

  f.addEventListener('change', function (e) {
    if (e.target.name === 'message' || e.target.name === 'attachment' || /^(prenom|nom|email|telephone)$/.test(e.target.name)) return;
    retouche = false;
    tout();
  });
  f.querySelector('input[name="activite"]').addEventListener('input', function () { retouche = false; tout(); });
  f.querySelector('input[name="autre"]').addEventListener('input', function () { retouche = false; tout(); });
  zone.addEventListener('input', function () { retouche = true; });
  prec.addEventListener('click', function () { aller(etape - 1); });
  suiv.addEventListener('click', function () { aller(etape + 1); });
  pastilles.forEach(function (x) { x.addEventListener('click', function () { aller(+x.getAttribute('data-aller')); }); });

  /* Entrée dans un champ avant la dernière étape : on passe à l'étape suivante au lieu d'envoyer. */
  f.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && etape < panneaux.length - 1) {
      e.preventDefault();
      aller(etape + 1);
    }
  });

  /* Envoi : numéro de ticket, objet, retour vers la page, et on n'envoie que les champs utiles. */
  f.addEventListener('submit', function () {
    var d = new Date();
    var jour = String(d.getFullYear()).slice(2) + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
    var alea = Math.random().toString(36).slice(2, 6).toUpperCase();
    var ticket = 'DEV-' + jour + '-' + alea;
    var p = un('projet');
    f.querySelector('input[name="ticket"]').value = ticket;
    f.querySelector('input[name="recapitulatif"]').value = recap.textContent;
    f.querySelector('input[name="_subject"]').value = D.sujet.replace('{ticket}', ticket).replace('{projet}', M.projet[p]);
    f.querySelector('input[name="_autoresponse"]').value = D.auto.replace('{ticket}', ticket);
    f.querySelector('input[name="_next"]').value = location.origin + location.pathname + '?ticket=' + ticket + '#rdv';
    /* Les questions qui ne concernent pas le projet choisi ne partent pas */
    Array.prototype.slice.call(f.querySelectorAll('[data-si][hidden] input, [data-si-autre][hidden], [data-plus][hidden] input'))
      .forEach(function (x) { x.disabled = true; });
    if (photos.length && window.DataTransfer) {
      var dt = new DataTransfer();
      photos.forEach(function (x) { dt.items.add(x); });
      entree.files = dt.files;
    }
  });

  tout();
  aller(0);
})();

/* Changer de langue sans remonter en haut (24/09/2026, demande de Paul-Emile).
   Les pages françaises et anglaises ont exactement la même structure : on retient
   dans quelle section on se trouve et à quelle hauteur dedans, puis on y revient
   sur la page de l'autre langue. Mémoire de 15 secondes seulement. */
(function () {
  var CLE = 'devanture-langue-pos';
  var blocs = function () {
    var m = document.querySelector('main');
    return m ? Array.prototype.slice.call(m.children).filter(function (x) { return x.offsetHeight > 0; }) : [];
  };
  var REPERE = 90;

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[hreflang]');
    if (!a || a.hreflang === document.documentElement.lang) return;
    var b = blocs(), k = -1, r = 0;
    for (var i = 0; i < b.length; i++) {
      var box = b[i].getBoundingClientRect();
      if (box.top <= REPERE && box.bottom > REPERE) { k = i; r = (REPERE - box.top) / box.height; break; }
    }
    try {
      sessionStorage.setItem(CLE, JSON.stringify({ k: k, r: r, y: window.scrollY, t: Date.now() }));
    } catch (err) {}
  });

  var pos = null;
  try { pos = JSON.parse(sessionStorage.getItem(CLE) || 'null'); sessionStorage.removeItem(CLE); } catch (err) {}
  if (!pos || Date.now() - pos.t > 15000 || location.hash) return;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  var aller = function () {
    var b = blocs(), y = pos.y;
    if (pos.k >= 0 && b[pos.k]) {
      var box = b[pos.k].getBoundingClientRect();
      y = box.top + window.scrollY + pos.r * box.height - REPERE;
    }
    var avant = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, Math.max(0, y));
    document.documentElement.style.scrollBehavior = avant;
  };
  var touche = false;
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (t) {
    window.addEventListener(t, function () { touche = true; }, { once: true, passive: true });
  });
  var recaler = function () { if (!touche) aller(); };
  aller();
  /* les polices et les images peuvent encore décaler la page : on recale une fois tout chargé,
     sauf si le visiteur a déjà commencé à faire défiler la page lui-même */
  window.addEventListener('load', recaler);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(recaler);
})();
