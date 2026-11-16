// Gedeelde cursusgegevens: route, bouwstenen van het eindproduct, bronnen.
window.CURSUS = {
  versie: "20261117b", // verhoog bij elke wijziging, zodat browsers de nieuwe bestanden laden
  titel: "Van onderzoeksvraag tot Feedbackmoment 1",
  deadline: "zondag 22 november, 23u59", // verouderd: gebruik data.fm1
  // Inlevermomenten: de enige plek met concrete data (regel G5). "tot" = laatste dag van die fase.
  // Teksten op het scherm verwijzen naar deze data met {{sleutel}}, bv. {{fm1}}. Volgend jaar enkel hier aanpassen.
  data: {
    fm1: "zondag 22 november, 23u59",
    fm1_kort: "22/11",
    fm1_dag: "zondag 22 november",
    gesprek: "1 of 4 december",
    februari: "februari",
    maart: "maart",
    finale: "begin mei",
    verdediging: "eind mei",
    begeleider: "je begeleider" // vul hier naam en e-mailadres in, bv. "Peter (peter@…)"
  },
  audio: false,
  // Onderzoeksvragen waarop de modules steunen. Bij een nieuwe vraag: voeg een versie toe (v1, v2 …) en zet
  // bij de modules die op die nieuwe vraag herschreven zijn "vraag: 'v1'". Modules die niet herschreven worden
  // (zoals M1) houden hun versie en tonen automatisch een waarschuwing met de nieuwe vraag.
  vragen: [
    { id: "v0",
      tekst: "In welke mate beïnvloedt een gebrek aan digitale vaardigheden de instroom ten opzichte van het behoud van werk bij laaggeschoolden in Vlaanderen in de periode 2019-2024?",
      type: "verklarend",
      toelichting: "" },
    { id: "v1",
      tekst: "Wegen digitale vaardigheden sinds de coronacrisis zwaarder door wanneer Vlaamse werkgevers laaggeschoolde jongeren aanwerven in vergelijking met de periode daarvoor?",
      type: "verklarend of beschrijvend (keuze in module 6)",
      toelichting: "" }
  ],
  fasen: [
    { id: "fm1",   naam: "Feedbackmoment 1",            wanneer: "zondag 22 november, 23u59", tot: "2026-11-22" },
    { id: "maart", naam: "Tussentijdse versie",         wanneer: "maart",                     tot: "2027-03-31" },
    { id: "mei",   naam: "Finale paper en verdediging", wanneer: "mei",                       tot: "2027-05-31" }
  ],
  bouwstenen: [
    { id: "V", tekst: "Voorblad en titel" },
    { id: "A", tekst: "Onderzoeksvraag en afbakening" },
    { id: "B", tekst: "Genummerde structuur vanuit een economisch model" },
    { id: "C", tekst: "Aanzet tot inleiding" },
    { id: "D", tekst: "Bronnenoverzicht [G] en [T]" },
    { id: "E", tekst: "Planning en taakverdeling" }
  ],
  modules: [
    { id: "m0", nr: "M0", titel: "Start: wat lever je in en hoe loopt de route?", min: 8, totaal: 40, nunodig: 0,  stap: "Vertrekpunt", bouwt: ["E"], klaar: true, voltooid: true },
    { id: "m1", nr: "M1", titel: "De onderzoeksvraag kritisch doorlichten", min: 45, totaal: 105, nunodig: 105, stap: "Stap 1", bouwt: ["A"], klaar: true, vraag: "v0" },
    { id: "m2", nr: "M2", titel: "Een economisch model voor de afweging van de werkgever", min: 58, totaal: 95, nunodig: 80, stap: "Stap 2", bouwt: ["B"], klaar: true, vraag: "v1" },
    { id: "m3", nr: "M3", titel: "Zoekstrategie: studies vinden die meten wat jullie vraag vraagt", min: 40, totaal: 100, nunodig: 80, stap: "Stap 3", bouwt: ["D", "A"], klaar: true, vraag: "v1" },
    { id: "m4", nr: "M4", titel: "Bronnen beoordelen: meet deze studie wat jullie vraag vraagt?", min: 30, totaal: 90, nunodig: 77, stap: "Stap 3", bouwt: ["D"], klaar: true, vraag: "v1" },
    { id: "m5", nr: "M5", titel: "Correct refereren: rapporten, data en het bronnenoverzicht", min: 40, totaal: 85, nunodig: 56, stap: "Stap 3", bouwt: ["D"], klaar: true, vraag: "v1" },
    { id: "m6", nr: "M6", titel: "\"Sinds de coronacrisis\": tijdsgrens of oorzaak?", min: 50, totaal: 100, nunodig: 48, stap: "Stap 4", bouwt: ["A"], klaar: true, vraag: "v1" },
    { id: "m7", nr: "M7", titel: "Het bouwplan: versie 2, deelvragen, structuur, titel en voorblad", min: 65, totaal: 105, nunodig: 85, stap: "Stap 5", bouwt: ["V", "A", "B"], klaar: true, vraag: "v1" },
    { id: "m8", nr: "M8", titel: "De aanzet tot inleiding", min: 60, totaal: 85, nunodig: 75, stap: "Stap 5", bouwt: ["C"], klaar: true, vraag: "v1" },
    { id: "m9", nr: "M9", titel: "Planning, taakverdeling, eindcontrole en feedbackgesprek", min: 39, totaal: 100, nunodig: 85, stap: "Stap 6", bouwt: ["E"], klaar: true, vraag: "v1" }
  ],
  verdieping: [
    { id: "v1", nr: "V1", titel: "Difference-in-differences stap voor stap" },
    { id: "v2", nr: "V2", titel: "Statistische discriminatie en zoekfricties" },
    { id: "v3", nr: "V3", titel: "Voorbereiding mondelinge verdediging" }
  ],
  bronnen: {
    les1:     { naam: "Les 1: Hoe doen economen onderzoek?",                 pad: "bronnen/Les1.pdf" },
    les2:     { naam: "Les 2: Van onderwerp naar onderzoeksvraag",            pad: "bronnen/Les2.pdf" },
    les3:     { naam: "Les 3: Economische literatuur en structuur",           pad: "bronnen/Les3.pdf" },
    fm1:      { naam: "Feedbackmoment 1: instructies en planning",           pad: "bronnen/Feedbackmoment1.pdf" },
    schrijven:{ naam: "Academisch schrijven (Monitoraat op Maat)",            pad: "bronnen/Academisch_schrijven.pdf" }
  }
};
window.MODULES = window.MODULES || {};
// Vervangt {{sleutel}} door de datum uit CURSUS.data.
window.metData = (t) => typeof t === "string" ? t.replace(/\{\{(\w+)\}\}/g, (m, k) => (window.CURSUS.data[k] !== undefined ? window.CURSUS.data[k] : m)) : t;
window.FASEN = window.FASEN || {};

// Fase: automatisch volgens de datum, tenzij de cursist zelf koos.
window.Fase = {
  automatisch() {
    const vandaag = new Date().toISOString().slice(0, 10);
    const f = CURSUS.fasen.find((x) => vandaag <= x.tot);
    return (f || CURSUS.fasen[CURSUS.fasen.length - 1]).id;
  },
  huidig() { const k = Opslag.lees("fase", ""); return CURSUS.fasen.some((f) => f.id === k) ? k : this.automatisch(); },
  kies(id) { Opslag.schrijf("fase", id === this.automatisch() ? "" : id); },
  info(id) { return CURSUS.fasen.find((f) => f.id === (id || this.huidig())); },
  // Etiket (nu, kennen, maart, mei) bekeken vanuit de gekozen fase.
  label(etiket, fase) {
    fase = fase || this.huidig();
    const idx = { nu: 0, fm1: 0, maart: 1, mei: 2 };
    if (etiket === "kennen") return { cls: "kennen", tekst: "Zeker kennen", later: false };
    const e = idx[etiket] ?? 0, f = idx[fase] ?? 0;
    if (e === f) return { cls: "nu", tekst: "Nu nodig", later: false };
    if (e < f) return { cls: "basis", tekst: "Basis: al gedaan, herneem", later: false };
    return { cls: "later", tekst: "Voor later: " + CURSUS.fasen[e].naam.toLowerCase() + " (" + CURSUS.fasen[e].wanneer + ")", later: true };
  },
  slide(modId, slideId) { const m = window.FASEN[modId]; return (m && m.slides && m.slides[slideId]) || { fase: "nu" }; }
};

// Kleine opslaghulp: werkt niet overal (bv. privé-venster), dus altijd met vangnet.
window.Opslag = {
  klaar(id) { const m = (window.CURSUS.modules || []).find((x) => x.id === id); return !!(m && m.voltooid) || this.lees("klaar." + id, false); },
  lees(k, std) { try { const v = localStorage.getItem("elo." + k); return v === null ? std : JSON.parse(v); } catch (e) { return std; } },
  schrijf(k, v) { try { localStorage.setItem("elo." + k, JSON.stringify(v)); } catch (e) {} }
};

// "Mijn werk": alles wat de cursist invult, over alle modules heen, geordend per bouwsteen.
window.Werk = {
  alles() { return Opslag.lees("werk", {}); },
  bewaar(id, item) { const w = this.alles(); if ((item.tekst || "").trim()) w[id] = Object.assign({ t: Date.now() }, item); else delete w[id]; Opslag.schrijf("werk", w); },
  tekst(id) { const w = this.alles(); return w[id] ? w[id].tekst : ""; },
  downloadProfiel(velden) {
    const w = this.alles();
    const ingevuld = velden.filter((v) => w["m1.vp." + v.id]);
    if (!ingevuld.length) return false;
    const regels = ["Vraagprofiel van de groep – na module 1", "Gedownload op " + new Date().toLocaleString("nl-BE"), "Groep: (vul je groepsnummer in)", ""];
    velden.forEach((v) => regels.push(v.label, (w["m1.vp." + v.id] ? w["m1.vp." + v.id].tekst.trim() : "(niet ingevuld)"), ""));
    const blob = new Blob([regels.join("\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "Vraagprofiel_groep.txt"; a.click();
    return true;
  },
  download() {
    const w = this.alles(); const ids = Object.keys(w);
    if (!ids.length) return false;
    const regels = ["Mijn werk – bouwstenen voor GroepX_Feedbackmoment1.docx", "Gedownload op " + new Date().toLocaleString("nl-BE"), ""];
    const groepen = [{ id: "P", titel: "Vraagprofiel (door te geven aan je begeleider)" }].concat(CURSUS.bouwstenen.map((b) => ({ id: b.id, titel: b.id + ". " + b.tekst }))).concat([{ id: "_", titel: "Notities bij de oefeningen" }]);
    const momenten = [{ id: "nu", naam: CURSUS.fasen[0].naam }, { id: "kennen", naam: "Zeker kennen" }, { id: "maart", naam: CURSUS.fasen[1].naam }, { id: "mei", naam: CURSUS.fasen[2].naam }];
    momenten.forEach((mo) => {
      const inMoment = ids.map((k) => w[k]).filter((x) => (x.fase || "nu") === mo.id);
      if (!inMoment.length) return;
      regels.push("######## " + mo.naam.toUpperCase() + " ########", "");
      groepen.forEach((g) => {
        const items = inMoment.filter((x) => (x.bouwsteen || "_") === g.id).sort((a, b) => (a.mod + a.label).localeCompare(b.mod + b.label));
        if (!items.length) return;
        regels.push("==== " + g.titel + " ====", "");
        items.forEach((x) => regels.push("[" + x.mod + "] " + x.label, x.tekst.trim(), ""));
      });
    });
    const blob = new Blob([regels.join("\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "Mijn_werk_Feedbackmoment1.txt"; a.click();
    return true;
  }
};
