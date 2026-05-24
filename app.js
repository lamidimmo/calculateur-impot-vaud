/* ============================================================
   IGI Vaud — calculator logic ported 1:1 from
   "IGI Vaud Calculateur v2.xlsx" (sheet "Calculateur")
   Formulas: art. 70/72 LI Vaud, droits de mutation 3,3 %,
   notaire/RF 0,7 %, franchise CHF 5 000, taux plancher 7 %.
   ============================================================ */

/* ---------- barème (art. 72 LI) ---------- */
const BAREME = [
  { y: 0,  rate: 0.30, label: "< 1 an" },
  { y: 1,  rate: 0.27, label: "1–2 ans" },
  { y: 2,  rate: 0.24, label: "2–3 ans" },
  { y: 3,  rate: 0.22, label: "3–4 ans" },
  { y: 4,  rate: 0.20, label: "4–5 ans" },
  { y: 5,  rate: 0.18, label: "5–6 ans" },
  { y: 6,  rate: 0.17, label: "6–7 ans" },
  { y: 7,  rate: 0.16, label: "7–8 ans" },
  { y: 8,  rate: 0.15, label: "8–9 ans" },
  { y: 9,  rate: 0.15, label: "9–10 ans" },
  { y: 10, rate: 0.14, label: "10–11 ans" },
  { y: 11, rate: 0.14, label: "11–12 ans" },
  { y: 12, rate: 0.13, label: "12–13 ans" },
  { y: 13, rate: 0.13, label: "13–14 ans" },
  { y: 14, rate: 0.12, label: "14–15 ans" },
  { y: 15, rate: 0.12, label: "15–16 ans" },
  { y: 16, rate: 0.11, label: "16–17 ans" },
  { y: 17, rate: 0.11, label: "17–18 ans" },
  { y: 18, rate: 0.10, label: "18–19 ans" },
  { y: 19, rate: 0.10, label: "19–20 ans" },
  { y: 20, rate: 0.09, label: "20–21 ans" },
  { y: 21, rate: 0.09, label: "21–22 ans" },
  { y: 22, rate: 0.08, label: "22–23 ans" },
  { y: 23, rate: 0.08, label: "23–24 ans" },
  { y: 24, rate: 0.07, label: "≥ 24 ans — taux plancher" },
];

const FRANCHISE = 5000;
const FLOOR_YEARS = 24;

/* ---------- guide travaux data ---------- */
const GUIDE_YES = [
  { ic: "🏊", title: "Construction piscine / jacuzzi", note: "Équipement nouveau = augmentation durable de valeur", tag: "yes" },
  { ic: "🧖", title: "Ajout d'un sauna", note: "Équipement nouveau", tag: "yes" },
  { ic: "🏗️", title: "Extension / agrandissement surface habitable", note: "Création de m² nouveaux", tag: "yes" },
  { ic: "🏠", title: "Aménagement de combles (chambre, bureau)", note: "Transformation en surface habitable", tag: "yes" },
  { ic: "🌿", title: "Construction véranda / jardin d'hiver", note: "Ajout structurel nouveau", tag: "yes" },
  { ic: "🚗", title: "Ajout garage / carport", note: "Construction nouvelle — non existante à l'achat", tag: "yes" },
  { ic: "🍳", title: "Cuisine haut-de-gamme sur bien à cuisine basique", note: "Part de surclassement = plus-value. Remplacement équivalent = entretien.", tag: "yes-partial", tagLabel: "OUI partiel" },
  { ic: "🛁", title: "Salle de bain haut-de-gamme sur SdB basique", note: "Même logique que cuisine — justifier l'écart de standing", tag: "yes-partial", tagLabel: "OUI partiel" },
  { ic: "☀️", title: "Installation panneaux solaires / photovoltaïque", note: "Part plus-value (valeur ajoutée au bien) admise par l'ACI Vaud", tag: "yes-partial", tagLabel: "OUI partiel" },
  { ic: "🌱", title: "Mise aux normes énergétiques au-delà de l'obligation", note: "Part au-delà de l'entretien obligatoire légal", tag: "yes-partial", tagLabel: "OUI partiel" },
  { ic: "📜", title: "Rachat de servitudes améliorant la propriété", note: "Augmente la valeur juridique du bien", tag: "yes" },
  { ic: "🏦", title: "Frais bancaires / dossier liés au prêt de construction", note: "Directement liés à la réalisation des travaux", tag: "yes" },
  { ic: "🤝", title: "Commission de courtage à la vente", note: "Frais liés à l'aliénation — art. 70 LI", tag: "yes" },
  { ic: "📉", title: "Pénalités résiliation anticipée hypothèque", note: "Conditionnées à la vente — admises par l'ACI", tag: "yes" },
];

const GUIDE_NO = [
  { ic: "🎨", title: "Peinture intérieure / extérieure", note: "Entretien courant — déductible de l'impôt sur le revenu", tag: "no" },
  { ic: "🔥", title: "Remplacement chaudière à l'identique", note: "Sans amélioration qualitative = entretien", tag: "no" },
  { ic: "🏠", title: "Remplacement toiture à l'identique", note: "Remplacement à l'équivalent", tag: "no" },
  { ic: "🍽️", title: "Remplacement appareils électroménagers équivalents", note: "Entretien ordinaire", tag: "no" },
  { ic: "🪟", title: "Remplacement fenêtres / volets à l'identique", note: "Sans saut qualitatif significatif", tag: "no" },
  { ic: "🔧", title: "Réparations courantes plomberie / électricité", note: "Maintenance — déductible du revenu annuel", tag: "no" },
  { ic: "🌳", title: "Entretien jardin courant", note: "Non admis à Vaud (contrairement à d'autres cantons)", tag: "no" },
  { ic: "🏢", title: "Contributions au fonds de rénovation PPE", note: "Assimilées à entretien par l'ACI Vaud", tag: "no" },
  { ic: "💸", title: "Intérêts hypothécaires annuels", note: "Déductibles du revenu annuel — pas de l'IGI", tag: "no" },
];

/* ============================================================
   Helpers
   ============================================================ */

const fmt = new Intl.NumberFormat("fr-CH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmtPct = new Intl.NumberFormat("fr-CH", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
function nbsp(s) { return s.replace(/ /g, " "); } // visual: hard-space thousands

function formatMoney(n) {
  if (!isFinite(n)) return "0,00";
  return nbsp(fmt.format(n));
}
function formatPct(r) {
  if (!isFinite(r)) return "0 %";
  return nbsp(fmtPct.format(r));
}

function parseNum(v) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[\s  ']/g, "").replace(",", ".");
  if (s === "" || s === "-") return 0;
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

function parseDate(v) {
  if (!v) return null;
  // accepts "YYYY-MM-DD" from <input type=date>
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function diffDays(a, b) {
  return Math.round((b - a) / 86400000);
}

/* VLOOKUP(value, table, col, TRUE) — approximate match, table sorted asc */
function lookupRate(years) {
  let rate = BAREME[0].rate;
  for (const row of BAREME) {
    if (row.y <= years) rate = row.rate;
    else break;
  }
  return rate;
}

/* ============================================================
   State + DOM
   ============================================================ */
const STORAGE_KEY = "igi-vaud-v1";

const inputIds = [
  "prixVente", "prixAchat", "dateAchat", "dateVente",
  "cedule",
  "t1", "t2", "t3", "t4", "t5",
  "courtage", "penalites", "autresVente",
  "ansPrincipale", "ansSecondaire",
  "estimFiscale", "dateEstim",
];

const state = {
  occupation: 1,
};

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return Array.from(document.querySelectorAll(sel)); }
function set(name, value) {
  $$(`[data-out="${name}"]`).forEach((el) => { el.textContent = value; });
}

function readInputs() {
  const data = {};
  inputIds.forEach((id) => {
    const el = document.querySelector(`[data-input="${id}"]`);
    if (!el) return;
    if (el.type === "date") data[id] = parseDate(el.value);
    else if (el.type === "number") data[id] = parseNum(el.value);
    else data[id] = parseNum(el.value);
  });
  data.occupation = state.occupation;
  return data;
}

/* ============================================================
   Pure compute — mirrors the Excel formulas
   ============================================================ */
function compute(d) {
  // ① durée réelle (Excel C10): ROUNDDOWN((C9-C8)/365.25,0)
  const realYears = (d.dateAchat && d.dateVente)
    ? Math.max(0, Math.floor(diffDays(d.dateAchat, d.dateVente) / 365.25))
    : null;

  // ② frais d'acquisition
  const droitsMutation = round2(d.prixAchat * 0.033);
  const fraisNotaire   = round2(d.prixAchat * 0.007);
  const totalAcq       = droitsMutation + fraisNotaire + d.cedule;
  const totalAcqPct    = d.prixAchat > 0 ? totalAcq / d.prixAchat : 0;

  // ③ travaux
  const totalTravaux   = d.t1 + d.t2 + d.t3 + d.t4 + d.t5;

  // ④ frais de vente
  const totalVente     = d.courtage + d.penalites + d.autresVente;

  // ⑤ occupation
  let statut;
  if (d.occupation === 1) statut = "Résidence PRINCIPALE";
  else if (d.occupation === 2) statut = "Résidence SECONDAIRE (occupation personnelle)";
  else statut = "Mixte — principale + secondaire";

  let coherence;
  if (realYears == null) coherence = "— saisir les dates —";
  else if ((d.ansPrincipale + d.ansSecondaire) > realYears)
    coherence = "⚠️ INCOHÉRENCE — réduire";
  else
    coherence = `OK — ${d.ansPrincipale + d.ansSecondaire} an(s) déclaré(s) / ${realYears} réel(s)`;

  // ⟹ durée fiscale pondérée: MIN(C10 + C37, 99)
  const dureePonderee = realYears == null ? null : Math.min(realYears + d.ansPrincipale, 99);

  // ⑥ option estimation fiscale
  let eligible = false;
  let eligLabel;
  if (d.estimFiscale === 0) eligLabel = "Non applicable (valeur = 0)";
  else if (!d.dateEstim) eligLabel = "Saisir la date de l'estimation";
  else if (!d.dateAchat) eligLabel = "Saisir la date d'achat";
  else if (!d.dateVente) eligLabel = "Saisir la date de vente";
  else if (d.dateEstim <= d.dateAchat) eligLabel = "Non éligible — estimation antérieure à l'achat";
  else if (diffDays(d.dateEstim, d.dateVente) >= 3650) { eligLabel = "OUI — éligible (≥ 10 ans en vigueur)"; eligible = true; }
  else eligLabel = "Non éligible — moins de 10 ans en vigueur";

  const prixRetenu = (eligible && d.estimFiscale > d.prixAchat) ? d.estimFiscale : d.prixAchat;

  // ⑦ gain
  const gainBrut = d.prixVente - prixRetenu - totalAcq - totalTravaux - totalVente;

  // ⑧ taux & impôt
  const dureeForRate = dureePonderee;  // null si pas de dates
  let taux = null, gainNet = 0, igi = null;
  if (dureeForRate != null) {
    taux = lookupRate(Math.min(dureeForRate, FLOOR_YEARS));
    gainNet = Math.max(gainBrut - FRANCHISE, 0);
    igi = gainNet * taux;
  }

  // ⑨ alertes
  let tipDiffere;
  if (taux == null) tipDiffere = "— compléter les données —";
  else if (taux <= 0.07) tipDiffere = "Taux plancher de 7 % déjà atteint";
  else {
    const tauxNext = lookupRate(Math.min(dureeForRate + 1, FLOOR_YEARS));
    const economie = (taux - tauxNext) * gainNet;
    tipDiffere = economie > 0
      ? `Économie estimée : ${formatMoney(economie)} CHF (taux passe de ${formatPct(taux)} à ${formatPct(tauxNext)})`
      : "Pas d'économie sur la tranche suivante";
  }

  let tipEstim;
  if (d.estimFiscale === 0) tipEstim = "Non renseignée — vérifier si applicable";
  else if (eligible && d.estimFiscale > d.prixAchat) tipEstim = "Avantageuse — retenue comme prix d'acquisition";
  else if (d.estimFiscale > d.prixAchat) tipEstim = "Valeur supérieure mais conditions non remplies (≥10 ans, postérieure à l'achat)";
  else tipEstim = "Non retenue (prix d'achat ≥ estimation)";

  return {
    realYears, droitsMutation, fraisNotaire, totalAcq, totalAcqPct,
    totalTravaux, totalVente,
    statut, coherence, dureePonderee,
    eligLabel, prixRetenu,
    gainBrut, taux, gainNet, igi,
    tipDiffere, tipEstim,
  };
}

function round2(n) { return Math.round(n * 100) / 100; }

/* ============================================================
   Render
   ============================================================ */
function render() {
  const d = readInputs();
  const r = compute(d);

  set("dureeReelle", r.realYears == null ? "— saisir les dates —" : `${r.realYears} an${r.realYears > 1 ? "s" : ""}`);

  set("droitsMutation", formatMoney(r.droitsMutation));
  set("fraisNotaire",   formatMoney(r.fraisNotaire));
  set("totalAcq",       formatMoney(r.totalAcq));
  set("totalAcqPct",    `(${nbsp(new Intl.NumberFormat("fr-CH",{style:"percent",minimumFractionDigits:2,maximumFractionDigits:2}).format(r.totalAcqPct))} du prix d'achat)`);

  set("totalTravaux", formatMoney(r.totalTravaux));
  set("totalVente",   formatMoney(r.totalVente));

  set("statut", r.statut);
  set("coherence", r.coherence);
  set("dureePonderee", r.dureePonderee == null
    ? "— saisir les dates —"
    : `${r.dureePonderee} an${r.dureePonderee > 1 ? "s" : ""} (fiscal)`);

  set("eligEstim", r.eligLabel);
  set("prixRetenu", formatMoney(r.prixRetenu));

  // gain breakdown (right column)
  set("kvVente",     formatMoney(d.prixVente));
  set("kvAcq",       formatMoney(r.prixRetenu));
  set("kvFraisAcq",  formatMoney(r.totalAcq));
  set("kvTravaux",   formatMoney(r.totalTravaux));
  set("kvFraisVente",formatMoney(r.totalVente));
  set("kvBrut",      formatMoney(r.gainBrut));
  set("kvNet",       formatMoney(r.gainNet));

  set("kvDuree", r.dureePonderee == null ? "—" : `${r.dureePonderee} ans`);
  set("kvTaux",  r.taux == null ? "—" : formatPct(r.taux));
  set("kvIgi",   r.igi == null ? "—" : `${formatMoney(r.igi)} CHF`);

  // hero IGI
  if (r.igi == null) {
    set("igi", "—");
    set("igiSub", "Saisissez les données pour estimer l'impôt");
  } else if (r.gainNet === 0 && r.gainBrut <= FRANCHISE) {
    set("igi", "0 CHF");
    set("igiSub", "Exonéré — gain nul ou sous la franchise de 5 000 CHF");
  } else {
    set("igi", `${formatMoney(r.igi)} CHF`);
    set("igiSub", `sur un gain net de ${formatMoney(r.gainNet)} CHF · taux ${formatPct(r.taux)} (${r.dureePonderee} ans pondérés)`);
  }

  // tips
  set("tipDiffere", r.tipDiffere);
  set("tipEstim", r.tipEstim);

  // highlight active barème row (when present)
  highlightBareme(r.dureePonderee);

  saveState(d);
}

/* ============================================================
   Persistence
   ============================================================ */
function saveState(d) {
  try {
    const raw = {};
    inputIds.forEach((id) => {
      const el = document.querySelector(`[data-input="${id}"]`);
      if (el) raw[id] = el.value;
    });
    raw.__occupation = state.occupation;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
  } catch {}
}
function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    inputIds.forEach((id) => {
      const el = document.querySelector(`[data-input="${id}"]`);
      if (el && raw[id] != null) el.value = raw[id];
    });
    if (raw.__occupation) {
      state.occupation = Number(raw.__occupation);
      $$(".seg-btn").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.occ) === state.occupation));
    }
  } catch {}
}

/* ============================================================
   Barème — table + chart
   ============================================================ */
function renderBareme() {
  const tbody = $("#baremeTable tbody");
  tbody.innerHTML = BAREME.map((r, i) => {
    const isFloor = r.y === 24;
    return `<tr${isFloor ? ' class="floor"' : ""} data-yr="${r.y}">
      <td>${r.y}${isFloor ? "+" : ""}</td>
      <td>${r.label}</td>
      <td>${formatPct(r.rate)}</td>
    </tr>`;
  }).join("");

  drawRateChart();
}

function highlightBareme(years) {
  $$("#baremeTable tr").forEach((tr) => tr.classList.remove("is-current"));
  if (years == null) return;
  const y = Math.min(years, 24);
  const row = $(`#baremeTable tr[data-yr="${y}"]`);
  if (row) {
    row.classList.add("is-current");
    row.style.outline = "2px solid var(--accent)";
    row.style.outlineOffset = "-2px";
  }
}

function drawRateChart() {
  const svg = $("#rateChart");
  if (!svg) return;
  const W = 600, H = 220, P = { l: 30, r: 12, t: 12, b: 28 };
  const minR = 0.05, maxR = 0.32;
  const xs = BAREME.map((r) => r.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const x = (v) => P.l + ((v - xMin) / (xMax - xMin)) * (W - P.l - P.r);
  const y = (v) => H - P.b - ((v - minR) / (maxR - minR)) * (H - P.t - P.b);

  let grid = "";
  for (const r of [0.30, 0.20, 0.10]) {
    grid += `<line x1="${P.l}" x2="${W - P.r}" y1="${y(r)}" y2="${y(r)}" stroke="#eef0f4"/>`;
    grid += `<text x="${P.l - 6}" y="${y(r) + 3}" text-anchor="end" font-size="9" fill="#7a8aa0" font-family="Inter">${Math.round(r * 100)}%</text>`;
  }

  // path
  let d = "";
  BAREME.forEach((p, i) => { d += `${i === 0 ? "M" : "L"} ${x(p.y).toFixed(1)} ${y(p.rate).toFixed(1)} `; });
  // area under curve
  let area = d + `L ${x(xMax).toFixed(1)} ${H - P.b} L ${x(xMin).toFixed(1)} ${H - P.b} Z`;

  let pts = BAREME.map((p) => `<circle cx="${x(p.y).toFixed(1)}" cy="${y(p.rate).toFixed(1)}" r="2.5" fill="#0b1f33"/>`).join("");

  let xLabels = "";
  for (const v of [0, 5, 10, 15, 20, 24]) {
    xLabels += `<text x="${x(v)}" y="${H - 10}" text-anchor="middle" font-size="9" fill="#7a8aa0" font-family="Inter">${v}${v === 24 ? "+" : ""} ans</text>`;
  }

  svg.innerHTML = `
    <defs>
      <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#b48a47" stop-opacity=".24"/>
        <stop offset="100%" stop-color="#b48a47" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grid}
    <path d="${area}" fill="url(#grad)"/>
    <path d="${d}" fill="none" stroke="#0b1f33" stroke-width="1.6"/>
    ${pts}
    ${xLabels}
  `;
}

/* ============================================================
   Guide travaux — populate lists
   ============================================================ */
function renderGuide() {
  $("#listYes").innerHTML = GUIDE_YES.map(itemHTML).join("");
  $("#listNo").innerHTML  = GUIDE_NO.map(itemHTML).join("");
}
function itemHTML(g) {
  const lbl = g.tagLabel || (g.tag === "no" ? "NON" : "OUI");
  return `<li>
    <span class="g-ic">${g.ic}</span>
    <span class="g-title">${g.title}</span>
    <span class="g-tag ${g.tag}">${lbl}</span>
    <span class="g-note">${g.note}</span>
  </li>`;
}

/* ============================================================
   Tabs
   ============================================================ */
function initTabs() {
  const tabs = $$(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.dataset.tab;
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      $$(".panel").forEach((p) => {
        const on = p.id === `panel-${name}`;
        p.classList.toggle("is-active", on);
        p.hidden = !on;
      });
      // smooth scroll back to top of main area
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

/* ============================================================
   Numeric input — light auto-formatting (grouping on blur)
   ============================================================ */
function attachNumericFormatting() {
  $$("input.num").forEach((el) => {
    el.addEventListener("blur", () => {
      const n = parseNum(el.value);
      if (n === 0 && el.value.trim() === "") return;
      el.value = nbsp(new Intl.NumberFormat("fr-CH").format(n));
    });
    el.addEventListener("focus", () => {
      const n = parseNum(el.value);
      el.value = n === 0 ? "" : String(n);
    });
  });
}

/* ============================================================
   Init
   ============================================================ */
function init() {
  renderBareme();
  renderGuide();
  initTabs();
  attachNumericFormatting();

  // segmented occupation
  $$(".seg-btn").forEach((b) => {
    b.addEventListener("click", () => {
      $$(".seg-btn").forEach((x) => x.classList.remove("is-active"));
      b.classList.add("is-active");
      state.occupation = Number(b.dataset.occ);
      render();
    });
  });

  // input listeners
  $$("[data-input]").forEach((el) => {
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  // reset
  $("#resetBtn").addEventListener("click", () => {
    $$("[data-input]").forEach((el) => { el.value = ""; });
    state.occupation = 1;
    $$(".seg-btn").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.occ) === 1));
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    render();
  });

  loadState();
  render();
}

document.addEventListener("DOMContentLoaded", init);
