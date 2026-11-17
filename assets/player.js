// Speler: laadt content/<id>.js, toont schermen, speelt audio af (of telt leestijd af) en gaat automatisch verder.
(function () {
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const modId = (params.get("m") || "m1").toLowerCase();
  const WPM = 130; // gesproken woorden per minuut bij snelheid 1×
  const meta = CURSUS.modules.find((m) => m.id === modId) || { bouwt: [] };
  if (meta.klaar === false) { document.addEventListener("DOMContentLoaded", () => { $("titel").textContent = "Deze module is nog niet beschikbaar."; $("modtitel").textContent = ""; }); return; }

  const st = { mod: null, i: 0, speelt: false, gestart: false, snelheid: Opslag.lees("snelheid", 1), timer: null, t0: 0, duur: 0, rest: 0, raf: null, bron: null };
  const audio = new Audio();
  let audioOk = false;

  // ---------- Laden ----------
  const s = document.createElement("script");
  s.src = "content/" + modId + ".js?v=" + (window.CURSUS.versie || "");
  s.onload = start;
  s.onerror = () => { $("titel").textContent = "Deze module is nog niet beschikbaar."; $("modtitel").textContent = ""; };
  document.head.appendChild(s);

  function start() {
    st.mod = window.MODULES[modId];
    if (!st.mod) { $("titel").textContent = "Deze module is nog niet beschikbaar."; return; }
    st.mod = vulData(st.mod);
    st.eersteEchte = st.mod.slides[0].id;
    const vraagScherm = vraagSchermMaken();
    if (vraagScherm) st.mod.slides.unshift(vraagScherm);
    if (window.FASEN[modId]) window.FASEN[modId] = vulData(window.FASEN[modId]);
    document.title = st.mod.nummer + " – " + st.mod.titel;
    $("modnr").textContent = st.mod.nummer;
    $("modtitel").textContent = st.mod.titel + (meta.voltooid ? " (reeds voltooid)" : "");
    $("snelheid").value = String(st.snelheid);
    tekenRail();
    initFase();
    const bewaard = Opslag.lees("pos." + modId, 0);
    toon(Math.min(bewaard, st.mod.slides.length - 1), false);
  }

  // ---------- Openingsscherm: de onderzoeksvraag waarop deze module steunt ----------
  function vraagSchermMaken() {
    const vragen = CURSUS.vragen || [];
    if (!vragen.length || !meta.vraag || meta.voltooid) return null;
    const basis = vragen.find((v) => v.id === meta.vraag) || vragen[0];
    const laatste = vragen[vragen.length - 1];
    const gewijzigd = basis.id !== laatste.id;
    const vanaf = CURSUS.modules.find((m) => m.vraag === laatste.id);
    const waarschuwing = gewijzigd ? `<div class="waarschuwing"><b>Opgelet: jullie onderzoeksvraag werd nadien gewijzigd naar:</b>
        <p class="nieuwevraag">${esc(laatste.tekst)}</p>
        ${laatste.toelichting ? `<p>${esc(laatste.toelichting)}</p>` : ""}
        <p>Deze module blijft gebaseerd op de vraag hierboven. ${vanaf ? `Vanaf ${esc(vanaf.nr)} bouwen we verder op de nieuwe onderzoeksvraag.` : "De volgende modules worden aangepast aan de nieuwe onderzoeksvraag."} Neem uit deze module de werkwijze mee, en pas wat je invulde aan de nieuwe vraag aan.</p></div>` : "";
    return {
      id: modId + "-00", sectie: "Vertrekpunt", stap: "Onderzoeksvraag", titel: "De onderzoeksvraag waarop deze module steunt",
      visual: `<div class="kernzin">${esc(basis.tekst)}</div><p class="vraagmeta">Type vraag: ${esc(basis.type || "")}</p>${waarschuwing}`,
      spreektekst: "Deze module steunt op jullie onderzoeksvraag, zoals ze op het scherm staat. De voorbeelden en oefeningen zijn op die vraag geschreven. Verandert jullie vraag, dan geef je dat door; de modules die daarna komen, worden dan aangepast aan de nieuwe vraag. Een melding op dit scherm toont het wanneer dat gebeurde.",
      bronnen: [], oefening: null, virtueel: true
    };
  }

  function vulData(o) {
    if (typeof o === "string") return metData(o);
    if (Array.isArray(o)) return o.map(vulData);
    if (o && typeof o === "object") { const r = {}; for (const k in o) r[k] = vulData(o[k]); return r; }
    return o;
  }

  // ---------- Fase (inlevermoment) ----------
  function initFase() {
    const sel = $("faseKeuze");
    sel.replaceChildren(...CURSUS.fasen.map((f) => new Option(f.naam + (f.id === Fase.automatisch() ? " (nu volgens de datum)" : ""), f.id)));
    sel.value = Fase.huidig();
    $("faseWanneer").textContent = "Inleveren: " + Fase.info().wanneer;
    $("enkelNu").checked = !!Opslag.lees("enkelNu", false);
    sel.onchange = () => { Fase.kies(sel.value); $("faseWanneer").textContent = "Inleveren: " + Fase.info().wanneer; toon(st.i, false); };
    $("enkelNu").onchange = (e) => { Opslag.schrijf("enkelNu", e.target.checked); toon(st.i, false); };
  }
  function etiket(sl) { return Fase.slide(modId, sl.id); }
  function isLater(sl) { return !sl.virtueel && Fase.label(etiket(sl).fase).later; }
  function overslaan(sl) {
    if (!Opslag.lees("enkelNu", false)) return false;
    const F = window.FASEN[modId] || {};
    // Module die voor nu niets oplevert: enkel het eerste scherm (met het startkader) blijft.
    if (sl.virtueel) return false;
    if (F.overslaanMetKnop && Fase.huidig() === "fm1") return sl.id !== st.eersteEchte;
    return isLater(sl);
  }
  function volgendeIndex(i, stap) {
    const n = st.mod.slides.length;
    for (let j = i + stap; j >= 0 && j < n; j += stap) if (!overslaan(st.mod.slides[j])) return j;
    return -1;
  }

  // ---------- Rail ----------
  function tekenRail() {
    $("blad").innerHTML = CURSUS.bouwstenen.map((b) => {
      const klaar = CURSUS.modules.filter((m) => m.bouwt.includes(b.id)).every((m) => Opslag.klaar(m.id));
      const cls = meta.bouwt.includes(b.id) ? "hier" : (klaar ? "klaar" : "");
      return `<div class="regel ${cls}"><span>${b.tekst}</span></div>`;
    }).join("");
    $("stappenlijst").innerHTML = CURSUS.modules.map((m) =>
      `<li><a href="${m.klaar ? "module.html?m=" + m.id : "#"}" class="${m.id === modId ? "actief" : ""}" ${m.klaar ? "" : 'aria-disabled="true"'}>${m.nr} ${m.titel}${m.voltooid ? " ✓" : ""}</a></li>`).join("");
  }

  // ---------- Scherm tonen ----------
  function toon(i, autoSpelen) {
    stopKlok();
    audio.pause();
    st.i = i;
    Opslag.schrijf("pos." + modId, i);
    const sl = st.mod.slides[i];
    const laatste = volgendeIndex(i, 1) < 0; // laatste scherm dat de cursist te zien krijgt (ook met "Enkel wat nu nodig is")
    const scherm = $("scherm");
    scherm.classList.remove("wissel"); void scherm.offsetWidth; scherm.classList.add("wissel");
    $("sectie").textContent = sl.stap || sl.sectie || "";
    $("sectie").dataset.s = sl.sectie || "";
    $("titel").textContent = sl.titel || "";
    tekenOverzicht(sl);
    const et = etiket(sl), lab = Fase.label(et.fase);
    $("faseBadge").className = "fase-badge " + lab.cls;
    $("faseBadge").textContent = lab.tekst;
    const reden = et.reden && lab.cls !== "nu" ? `<span class="fase-reden">${esc(et.reden)}</span>` : "";
    $("visual").innerHTML = reden + (sl.visual || "") + (sl.id === st.eersteEchte ? startkaderHTML() + moduleOverslaanHTML() : "") + schermVeldenHTML(sl) + oefeningHTML(sl) + opdrachtHTML(i) + (laatste ? eindeHTML() : "");
    if (sl.oefening) $("visual").querySelectorAll(".vraag").forEach((el) => el.remove()); // vraag staat al in de oefening
    tekenBronnen(sl);
    $("spreektekst").textContent = sl.spreektekst || "";
    $("teller").textContent = (i + 1) + " / " + st.mod.slides.length;
    $("vorige").disabled = volgendeIndex(i, -1) < 0;
    $("volgende").disabled = volgendeIndex(i, 1) < 0;
    $("balk").style.width = "0%";
    koppelOefening(sl);
    koppelWerkvelden();
    koppelSchermVelden(sl);
    if (laatste) { Opslag.schrijf("klaar." + modId, true); tekenRail(); }
    laadAudio(sl);
    if (autoSpelen) speel(); else zetKnop();
  }

  // ---------- Overzicht: alle deelstappen, de huidige gemarkeerd ----------
  function tekenOverzicht(sl) {
    const ov = st.mod.overzicht || [];
    if (!ov.length) { $("overzicht").hidden = true; return; }
    const m = /Stap\s+([\d.]+)/.exec(sl.stap || "");
    const huidig = m ? m[1] : null;
    const pos = huidig ? ov.findIndex((x) => x.id === huidig) : -1;
    const eersteHier = ov.findIndex((x) => x.module === modId);
    $("overzicht").hidden = false;
    $("overzicht").innerHTML = ov.map((x, k) => {
      let cls = x.module && x.module !== modId ? (k < eersteHier ? "gedaan" : "later") : "";
      if (pos >= 0) { if (k < pos) cls = "gedaan"; if (k === pos) cls = "hier"; }
      else if (!x.module || x.module === modId) cls = cls || "";
      const vanStap = st.mod.slides.filter((s) => new RegExp("Stap\\s+" + x.id.replace(".", "\\.") + "\\b").test(s.stap || ""));
      if (vanStap.length && vanStap.every(isLater)) cls += " laterfase";
      return `<li class="${cls}"${k === pos ? ' aria-current="step"' : ""} title="${vanStap.length && vanStap.every(isLater) ? "Voor later" : ""}">${x.id} ${x.label}</li>`;
    }).join("");
  }

  // ---------- Bronnen: compacte knoppen, inklapbaar paneel onderaan ----------
  function bronLabel(b) {
    const kort = { les1: "Les 1", les2: "Les 2", les3: "Les 3", fm1: "Feedbackmoment", schrijven: "Academisch schrijven" }[b.bestand] || b.label;
    return b.onderwerp ? kort + ": " + b.onderwerp : b.label;
  }
  function tekenBronnen(sl) {
    sluitBron();
    $("bronnen").innerHTML = (sl.bronnen || []).map((b, k) => CURSUS.bronnen[b.bestand]
      ? `<button class="bronknop" data-k="${k}" aria-expanded="false" title="${CURSUS.bronnen[b.bestand].naam}${b.label ? " – " + b.label : ""}">${bronLabel(b)}</button>` : "").join("");
    document.querySelectorAll(".bronknop").forEach((knop) => knop.onclick = () => {
      const b = sl.bronnen[+knop.dataset.k];
      if (st.bron === knop.dataset.k) { sluitBron(); return; }
      openBron(b, knop);
    });
  }
  function openBron(b, knop) {
    const bron = CURSUS.bronnen[b.bestand];
    const url = bron.pad + "#page=" + (b.pagina || 1);
    document.querySelectorAll(".bronknop").forEach((x) => x.setAttribute("aria-expanded", "false"));
    knop.setAttribute("aria-expanded", "true");
    st.bron = knop.dataset.k;
    $("bronnaam").textContent = bron.naam + (b.label ? " – " + b.label : "");
    $("bronextern").href = url;
    $("bronpaneel").hidden = false;
    // Telkens een nieuw iframe, pas nadat het paneel zichtbaar is: anders blijft de pdf-viewer de eerste keer leeg.
    const houder = $("bronhouder"); houder.innerHTML = "";
    requestAnimationFrame(() => {
      const f = document.createElement("iframe"); f.title = "Lesbron"; f.src = url; houder.appendChild(f);
      $("bronpaneel").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  function sluitBron() {
    st.bron = null;
    $("bronpaneel").hidden = true;
    $("bronhouder").innerHTML = "";
    document.querySelectorAll(".bronknop").forEach((x) => x.setAttribute("aria-expanded", "false"));
  }
  $("bronsluit").onclick = sluitBron;

  // ---------- Audio of leestijd ----------
  function laadAudio(sl) {
    audioOk = false;
    $("audiostatus").textContent = "";
    if (meta.voltooid || !CURSUS.audio) { audio.removeAttribute("src"); return; }
    audio.src = "audio/" + sl.id + ".mp3";
    audio.playbackRate = st.snelheid;
    audio.oncanplay = () => { audioOk = true; };
    audio.onerror = () => { audioOk = false; $("audiostatus").textContent = "(audio volgt: tekstmodus)"; };
    audio.load();
  }
  function woorden(t) { return (t || "").trim().split(/\s+/).filter(Boolean).length; }

  function speel() {
    st.speelt = true; st.gestart = true; zetKnop();
    const sl = st.mod.slides[st.i];
    if (CURSUS.audio && !meta.voltooid && (audioOk || audio.readyState >= 2)) {
      audio.playbackRate = st.snelheid;
      audio.play().catch(() => leesKlok(sl));
      audio.ontimeupdate = () => { if (audio.duration) $("balk").style.width = (100 * audio.currentTime / audio.duration) + "%"; };
      audio.onended = einde;
    } else {
      leesKlok(sl);
    }
  }
  function leesKlok(sl) {
    if (!st.rest) st.duur = Math.max(4000, (woorden(sl.spreektekst) / WPM) * 60000 / st.snelheid);
    const looptijd = st.rest || st.duur;
    st.t0 = performance.now();
    st.timer = setTimeout(einde, looptijd);
    const tik = () => {
      const verstreken = (st.duur - looptijd) + (performance.now() - st.t0);
      $("balk").style.width = Math.min(100, 100 * verstreken / st.duur) + "%";
      st.raf = requestAnimationFrame(tik);
    };
    tik();
  }
  function pauzeer() {
    st.speelt = false; zetKnop();
    if (!audio.paused) { audio.pause(); return; }
    if (st.timer) {
      const rest = (st.rest || st.duur) - (performance.now() - st.t0);
      stopKlok(); st.rest = Math.max(0, rest);
    }
  }
  function stopKlok() { clearTimeout(st.timer); cancelAnimationFrame(st.raf); st.timer = null; st.rest = 0; }
  function einde() {
    stopKlok();
    $("balk").style.width = "100%";
    const sl = st.mod.slides[st.i];
    const laatste = volgendeIndex(st.i, 1) < 0;
    // Bij een oefening of de opdracht wacht de speler op de cursist; op het einde stopt hij.
    if (sl.oefening || sl.sectie === "Opdracht" || laatste) { st.speelt = false; zetKnop(); return; }
    const j = volgendeIndex(st.i, 1);
    if (j < 0) { st.speelt = false; zetKnop(); return; }
    toon(j, true);
  }
  function zetKnop() {
    $("speel").textContent = st.speelt ? "❚❚ Pauze" : (st.gestart ? "▶ Verder" : "▶ Start");
  }

  // ---------- Oefeningen ----------
  function oefeningHTML(sl) {
    const o = sl.oefening; if (!o) return "";
    const kop = `<div class="oefening" id="oef"><div class="ovraag">${o.vraag}</div>`;
    if (o.type === "keuze") {
      return kop + o.opties.map((op, k) => `<button class="optie" data-k="${k}">${op.tekst}</button>`).join("") + `<div class="feedback" id="fb" hidden></div></div>`;
    }
    if (o.type === "sorteer") {
      const opts = ['<option value="">Kies…</option>'].concat(o.categorieen.map((c) => `<option>${c}</option>`)).join("");
      // Items in een vaste, door elkaar geschudde volgorde (zelfde volgorde bij elk bezoek), zodat de volgorde het antwoord niet verraadt.
      const volgorde = o.items.map((_, k) => k).sort((a, b) => hash(sl.id + a) - hash(sl.id + b));
      return kop + `<div class="sorteer">` + volgorde.map((k) => `<div class="item" data-k="${k}"><span>${o.items[k].tekst}</span><select aria-label="Categorie">${opts}</select></div>`).join("") +
        `</div><button class="knop" id="controleer">Controleer</button><div class="feedback" id="fb" hidden></div></div>`;
    }
    if (o.type === "reflectie") {
      return kop + `<textarea id="antw" placeholder="${esc(o.placeholder || "")}">${esc(Werk.tekst(modId + "." + sl.id))}</textarea>` +
        `<button class="knop" id="bewaar">Bewaar en toon terugkoppeling</button><div class="feedback" id="fb" hidden></div></div>`;
    }
    return "";
  }
  function koppelOefening(sl) {
    const o = sl.oefening; if (!o) return;
    const fb = $("fb");
    if (o.type === "keuze") {
      document.querySelectorAll(".optie").forEach((b) => b.onclick = () => {
        const op = o.opties[+b.dataset.k];
        document.querySelectorAll(".optie").forEach((x) => x.classList.remove("juist", "fout", "verdedigbaar"));
        b.classList.add(op.verdedigbaar ? "verdedigbaar" : (op.juist ? "juist" : "fout"));
        fb.hidden = false; fb.textContent = op.feedback || (op.juist ? "Juist." : "Nog niet.");
      });
    }
    if (o.type === "sorteer") {
      $("controleer").onclick = () => {
        let goed = 0;
        document.querySelectorAll(".sorteer .item").forEach((el) => {
          const ok = el.querySelector("select").value === o.items[+el.dataset.k].categorie;
          el.classList.toggle("juist", ok); el.classList.toggle("fout", !ok); if (ok) goed++;
        });
        fb.hidden = false; fb.textContent = goed + " van " + o.items.length + " juist. " + (o.feedback || "");
      };
    }
    if (o.type === "reflectie") {
      $("bewaar").onclick = () => {
        Werk.bewaar(modId + "." + sl.id, { mod: st.mod.nummer, bouwsteen: o.bouwsteen || "_", label: o.vraag, tekst: $("antw").value, fase: etiket(sl).fase });
        fb.hidden = false;
        fb.innerHTML = "<b>Bewaard in Mijn werk.</b> " + (o.modelantwoord ? "Toets je antwoord hieraan: " + o.modelantwoord : "");
      };
    }
  }

  // ---------- Opdracht (op het laatste opdrachtscherm) ----------
  function opdrachtHTML(i) {
    const sl = st.mod.slides; const o = st.mod.opdracht;
    if (!o || sl[i].sectie !== "Opdracht") return "";
    const laatsteOpdracht = sl.map((x) => x.sectie).lastIndexOf("Opdracht");
    if (i !== laatsteOpdracht) return "";
    const rubric = (o.rubric || []).map((r) => `<tr><td><b>${r.criterium}</b></td><td>${r.onvoldoende}</td><td>${r.voldoende}</td><td>${r.sterk}</td></tr>`).join("");
    const F = window.FASEN[modId] || {};
    const fStap = (k) => (F.stappen && F.stappen[k]) || "nu";
    const fVeld = (id) => (F.werkvelden && F.werkvelden[id]) || "nu";
    const velden = (o.werkvelden || []).filter((v) => !(Opslag.lees("enkelNu", false) && Fase.label(fVeld(v.id)).later)).map((v) => { const lab = Fase.label(fVeld(v.id)); return `<div class="werkveld ${lab.later ? "later" : ""}"><label for="wv-${v.id}"><span class="bs">${(CURSUS.bouwstenen.find((b) => b.id === v.bouwsteen) || { tekst: "Werkbestand" }).tekst}</span>${v.label} <span class="fase-badge ${lab.cls}">${lab.tekst}</span></label>
      <textarea id="wv-${v.id}" data-id="${v.id}" data-bs="${v.bouwsteen}" data-fase="${fVeld(v.id)}" data-label="${esc(v.label)}" placeholder="${esc(v.placeholder || "")}">${esc(Werk.tekst(modId + ".wv." + v.id))}</textarea>
      <small>Wordt automatisch bewaard in Mijn werk.</small></div>`; }).join("");
    const stappen = (o.stappen || []).map((x, k) => ({ x, k, lab: Fase.label(fStap(String(k))) }));
    const alleLater = stappen.length > 0 && stappen.every((y) => y.lab.later);
    if (alleLater && Opslag.lees("enkelNu", false)) {
      return `<div class="opdracht"><p><span class="fase-badge later">${esc(stappen[0].lab.tekst)}</span></p>
        <p>De opdracht van deze module heb je nu niet nodig. Zet "Enkel wat nu nodig is" uit als je ze toch wil bekijken.</p></div>`;
    }
    const nuStappen = stappen.filter((y) => !y.lab.later), laterStappen = stappen.filter((y) => y.lab.later);
    const stapLijst = (nuStappen.length ? `<h4 class="fasekop"><span class="fase-badge nu">Nu nodig</span> ${esc(Fase.info().naam)}</h4>
      <ol>${nuStappen.map((y) => `<li value="${y.k + 1}">${y.x}${y.lab.cls !== "nu" ? ` <span class="fase-badge ${y.lab.cls}">${y.lab.tekst}</span>` : ""}</li>`).join("")}</ol>` : "") + `
      ${laterStappen.length && !Opslag.lees("enkelNu", false) ? `<h4 class="fasekop"><span class="fase-badge later">Voor later</span></h4>
      <ol class="later">${laterStappen.map((y) => `<li value="${y.k + 1}">${y.x} <span class="fase-badge later">${y.lab.tekst.replace("Voor later: ", "")}</span></li>`).join("")}</ol>` : ""}`;
    return `<div class="opdracht"><p><b>Product:</b> ${o.product}${o.tijd ? " · <b>Tijd:</b> " + o.tijd : ""}</p>
      ${stapLijst}
      ${(o.checklist || []).length ? `<div class="checklist">${o.checklist.map((c) => `<div class="item">${c}</div>`).join("")}</div>` : ""}
      ${rubric && alleLater ? `<p><span class="fase-badge later">Rubric: ${esc(stappen[0].lab.tekst)}</span></p>` : ""}
      ${rubric ? `<table class="tabel rubric"><tr><th>Criterium</th><th>Onvoldoende</th><th>Voldoende</th><th>Sterk</th></tr>${rubric}</table>` : ""}
      ${velden ? `<h3 style="font-family:var(--serif);margin-top:1.5rem">Schrijf hier je voorstel</h3>${velden}` : ""}</div>`;
  }
  function koppelWerkvelden() {
    document.querySelectorAll(".werkveld textarea").forEach((ta) => {
      let t; ta.oninput = () => { clearTimeout(t); t = setTimeout(() =>
        Werk.bewaar(modId + ".wv." + ta.dataset.id, { mod: st.mod.nummer, bouwsteen: ta.dataset.bs, label: ta.dataset.label, tekst: ta.value, fase: ta.dataset.fase }), 400); };
    });
  }

  function moduleOverslaanHTML() {
    const F = window.FASEN[modId] || {};
    if (!(F.overslaanMetKnop && Opslag.lees("enkelNu", false) && Fase.huidig() === "fm1")) return "";
    return `<div class="feedback" style="margin-top:1rem"><b>Deze module heb je voor ${esc(Fase.info("fm1").naam.toLowerCase())} niet nodig.</b> Je kan meteen verder naar de volgende module. Zet "Enkel wat nu nodig is" uit als je ze toch wil volgen.</div>`;
  }

  // ---------- Invulvelden op een gewoon scherm (bv. het vraagprofiel) ----------
  function schermVeldenHTML(sl) {
    if (!sl.velden || !sl.velden.length) return "";
    const velden = sl.velden.map((v) => `<div class="werkveld"><label for="vp-${v.id}">${v.label}</label>
      <textarea id="vp-${v.id}" class="vp" data-id="${v.id}" data-bs="${v.bouwsteen}" data-label="${esc(v.label)}" placeholder="${esc(v.placeholder || "")}">${esc(Werk.tekst(modId + ".vp." + v.id))}</textarea></div>`).join("");
    return `<div class="opdracht" id="vraagprofiel">${velden}
      ${sl.downloadProfiel ? `<button class="knop" id="dlProfiel">Download vraagprofiel</button> <small>Wordt automatisch bewaard in Mijn werk.</small>` : ""}</div>`;
  }
  function koppelSchermVelden(sl) {
    document.querySelectorAll("textarea.vp").forEach((ta) => {
      let t; ta.oninput = () => { clearTimeout(t); t = setTimeout(() =>
        Werk.bewaar(modId + ".vp." + ta.dataset.id, { mod: st.mod.nummer, bouwsteen: ta.dataset.bs, label: ta.dataset.label, tekst: ta.value, fase: "nu" }), 300); };
    });
    const knop = document.getElementById("dlProfiel");
    if (knop) knop.onclick = () => {
      document.querySelectorAll("textarea.vp").forEach((ta) => Werk.bewaar(modId + ".vp." + ta.dataset.id, { mod: st.mod.nummer, bouwsteen: ta.dataset.bs, label: ta.dataset.label, tekst: ta.value, fase: "nu" }));
      if (!Werk.downloadProfiel(sl.velden)) toast("Vul eerst het vraagprofiel in.");
    };
  }

  // ---------- Startkader: wat wordt er verwacht, nu en later ----------
  function startkaderHTML() {
    const k = (window.FASEN[modId] || {}).startkader;
    if (!k) return "";
    const fase = Fase.huidig();
    const lijst = (arr) => `<ul>${arr.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
    const later = k.later || [];
    const naam = (id) => Fase.info(id).naam.toLowerCase();
    let nuKop = "Voor " + naam("fm1") + " (" + Fase.info("fm1").wanneer + ") lever je", nu = k.nu || [];
    let rest = later;
    if (fase !== "fm1") {
      nuKop = "Nu, voor de " + naam(fase) + " (" + Fase.info(fase).wanneer + ")";
      nu = later.filter((l) => l.maand === fase).map((l) => l.wat);
      rest = later.filter((l) => l.maand !== fase && (fase === "maart" ? l.maand === "mei" : false));
    }
    const basis = fase !== "fm1" ? `<div class="k-later"><h4>Basis uit ${naam("fm1")}: herneem</h4>${lijst(k.nu || [])}</div>` : "";
    return `<div class="startkader" id="startkader">
      <div class="k-nu"><h4>${nuKop}</h4>${nu.length ? lijst(nu) : "<p>Herneem en verfijn wat je eerder maakte.</p>"}</div>
      <div class="k-kennen"><h4>Zeker kennen</h4>${lijst(k.kennen || [])}</div>
      ${rest.length ? `<div class="k-later"><h4>Voor later</h4><ul>${rest.map((l) => `<li>${esc(l.wat)} <span class="fase-badge later">${esc(Fase.info(l.maand).wanneer)}</span></li>`).join("")}</ul></div>` : ""}
      ${basis}</div>`;
  }

  // ---------- Einde van de module ----------
  function eindeHTML() {
    const idx = CURSUS.modules.findIndex((m) => m.id === modId);
    const volgende = CURSUS.modules[idx + 1];
    const naar = volgende && volgende.klaar
      ? `<a class="knop" href="module.html?m=${volgende.id}">Verder naar ${volgende.nr}: ${volgende.titel}</a>`
      : (volgende ? `<span>${volgende.nr} komt binnenkort beschikbaar.</span>` : "");
    return `<div class="einde"><h4>Einde van ${st.mod.nummer}</h4>
      <p style="margin:0">Je hebt alle schermen van deze module doorlopen. Wat je invulde, staat in Mijn werk.</p>
      <div class="knoppen">${naar}<a class="knop licht" href="index.html">Terug naar het stappenplan</a><button class="knop licht" id="eindeWerk">Download mijn werk</button></div></div>`;
  }

  // ---------- Mijn werk ----------
  function toast(t) { const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(el._t); el._t = setTimeout(() => { el.hidden = true; }, 5000); }
  function downloadWerk() {
    if (!Werk.download()) toast("Je hebt nog niets ingevuld. Wat je schrijft bij oefeningen en opdrachten, komt hier samen, geordend per deel van het document.");
  }
  $("mijnWerk").onclick = downloadWerk;
  document.addEventListener("click", (e) => { if (e.target && e.target.id === "eindeWerk") downloadWerk(); });

  function hash(t) { let h = 2166136261; for (const c of String(t)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function esc(t) { return String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  // ---------- Bediening ----------
  $("speel").onclick = () => (st.speelt ? pauzeer() : speel());
  $("vorige").onclick = () => { const j = volgendeIndex(st.i, -1); if (j >= 0) toon(j, st.speelt); };
  $("volgende").onclick = () => { const j = volgendeIndex(st.i, 1); if (j >= 0) toon(j, st.speelt); };
  $("naarBegin").onclick = () => toon(0, false);
  $("naarOefening").onclick = () => {
    const sl = st.mod.slides; const n = sl.length;
    for (let k = 1; k <= n; k++) { const j = (st.i + k) % n; if (sl[j].oefening || sl[j].sectie === "Oefening" || sl[j].sectie === "Opdracht") { toon(j, false); return; } }
  };
  $("snelheid").onchange = (e) => {
    const oud = st.snelheid;
    st.snelheid = parseFloat(e.target.value); Opslag.schrijf("snelheid", st.snelheid);
    audio.playbackRate = st.snelheid;
    if (st.timer) { // tekstmodus: resterende tijd herschalen naar de nieuwe snelheid
      pauzeer();
      const f = oud / st.snelheid; st.rest *= f; st.duur *= f;
      speel();
    }
  };
  $("voortgang").onclick = (e) => {
    if (!audio.duration) return;
    const r = e.currentTarget.getBoundingClientRect(); audio.currentTime = audio.duration * (e.clientX - r.left) / r.width;
  };
  document.addEventListener("keydown", (e) => {
    if (["TEXTAREA", "SELECT", "INPUT"].includes(e.target.tagName)) return;
    if (e.key === " ") { e.preventDefault(); $("speel").click(); }
    if (e.key === "ArrowRight") $("volgende").click();
    if (e.key === "ArrowLeft") $("vorige").click();
  });
})();
