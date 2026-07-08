/**
 * scripts/lib/diacritics.mjs
 *
 * Shared word lists and detection/fix helpers for the "diacritic got
 * stripped during generation" class of bug, used by:
 *   - find-diacritic-issues.mjs         (Norwegian fields)
 *   - find-diacritic-issues-de-es.mjs   (German/Spanish translation fields)
 *   - enrich-vocab.mjs                  (pre-merge validation of freshly
 *                                        generated content, so bad output
 *                                        never reaches the draft file)
 *
 * Pure data + pure functions only — no CLI/file-system logic here, so this
 * module is safe to import without side effects.
 */

// ── Norwegian ─────────────────────────────────────────────────────────────

// Common closed-class Norwegian words that always carry æ/ø/å. Map:
// degraded ASCII form → { correct, label }. Kept to very common,
// unambiguous, high-frequency words so this doesn't flag legitimate short
// words that happen to coincide with a degraded form.
export const NO_COMMON_WORD_MAP = {
  a: { correct: 'å', label: 'å' },
  pa: { correct: 'på', label: 'på' },
  ma: { correct: 'må', label: 'må' },
  gar: { correct: 'går', label: 'går' },
  // "far" (no diacritic needed) is deliberately NOT mapped here — it's the
  // genuine, extremely common Norwegian noun "far" ("father"), not just a
  // degraded "får" ("gets/receives", or "sheep"). See NO_AMBIGUOUS_WORDS.
  naar: { correct: 'når', label: 'når' },
  sma: { correct: 'små', label: 'små' },
  fa: { correct: 'få', label: 'få' },
  // "ga" (no diacritic needed) is deliberately NOT mapped here — it's the
  // genuine Norwegian word "ga" ("gave", past tense of "å gi"), not just a
  // degraded "gå" ("to go/walk"). See NO_AMBIGUOUS_WORDS below.
  saa: { correct: 'så', label: 'så' },
  aa: { correct: 'å', label: 'å (aa-digraph)' },
  boer: { correct: 'bør', label: 'bør' },
  tor: { correct: 'tør', label: 'tør' },
  hoyre: { correct: 'høyre', label: 'høyre' },
  oyne: { correct: 'øyne', label: 'øyne' },
  soker: { correct: 'søker', label: 'søker' },
  proever: { correct: 'prøver', label: 'prøver' },
  prover: { correct: 'prøver', label: 'prøver' },
  prove: { correct: 'prøve', label: 'prøve' },
  proverommet: { correct: 'prøverommet', label: 'prøverommet' },
  storre: { correct: 'større', label: 'større' },
  hoyest: { correct: 'høyest', label: 'høyest' },
  vaere: { correct: 'være', label: 'være' },
  laere: { correct: 'lære', label: 'lære' },
  laerer: { correct: 'lærer', label: 'lærer' },
  laereren: { correct: 'læreren', label: 'læreren' },
  kjore: { correct: 'kjøre', label: 'kjøre' },
  hore: { correct: 'høre', label: 'høre' },
  sporre: { correct: 'spørre', label: 'spørre' },
  fole: { correct: 'føle', label: 'føle' },
  foler: { correct: 'føler', label: 'føler' },
  fore: { correct: 'føre', label: 'føre' },
  blo: { correct: 'blø', label: 'blø' },
  bloe: { correct: 'blø', label: 'blø' },
  laege: { correct: 'lege', label: 'lege' },
  aar: { correct: 'år', label: 'år' },
  gaar: { correct: 'går', label: 'går' },
  nar: { correct: 'når', label: 'når' },
  mobler: { correct: 'møbler', label: 'møbler' },
  frisoren: { correct: 'frisøren', label: 'frisøren' },
  lordag: { correct: 'lørdag', label: 'lørdag' },
  sondag: { correct: 'søndag', label: 'søndag' },
  // "tirsdag" used to self-map to itself here — harmless no-op, removed.
  gjore: { correct: 'gjøre', label: 'gjøre' },
  spraket: { correct: 'språket', label: 'språket' },
  sprak: { correct: 'språk', label: 'språk' },
  kjorte: { correct: 'kjørte', label: 'kjørte' },
  darlig: { correct: 'dårlig', label: 'dårlig' },
  sla: { correct: 'slå', label: 'slå' },
  // Added after auditing a2 output — see scripts/outputs/audit-vocab-a2-draft-*.txt
  narheten: { correct: 'nærheten', label: 'nærheten' },
  balet: { correct: 'bålet', label: 'bålet' },
  videregaende: { correct: 'videregående', label: 'videregående' },
  onsker: { correct: 'ønsker', label: 'ønsker' },
  paasken: { correct: 'Påsken', label: 'Påsken' },
  pasken: { correct: 'Påsken', label: 'Påsken' },
  farikal: { correct: 'Fårikål', label: 'Fårikål' },
  noyaktig: { correct: 'nøyaktig', label: 'nøyaktig' },
  // Added after auditing a2 output round 2 — see scripts/outputs/audit-*-a2-draft-*.txt (2026-07-05)
  arlig: { correct: 'ærlig', label: 'ærlig' },
  sarlig: { correct: 'særlig', label: 'særlig' },
  vaeret: { correct: 'været', label: 'været' },
  fodselen: { correct: 'fødselen', label: 'fødselen' },
  sporsmaalet: { correct: 'spørsmålet', label: 'spørsmålet' },
  handen: { correct: 'hånden', label: 'hånden' },
  broed: { correct: 'brød', label: 'brød' },
  lare: { correct: 'lære', label: 'lære' },
  kjopte: { correct: 'kjøpte', label: 'kjøpte' },
  lopeskoa: { correct: 'løpeskoa', label: 'løpeskoa' },
  gronnsakene: { correct: 'grønnsakene', label: 'grønnsakene' },
  smorer: { correct: 'smører', label: 'smører' },
  kjokken: { correct: 'kjøkken', label: 'kjøkken' }
};

// Words that are genuinely ambiguous in ASCII form — ONLY reported, never
// auto-fixed, because guessing wrong would introduce a new error.
export const NO_AMBIGUOUS_WORDS = {
  sa: 'sa ("said", past tense of "si") OR "så" ("so/then") — review manually',
  // "ar" is a real (rare) Norwegian word — a unit of land area (100 m²) —
  // as well as a common degraded form of "år". Too ambiguous to auto-fix.
  ar: 'ar (rare unit of area) OR "år" ("year") — review manually',
  vare: 'vare ("goods/product") OR "våre" ("our") OR "være" ("to be") — review manually',
  ga: 'ga ("gave", past tense of "å gi") OR "gå" ("to go/walk") — review manually',
  far: 'far ("father", noun) OR "får" ("gets/receives", verb, OR "sheep", noun) — review manually'
};

/** ASCII-degrade a Norwegian word the same rough way generation seems to:
 * å→a, æ→ae, ø→o (and ø→oe / å→aa as alternates). */
export function degradeNO(word) {
  const lower = word.toLowerCase();
  const primary = lower.replace(/å/g, 'a').replace(/æ/g, 'ae').replace(/ø/g, 'o');
  const altOe = lower.replace(/å/g, 'a').replace(/æ/g, 'ae').replace(/ø/g, 'oe');
  const altAa = lower.replace(/å/g, 'aa').replace(/æ/g, 'ae').replace(/ø/g, 'oe');
  return [...new Set([primary, altOe, altAa])];
}

/** Strip gender parenthetical / verb marker to get the bare word for
 * degrading, e.g. "brødskive (en/ei)" → "brødskive", "å blø" → "blø". */
export function bareWordNO(norskOrLemma) {
  return (norskOrLemma || '')
    .replace(/\s*\((en|et|ei|en\/ei|en\/men)\)\s*$/i, '')
    .replace(/^å\s+/i, '')
    .trim();
}

// ── German ─────────────────────────────────────────────────────────────

export const DE_COMMON_WORD_MAP = {
  fur: { correct: 'für', label: 'für' },
  fuer: { correct: 'für', label: 'für' },
  uber: { correct: 'über', label: 'über' },
  ueber: { correct: 'über', label: 'über' },
  uberall: { correct: 'überall', label: 'überall' },
  ueberall: { correct: 'überall', label: 'überall' },
  konnen: { correct: 'können', label: 'können' },
  koennen: { correct: 'können', label: 'können' },
  // "konnte" (no digraph) is deliberately NOT mapped here — it's the
  // genuine, correctly-spelled Präteritum of "können" ("could", simple
  // past), not just a degraded "könnte". Auto-"fixing" it would silently
  // corrupt legitimate text (see DE_AMBIGUOUS_WORDS below) — same reason
  // "wurde"/"würde" is ambiguous-only rather than auto-mapped. Only the
  // unambiguous digraph form "koennte" (never a real standalone word) is
  // auto-fixed here.
  koennte: { correct: 'könnte', label: 'könnte' },
  // Same story for "mochte" (Präteritum of "mögen", "liked/wanted") vs
  // "möchte" ("would like") — see DE_AMBIGUOUS_WORDS.
  moechte: { correct: 'möchte', label: 'möchte' },
  mochten: { correct: 'möchten', label: 'möchten' },
  moechten: { correct: 'möchten', label: 'möchten' },
  mochtest: { correct: 'möchtest', label: 'möchtest' },
  moechtest: { correct: 'möchtest', label: 'möchtest' },
  mussen: { correct: 'müssen', label: 'müssen' },
  muessen: { correct: 'müssen', label: 'müssen' },
  // "mussten" (present tense already correct as-is, no umlaut in any form
  // of "müssen"'s Präteritum) used to self-map to itself here — a harmless
  // no-op fix, but it cluttered the fixable-issues report with false
  // positives on already-correct text. Removed; nothing degraded maps to it.
  grosser: { correct: 'größer', label: 'größer' },
  groesser: { correct: 'größer', label: 'größer' },
  grosste: { correct: 'größte', label: 'größte' },
  groesste: { correct: 'größte', label: 'größte' },
  grosse: { correct: 'große', label: 'große' },
  groesse: { correct: 'große', label: 'große' },
  naturlich: { correct: 'natürlich', label: 'natürlich' },
  natuerlich: { correct: 'natürlich', label: 'natürlich' },
  fruh: { correct: 'früh', label: 'früh' },
  frueh: { correct: 'früh', label: 'früh' },
  spat: { correct: 'spät', label: 'spät' },
  zuruck: { correct: 'zurück', label: 'zurück' },
  zurueck: { correct: 'zurück', label: 'zurück' },
  gluck: { correct: 'Glück', label: 'Glück' },
  glueck: { correct: 'Glück', label: 'Glück' },
  grun: { correct: 'grün', label: 'grün' },
  gruen: { correct: 'grün', label: 'grün' },
  mude: { correct: 'müde', label: 'müde' },
  muede: { correct: 'müde', label: 'müde' },
  wunsche: { correct: 'wünsche', label: 'wünsche' },
  wuensche: { correct: 'wünsche', label: 'wünsche' },
  wunschen: { correct: 'wünschen', label: 'wünschen' },
  gruesse: { correct: 'Grüße', label: 'Grüße' },
  grusse: { correct: 'Grüße', label: 'Grüße' },
  turen: { correct: 'Türen', label: 'Türen' },
  tueren: { correct: 'Türen', label: 'Türen' },
  strasse: { correct: 'Straße', label: 'Straße' },
  strassen: { correct: 'Straßen', label: 'Straßen' },
  strassenseite: { correct: 'Straßenseite', label: 'Straßenseite' },
  grossmutter: { correct: 'Großmutter', label: 'Großmutter' },
  grossvater: { correct: 'Großvater', label: 'Großvater' },
  fussball: { correct: 'Fußball', label: 'Fußball' },
  fuss: { correct: 'Fuß', label: 'Fuß' },
  heissen: { correct: 'heißen', label: 'heißen' },
  heisst: { correct: 'heißt', label: 'heißt' },
  heisem: { correct: 'heißem', label: 'heißem' },
  weiss: { correct: 'weiß', label: 'weiß' },
  erklarung: { correct: 'Erklärung', label: 'Erklärung' },
  wahrend: { correct: 'während', label: 'während' },
  ubung: { correct: 'Übung', label: 'Übung' },
  arzte: { correct: 'Ärzte', label: 'Ärzte' },
  nahe: { correct: 'Nähe', label: 'Nähe' },
  gemutlich: { correct: 'gemütlich', label: 'gemütlich' },
  plane: { correct: 'Pläne', label: 'Pläne' },
  gesattigt: { correct: 'gesättigt', label: 'gesättigt' },
  ratschlage: { correct: 'Ratschläge', label: 'Ratschläge' },
  nachste: { correct: 'nächste', label: 'nächste' },
  nachsten: { correct: 'nächsten', label: 'nächsten' },
  nachster: { correct: 'nächster', label: 'nächster' },
  nachstes: { correct: 'nächstes', label: 'nächstes' },
  uberquerten: { correct: 'überquerten', label: 'überquerten' },
  mundlich: { correct: 'mündlich', label: 'mündlich' },
  // Added after auditing a2 output round 2 — see scripts/outputs/audit-*-a2-draft-*.txt (2026-07-05)
  gebuhr: { correct: 'Gebühr', label: 'Gebühr' },
  gebuehr: { correct: 'Gebühr', label: 'Gebühr' },
  fruhstuck: { correct: 'Frühstück', label: 'Frühstück' },
  fruehstueck: { correct: 'Frühstück', label: 'Frühstück' },
  fruhstucken: { correct: 'frühstücken', label: 'frühstücken' },
  fruehstuecken: { correct: 'frühstücken', label: 'frühstücken' },
  fruhabends: { correct: 'frühabends', label: 'frühabends' },
  gahnen: { correct: 'gähnen', label: 'gähnen' },
  gaehnen: { correct: 'gähnen', label: 'gähnen' },
  gaste: { correct: 'Gäste', label: 'Gäste' },
  gaeste: { correct: 'Gäste', label: 'Gäste' },
  gemuse: { correct: 'Gemüse', label: 'Gemüse' },
  gemuese: { correct: 'Gemüse', label: 'Gemüse' },
  schuler: { correct: 'Schüler', label: 'Schüler' },
  schulern: { correct: 'Schülern', label: 'Schülern' },
  schueler: { correct: 'Schüler', label: 'Schüler' },
  schuelern: { correct: 'Schülern', label: 'Schülern' },
  raumte: { correct: 'räumte', label: 'räumte' },
  raeumte: { correct: 'räumte', label: 'räumte' },
  halfte: { correct: 'Hälfte', label: 'Hälfte' },
  haelfte: { correct: 'Hälfte', label: 'Hälfte' },
  buro: { correct: 'Büro', label: 'Büro' },
  buero: { correct: 'Büro', label: 'Büro' },
  glucklich: { correct: 'glücklich', label: 'glücklich' },
  gluecklich: { correct: 'glücklich', label: 'glücklich' },
  tuchtig: { correct: 'tüchtig', label: 'tüchtig' },
  tuechtig: { correct: 'tüchtig', label: 'tüchtig' },
  fuhlen: { correct: 'fühlen', label: 'fühlen' },
  fuehlen: { correct: 'fühlen', label: 'fühlen' },
  fuhle: { correct: 'fühle', label: 'fühle' },
  fuehle: { correct: 'fühle', label: 'fühle' },
  fuhlt: { correct: 'fühlt', label: 'fühlt' },
  fuehlt: { correct: 'fühlt', label: 'fühlt' },
  // "fuhren" (no digraph) is deliberately NOT mapped here — it's the
  // genuine Präteritum of "fahren" ("drove"), not just a degraded
  // "führen" ("to lead/manage"). See DE_AMBIGUOUS_WORDS below. Only the
  // unambiguous digraph form "fuehren" (never a real standalone word) is
  // auto-fixed here.
  fuehren: { correct: 'führen', label: 'führen' },
  fuhrt: { correct: 'führt', label: 'führt' },
  fuehrt: { correct: 'führt', label: 'führt' },
  fuhrerschein: { correct: 'Führerschein', label: 'Führerschein' },
  fuehrerschein: { correct: 'Führerschein', label: 'Führerschein' },
  ubernachten: { correct: 'übernachten', label: 'übernachten' },
  uebernachten: { correct: 'übernachten', label: 'übernachten' },
  verandern: { correct: 'verändern', label: 'verändern' },
  veraendern: { correct: 'verändern', label: 'verändern' },
  beschaftigen: { correct: 'beschäftigen', label: 'beschäftigen' },
  beschaeftigen: { correct: 'beschäftigen', label: 'beschäftigen' },
  toricht: { correct: 'töricht', label: 'töricht' },
  toericht: { correct: 'töricht', label: 'töricht' },
  standig: { correct: 'ständig', label: 'ständig' },
  staendig: { correct: 'ständig', label: 'ständig' },
  auslandisch: { correct: 'ausländisch', label: 'ausländisch' },
  auslaendisch: { correct: 'ausländisch', label: 'ausländisch' },
  auslandisches: { correct: 'ausländisches', label: 'ausländisches' },
  auslaendisches: { correct: 'ausländisches', label: 'ausländisches' },
  lander: { correct: 'Länder', label: 'Länder' },
  laender: { correct: 'Länder', label: 'Länder' },
  wahlte: { correct: 'wählte', label: 'wählte' },
  waehlte: { correct: 'wählte', label: 'wählte' },
  weiterfuhrenden: { correct: 'weiterführenden', label: 'weiterführenden' },
  weiterfuehrenden: { correct: 'weiterführenden', label: 'weiterführenden' },
  arztin: { correct: 'Ärztin', label: 'Ärztin' },
  aerztin: { correct: 'Ärztin', label: 'Ärztin' },
  starkung: { correct: 'Stärkung', label: 'Stärkung' },
  staerkung: { correct: 'Stärkung', label: 'Stärkung' },
  ruckens: { correct: 'Rückens', label: 'Rückens' },
  rueckens: { correct: 'Rückens', label: 'Rückens' },
  prazise: { correct: 'präzise', label: 'präzise' },
  praezise: { correct: 'präzise', label: 'präzise' },
  offentlich: { correct: 'öffentlich', label: 'öffentlich' },
  oeffentlich: { correct: 'öffentlich', label: 'öffentlich' },
  offentliche: { correct: 'öffentliche', label: 'öffentliche' },
  oeffentliche: { correct: 'öffentliche', label: 'öffentliche' },
  gunstiger: { correct: 'günstiger', label: 'günstiger' },
  guenstiger: { correct: 'günstiger', label: 'günstiger' },
  zusatzlichen: { correct: 'zusätzlichen', label: 'zusätzlichen' },
  zusaetzlichen: { correct: 'zusätzlichen', label: 'zusätzlichen' },
  olivenol: { correct: 'Olivenöl', label: 'Olivenöl' },
  olivenoel: { correct: 'Olivenöl', label: 'Olivenöl' },
  ungefahr: { correct: 'ungefähr', label: 'ungefähr' },
  ungefaehr: { correct: 'ungefähr', label: 'ungefähr' },
  grundliche: { correct: 'gründliche', label: 'gründliche' },
  gruendliche: { correct: 'gründliche', label: 'gründliche' },
  aufwarts: { correct: 'aufwärts', label: 'aufwärts' },
  aufwaerts: { correct: 'aufwärts', label: 'aufwärts' },
  hugel: { correct: 'Hügel', label: 'Hügel' },
  huegel: { correct: 'Hügel', label: 'Hügel' },
  geschirrspuler: { correct: 'Geschirrspüler', label: 'Geschirrspüler' },
  geschirrspueler: { correct: 'Geschirrspüler', label: 'Geschirrspüler' },
  auszuraumen: { correct: 'auszuräumen', label: 'auszuräumen' },
  auszuraeumen: { correct: 'auszuräumen', label: 'auszuräumen' },
  hauser: { correct: 'Häuser', label: 'Häuser' },
  haeuser: { correct: 'Häuser', label: 'Häuser' },
  uberstunden: { correct: 'Überstunden', label: 'Überstunden' },
  ueberstunden: { correct: 'Überstunden', label: 'Überstunden' },
  pensionar: { correct: 'Pensionär', label: 'Pensionär' },
  pensionaer: { correct: 'Pensionär', label: 'Pensionär' },
  kuche: { correct: 'Küche', label: 'Küche' },
  kueche: { correct: 'Küche', label: 'Küche' },
  mundliche: { correct: 'mündliche', label: 'mündliche' },
  muendliche: { correct: 'mündliche', label: 'mündliche' },
  prufung: { correct: 'Prüfung', label: 'Prüfung' },
  pruefung: { correct: 'Prüfung', label: 'Prüfung' },
  nervos: { correct: 'nervös', label: 'nervös' },
  nervoes: { correct: 'nervös', label: 'nervös' },
  mobel: { correct: 'Möbel', label: 'Möbel' },
  moebel: { correct: 'Möbel', label: 'Möbel' },
  zahne: { correct: 'Zähne', label: 'Zähne' },
  zaehne: { correct: 'Zähne', label: 'Zähne' },
  losung: { correct: 'Lösung', label: 'Lösung' },
  loesung: { correct: 'Lösung', label: 'Lösung' },
  personliche: { correct: 'persönliche', label: 'persönliche' },
  persoenliche: { correct: 'persönliche', label: 'persönliche' },
  personlichen: { correct: 'persönlichen', label: 'persönlichen' },
  persoenlichen: { correct: 'persönlichen', label: 'persönlichen' },
  dafur: { correct: 'dafür', label: 'dafür' },
  dafuer: { correct: 'dafür', label: 'dafür' },
  merkwurdig: { correct: 'merkwürdig', label: 'merkwürdig' },
  merkwuerdig: { correct: 'merkwürdig', label: 'merkwürdig' },
  horte: { correct: 'hörte', label: 'hörte' },
  hoerte: { correct: 'hörte', label: 'hörte' },
  vorstellungsgesprach: { correct: 'Vorstellungsgespräch', label: 'Vorstellungsgespräch' },
  vorstellungsgespraech: { correct: 'Vorstellungsgespräch', label: 'Vorstellungsgespräch' },
  wunderschon: { correct: 'wunderschön', label: 'wunderschön' },
  wunderschoen: { correct: 'wunderschön', label: 'wunderschön' },
  geschaft: { correct: 'Geschäft', label: 'Geschäft' },
  geschaeft: { correct: 'Geschäft', label: 'Geschäft' },
  korperliche: { correct: 'körperliche', label: 'körperliche' },
  koerperliche: { correct: 'körperliche', label: 'körperliche' },
  schones: { correct: 'schönes', label: 'schönes' },
  glaser: { correct: 'Gläser', label: 'Gläser' },
  glaeser: { correct: 'Gläser', label: 'Gläser' },
  draussen: { correct: 'draußen', label: 'draußen' },
  parkuberwacher: { correct: 'Parküberwacher', label: 'Parküberwacher' },
  parkueberwacher: { correct: 'Parküberwacher', label: 'Parküberwacher' }
};

export const DE_AMBIGUOUS_WORDS = {
  schon: 'schon ("already") OR "schön" ("beautiful") — review manually',
  wurde: 'wurde ("was", pass./aux.) OR "würde" ("would") — review manually',
  ware: 'ware (rare noun "goods") OR "wäre" ("would be") — review manually',
  konnte:
    'konnte ("could", simple past of "können") OR "könnte" ("could/would be able to", conditional) — review manually',
  mochte:
    'mochte ("liked/wanted", simple past of "mögen") OR "möchte" ("would like") — review manually',
  fuhren:
    'fuhren ("drove", simple past of "fahren") OR "führen" ("to lead/manage") — review manually'
};

/** German: ü/ö/ä → single-char (NFD strip) and → digraph (ue/oe/ae); ß → ss. */
export function degradeDE(word) {
  const lower = word.toLowerCase();
  const stripped = lower
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss');
  const digraph = lower
    .replace(/ü/g, 'ue')
    .replace(/ö/g, 'oe')
    .replace(/ä/g, 'ae')
    .replace(/ß/g, 'ss');
  return [...new Set([stripped, digraph])];
}

// ── Spanish ────────────────────────────────────────────────────────────

export const ES_COMMON_WORD_MAP = {
  dia: { correct: 'día', label: 'día' },
  dias: { correct: 'días', label: 'días' },
  aqui: { correct: 'aquí', label: 'aquí' },
  alli: { correct: 'allí', label: 'allí' },
  asi: { correct: 'así', label: 'así' },
  tambien: { correct: 'también', label: 'también' },
  segun: { correct: 'según', label: 'según' },
  anos: { correct: 'años', label: 'años' },
  ano: { correct: 'año', label: 'año' },
  manana: { correct: 'mañana', label: 'mañana' },
  senor: { correct: 'señor', label: 'señor' },
  senora: { correct: 'señora', label: 'señora' },
  senorita: { correct: 'señorita', label: 'señorita' },
  pequeno: { correct: 'pequeño', label: 'pequeño' },
  pequena: { correct: 'pequeña', label: 'pequeña' },
  nino: { correct: 'niño', label: 'niño' },
  nina: { correct: 'niña', label: 'niña' },
  ninos: { correct: 'niños', label: 'niños' },
  ninas: { correct: 'niñas', label: 'niñas' },
  espanol: { correct: 'español', label: 'español' },
  espanola: { correct: 'española', label: 'española' },
  musica: { correct: 'música', label: 'música' },
  telefono: { correct: 'teléfono', label: 'teléfono' },
  numero: { correct: 'número', label: 'número' },
  rapido: { correct: 'rápido', label: 'rápido' },
  rapida: { correct: 'rápida', label: 'rápida' },
  facil: { correct: 'fácil', label: 'fácil' },
  dificil: { correct: 'difícil', label: 'difícil' },
  util: { correct: 'útil', label: 'útil' },
  sabado: { correct: 'sábado', label: 'sábado' },
  miercoles: { correct: 'miércoles', label: 'miércoles' },
  jovenes: { correct: 'jóvenes', label: 'jóvenes' },
  articulo: { correct: 'artículo', label: 'artículo' },
  articulos: { correct: 'artículos', label: 'artículos' },
  ultimo: { correct: 'último', label: 'último' },
  ultima: { correct: 'última', label: 'última' },
  proximo: { correct: 'próximo', label: 'próximo' },
  proxima: { correct: 'próxima', label: 'próxima' },
  podia: { correct: 'podía', label: 'podía' },
  medico: { correct: 'médico', label: 'médico' },
  medica: { correct: 'médica', label: 'médica' },
  publico: { correct: 'público', label: 'público' },
  simpatico: { correct: 'simpático', label: 'simpático' },
  simpatica: { correct: 'simpática', label: 'simpática' },
  economico: { correct: 'económico', label: 'económico' },
  facilmente: { correct: 'fácilmente', label: 'fácilmente' },
  cafe: { correct: 'café', label: 'café' },
  explicacion: { correct: 'explicación', label: 'explicación' },
  ilusion: { correct: 'ilusión', label: 'ilusión' },
  tio: { correct: 'tío', label: 'tío' },
  tia: { correct: 'tía', label: 'tía' },
  saludo: { correct: 'saludó', label: 'saludó' },
  // "cualificada" used to self-map to itself here — harmless no-op, but
  // cluttered the fixable-issues report on already-correct text. Removed.
  esta_verb: { correct: 'está', label: 'está (verb)' },
  // Added after auditing a2 output round 2 — see scripts/outputs/audit-*-a2-draft-*.txt (2026-07-05)
  despues: { correct: 'después', label: 'después' },
  habia: { correct: 'había', label: 'había' },
  ademas: { correct: 'además', label: 'además' },
  periodico: { correct: 'periódico', label: 'periódico' },
  seccion: { correct: 'sección', label: 'sección' },
  pediatria: { correct: 'pediatría', label: 'pediatría' },
  oracion: { correct: 'oración', label: 'oración' },
  arreglarselas: { correct: 'arreglárselas', label: 'arreglárselas' },
  pantalon: { correct: 'pantalón', label: 'pantalón' },
  marron: { correct: 'marrón', label: 'marrón' },
  limon: { correct: 'limón', label: 'limón' },
  salmon: { correct: 'salmón', label: 'salmón' },
  cumpleanos: { correct: 'cumpleaños', label: 'cumpleaños' },
  ubicacion: { correct: 'ubicación', label: 'ubicación' },
  posicion: { correct: 'posición', label: 'posición' },
  colocacion: { correct: 'colocación', label: 'colocación' },
  pagina: { correct: 'página', label: 'página' },
  leccion: { correct: 'lección', label: 'lección' },
  vestibulo: { correct: 'vestíbulo', label: 'vestíbulo' },
  excursion: { correct: 'excursión', label: 'excursión' },
  cabana: { correct: 'cabaña', label: 'cabaña' },
  montana: { correct: 'montaña', label: 'montaña' },
  espana: { correct: 'España', label: 'España' },
  ingles: { correct: 'inglés', label: 'inglés' },
  autobus: { correct: 'autobús', label: 'autobús' },
  porteria: { correct: 'portería', label: 'portería' },
  somnifero: { correct: 'somnífero', label: 'somnífero' },
  somniferos: { correct: 'somníferos', label: 'somníferos' },
  solucion: { correct: 'solución', label: 'solución' },
  psicologico: { correct: 'psicológico', label: 'psicológico' },
  economica: { correct: 'económica', label: 'económica' },
  fantasticas: { correct: 'fantásticas', label: 'fantásticas' },
  fantastico: { correct: 'fantástico', label: 'fantástico' },
  espectaculo: { correct: 'espectáculo', label: 'espectáculo' },
  increible: { correct: 'increíble', label: 'increíble' },
  arandanos: { correct: 'arándanos', label: 'arándanos' },
  embolo: { correct: 'émbolo', label: 'émbolo' },
  panuelo: { correct: 'pañuelo', label: 'pañuelo' },
  trafico: { correct: 'tráfico', label: 'tráfico' },
  menu: { correct: 'menú', label: 'menú' },
  profesion: { correct: 'profesión', label: 'profesión' },
  operacion: { correct: 'operación', label: 'operación' },
  informacion: { correct: 'información', label: 'información' },
  fisica: { correct: 'física', label: 'física' },
  azucar: { correct: 'azúcar', label: 'azúcar' }
};

export const ES_AMBIGUOUS_WORDS = {
  que: 'que (relative "that/which") OR "qué" ("what", question) — review manually',
  como: 'como ("as/like"/"I eat") OR "cómo" ("how", question) — review manually',
  donde: 'donde ("where", relative) OR "dónde" ("where", question) — review manually',
  cuando: 'cuando ("when", relative) OR "cuándo" ("when", question) — review manually',
  quien: 'quien ("who", relative) OR "quién" ("who", question) — review manually',
  cuanto: 'cuanto ("as much as") OR "cuánto" ("how much", question) — review manually',
  cuantos: 'cuantos ("as many as") OR "cuántos" ("how many", question) — review manually',
  esta: 'esta ("this", fem.) OR "está" ("is/he-she-it-is") — review manually',
  estan: 'estan (rare) OR "están" ("they/you-pl are") — review manually',
  mas: 'mas ("but", literary) OR "más" ("more") — review manually',
  practico: 'practico ("I practice") OR "práctico" ("practical") — review manually'
};

/** Spanish: á/é/í/ó/ú/ñ → single-char (NFD strip handles all of these). */
export function degradeES(word) {
  const lower = word.toLowerCase();
  const stripped = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return [...new Set([stripped])];
}

// ── Shared text helpers ────────────────────────────────────────────────────

// \p{L} matches any Unicode letter, so this works for Norwegian æ/ø/å and
// German/Spanish special characters without a bespoke class per language.
//
// The (?<![\p{N}]) / (?![\p{N}]) guards exclude a letter-run that's glued
// directly (no space) to a digit on either side — e.g. "1A" (a classroom/
// grade label) would otherwise tokenize into a bare "a", which collides
// with the entry for degraded "å" and produces a false positive. A real
// standalone word is never digit-adjacent like this, so the guard only
// ever excludes label/code-style tokens, not genuine text.
export const WORD_RE = /(?<![\p{N}])[\p{L}']+(?![\p{N}])/gu;
export const CHUNK_RE = /(?<![\p{N}])[\p{L}']+(?![\p{N}])|[^\p{L}']+/gu;

export function tokens(text) {
  return (text || '').match(WORD_RE) || [];
}

/** Strip a trailing gender/article parenthetical for German/Spanish
 * headwords, e.g. "(der)"/"(la)", if the data ever carries one. */
export function bareWordIntl(value) {
  return (value || '').replace(/\s*\((der|die|das|el|la|los|las)\)\s*$/i, '').trim();
}

/** Splits a possibly multi-value translation field like "Gebühr, Abgabe,
 * Steuer" or "volverse/quedarse" into its individual candidate words, so
 * the headword-vs-example diacritic check can test each alternative on
 * its own instead of degrading the whole comma/slash-separated string as
 * a single "word" — which never matches any one token in the example
 * sentence and silently disables the check. This was the root cause of
 * entries like avgift's "Gebühr, Abgabe, Steuer" never getting flagged
 * even though the example used the degraded "Gebuhr". */
export function splitTranslationAlternatives(value) {
  return (value || '')
    .split(/[,/;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Applies one or more headword fixes (each { degradedForms, correct })
 * plus a common-word map to `text`, in sequence. Centralizes what used to
 * be duplicated, buggy merge logic in the two find-diacritic-issues*
 * scripts, which collapsed multiple distinct headword fixes into a single
 * merged degradedForms set + "last correct wins" — silently corrupting
 * whichever fix wasn't last when an entry had more than one flagged
 * headword alternative. Applying them one at a time avoids that. */
export function applyFixes(text, headwordFixes, wordMap) {
  if (!text) return text;
  if (!headwordFixes || headwordFixes.length === 0) {
    return fixText(text, null, null, wordMap);
  }
  let result = text;
  for (const hf of headwordFixes) {
    result = fixText(result, hf.degradedForms, hf.correct, wordMap);
  }
  return result;
}

export function matchCase(original, replacement) {
  if (original === original.toUpperCase() && original.length > 1) return replacement.toUpperCase();
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/** Corrects known-degraded tokens in `text`: any token matching one of
 * `headwordDegradedForms` → `headwordCorrect`; any token in `wordMap` → its
 * correct form. Case of the original token is preserved. */
export function fixText(text, headwordDegradedForms, headwordCorrect, wordMap) {
  if (!text) return text;
  return text.replace(CHUNK_RE, (chunk) => {
    if (!/\p{L}/u.test(chunk)) return chunk;
    const lower = chunk.toLowerCase();
    if (headwordDegradedForms && headwordDegradedForms.has(lower)) {
      return matchCase(chunk, headwordCorrect);
    }
    if (Object.prototype.hasOwnProperty.call(wordMap, lower)) {
      return matchCase(chunk, wordMap[lower].correct);
    }
    return chunk;
  });
}

/**
 * Runs the headword check (own word degraded in its own example) and the
 * common-word check (any word in wordMap degraded, anywhere in the given
 * fields) for one language against one entry-like object.
 *
 * @param {object} opts
 * @param {string} opts.headword           the entry's own word in this language (e.g. entry.norsk, entry.german)
 * @param {string[]} opts.fields           values to run the common-word scan over (e.g. [german, example_german])
 * @param {RegExp} opts.specialChars       regex matching this language's special characters
 * @param {(word: string) => string[]} opts.degrade
 * @param {(value: string) => string} opts.bareWord
 * @param {Record<string, {correct: string, label: string}>} opts.wordMap
 * @param {Record<string, string>} opts.ambiguousWords
 * @param {string} opts.exampleField       field name to check the headword against (for the "example" text)
 * @param {string} opts.exampleValue       the example text
 */
export function checkLanguage({
  headword,
  fields,
  specialChars,
  degrade,
  bareWord,
  wordMap,
  ambiguousWords,
  exampleField,
  exampleValue
}) {
  const issues = [];
  const ambiguous = [];
  const headwordFixes = [];

  // A translation field can carry several comma/slash-separated
  // alternatives (e.g. "Gebühr, Abgabe, Steuer" or "volverse/quedarse") —
  // check each candidate word on its own rather than degrading the whole
  // string as a single "word", which would never match a single token in
  // the example sentence.
  const exampleTokensLower = new Set(tokens(exampleValue).map((t) => t.toLowerCase()));
  for (const alt of splitTranslationAlternatives(headword)) {
    const word = bareWord(alt);
    if (!word || !specialChars.test(word)) continue;
    const degradedForms = degrade(word);
    for (const form of degradedForms) {
      if (exampleTokensLower.has(form)) {
        issues.push({
          kind: 'headword',
          field: exampleField,
          detail: `own word is "${word}" (from "${headword}") but ${exampleField} uses degraded form "${form}"`
        });
        headwordFixes.push({ degradedForms: new Set(degradedForms), correct: word });
        break;
      }
    }
  }

  for (const { name, value } of fields) {
    if (!value) continue;
    for (const tok of tokens(value).map((t) => t.toLowerCase())) {
      if (Object.prototype.hasOwnProperty.call(wordMap, tok)) {
        issues.push({
          kind: 'common-word',
          field: name,
          detail: `"${name}" contains "${tok}" (likely degraded "${wordMap[tok].label}")`
        });
      } else if (Object.prototype.hasOwnProperty.call(ambiguousWords, tok)) {
        ambiguous.push({
          kind: 'ambiguous',
          field: name,
          detail: `"${name}" contains "${tok}" — ${ambiguousWords[tok]}`
        });
      }
    }
  }

  return { issues, ambiguous, headwordFixes };
}

// ── Spanish ¿/¡ punctuation ─────────────────────────────────────────────

// A literal "?" or a lowercase "i" glued directly (no space) to a following
// capital letter is never legitimate Spanish — it's what a mangled ¿/¡
// degrades to (seen e.g. as "?Puedes...?" or "iPuedes...?").
export const CORRUPTED_OPENER_RE = /(\?|i)(?=[A-ZÁÉÍÓÚÑ])/g;

export function findSpanishPunctuationIssues(exampleText, fieldName = 'example_spanish') {
  const issues = [];
  if (!exampleText) return issues;
  const trimmed = exampleText.trim();
  const hasCorruptedOpener = CORRUPTED_OPENER_RE.test(trimmed);
  CORRUPTED_OPENER_RE.lastIndex = 0;

  // Note: check for the opening mark ANYWHERE in the sentence, not just at
  // position 0 — a real Spanish question/exclamation is only required to
  // open at the start of its own clause, which is often preceded by other
  // text (e.g. "Perdone, ¿aceptan tarjeta?", "Oye, ¡cuidado!"). Requiring
  // it at the very start of the whole string produced false positives on
  // exactly this (very common) sentence shape.
  if (/\?\s*$/.test(trimmed) && !trimmed.includes('¿')) {
    issues.push({
      kind: 'punctuation',
      field: fieldName,
      detail: hasCorruptedOpener
        ? `${fieldName} has a mangled "¿" (stray "?"/"i" before a capital letter) instead of the real mark: "${trimmed}"`
        : `${fieldName} ends in "?" but does not contain an opening "¿": "${trimmed}"`
    });
  }
  if (/!\s*$/.test(trimmed) && !trimmed.includes('¡')) {
    issues.push({
      kind: 'punctuation',
      field: fieldName,
      detail: hasCorruptedOpener
        ? `${fieldName} has a mangled "¡" (stray "?"/"i" before a capital letter) instead of the real mark: "${trimmed}"`
        : `${fieldName} ends in "!" but does not contain an opening "¡": "${trimmed}"`
    });
  }
  return issues;
}

// ── German multi-word disambiguation ────────────────────────────────────
//
// A handful of "ambiguous" German words (see DE_AMBIGUOUS_WORDS) are only
// ambiguous in isolation — in specific fixed collocations the surrounding
// words settle the question and the ASCII form is unambiguously wrong.
// These are found via audits (see scripts/outputs/diacritic-issues-all-b2-
// prod-2026-07-07T11-25-37.txt): 3 confirmed "fuhren zu" → "führen zu" and
// 1 confirmed "... ware" (after "ob") → "wäre" out of ~150 German ambiguous
// flags at B2. Kept intentionally narrow — each rule only fires on the
// specific collocation that resolved the ambiguity, not on the bare word,
// so it can't silently corrupt the many genuinely-correct "fuhren" ("drove")
// or "ware" ("goods") occurrences.
export const DE_BIGRAM_RULES = [
  {
    // "fuhren zu" is the collocation "führen zu" ("lead to"); "fahren zu"
    // ("drove to") does not pattern with this construction in this corpus
    // (the one genuine "fuhren" = "drove" case had no following "zu").
    re: /\bfuhren(\s+zu)\b/gi,
    label: '"fuhren zu" → "führen zu"',
    fix: (match) => match.replace(/fuhren/i, (w) => matchCase(w, 'führen'))
  },
  {
    // "ob ... ware" (as in "als ob man ... ware") is always subjunctive II
    // ("as if ... were"), which requires "wäre" — "ob" forces the
    // counterfactual reading regardless of how far away "ware" sits.
    re: /\bob\b(?:(?!\.|\?|!).){0,40}?\bware\b/gi,
    label: '"ob ... ware" → "... wäre" (subjunctive)',
    fix: (match) => match.replace(/\bware\b/i, (w) => matchCase(w, 'wäre'))
  }
];

/** Finds German bigram-disambiguated issues in `text` — narrowly-scoped
 * collocations where an otherwise-ambiguous word (see DE_AMBIGUOUS_WORDS)
 * is unambiguous given its neighbors. Returns fixable issues, not ambiguous
 * ones. */
export function findGermanBigramIssues(text, fieldName) {
  const issues = [];
  if (!text) return issues;
  for (const rule of DE_BIGRAM_RULES) {
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(text))) {
      issues.push({
        kind: 'bigram',
        field: fieldName,
        detail: `"${fieldName}" contains "${m[0]}" — ${rule.label}`
      });
    }
  }
  return issues;
}

export function fixGermanBigrams(text) {
  if (!text) return text;
  let result = text;
  for (const rule of DE_BIGRAM_RULES) {
    result = result.replace(rule.re, rule.fix);
  }
  return result;
}

export function fixSpanishPunctuation(exampleText) {
  if (!exampleText) return exampleText;

  const corrected = exampleText.replace(CORRUPTED_OPENER_RE, (match, char, offset, full) => {
    const rest = full.slice(offset + match.length);
    const nextQ = rest.indexOf('?');
    const nextE = rest.indexOf('!');
    const isExclaim = nextE !== -1 && (nextQ === -1 || nextE < nextQ);
    return isExclaim ? '¡' : '¿';
  });

  if (corrected !== exampleText) return corrected;

  let fixed = corrected;
  const trimmed = fixed.trim();
  // Same "anywhere in the string", not "only at position 0", rule as
  // findSpanishPunctuationIssues above — otherwise this would insert a
  // redundant, wrong leading ¿/¡ into sentences that already correctly
  // open their question/exclamation clause mid-string.
  if (/\?\s*$/.test(trimmed) && !trimmed.includes('¿')) {
    fixed = fixed.replace(/^(\s*)/, `$1¿`);
  } else if (/!\s*$/.test(trimmed) && !trimmed.includes('¡')) {
    fixed = fixed.replace(/^(\s*)/, `$1¡`);
  }
  return fixed;
}
