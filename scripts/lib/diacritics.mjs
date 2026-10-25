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
  // "fole" (foal) is a real noun ("sprek som en fole"), not just a degraded "føle".
  // See NO_AMBIGUOUS_WORDS / resolveNoFole.
  foler: { correct: 'føler', label: 'føler' },
  // "fore" is deliberately NOT mapped here — "ha noe fore" (to have something
  // planned) is a genuine idiom, so "fore" is a real word, not just a degraded
  // "føre". See NO_AMBIGUOUS_WORDS / resolveNoFore.
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
  kjokken: { correct: 'kjøkken', label: 'kjøkken' },

  // Corpus-scan additions (2026-10-24): unaccented form has no valid reading.
  doren: { correct: 'døren', label: 'døren' },
  innforte: { correct: 'innførte', label: 'innførte' },
  vaken: { correct: 'våken', label: 'våken' },
  vaknet: { correct: 'våknet', label: 'våknet' }
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
  fore: 'fore ("ha noe fore" = have planned) OR "føre" ("to lead") — review manually',
  fole: 'fole ("foal", noun) OR "føle" ("to feel") — review manually',
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
  // "nahe" (near, adj./adv.) is a real word — the old map entry turned "sehr nahe"
  // into "sehr Nähe". See DE_AMBIGUOUS_WORDS / resolveDE.
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
  parkueberwacher: { correct: 'Parküberwacher', label: 'Parküberwacher' },
  behutet: { correct: 'behütet', label: 'behütet' },
  behuetet: { correct: 'behütet', label: 'behütet' },
  kunstliche: { correct: 'künstliche', label: 'künstliche' },
  kuenstliche: { correct: 'künstliche', label: 'künstliche' },
  rueckschlagen: { correct: 'Rückschlägen', label: 'Rückschlägen' },
  fuhrung: { correct: 'Führung', label: 'Führung' },
  fuhrungskraft: { correct: 'Führungskraft', label: 'Führungskraft' },

  // Corpus-scan additions (2026-10-24): unaccented form has no valid reading.
  abschliessen: { correct: 'abschließen', label: 'abschließen' },
  aktivitat: { correct: 'aktivität', label: 'aktivität' },
  altere: { correct: 'ältere', label: 'ältere' },
  assen: { correct: 'aßen', label: 'aßen' },
  atmosphare: { correct: 'atmosphäre', label: 'atmosphäre' },
  behorden: { correct: 'behörden', label: 'behörden' },
  bekampfen: { correct: 'bekämpfen', label: 'bekämpfen' },
  beschaftigt: { correct: 'beschäftigt', label: 'beschäftigt' },
  betruger: { correct: 'betrüger', label: 'betrüger' },
  bevolkerung: { correct: 'bevölkerung', label: 'bevölkerung' },
  bucher: { correct: 'bücher', label: 'bücher' },
  diat: { correct: 'diät', label: 'diät' },
  durchgefuhrt: { correct: 'durchgeführt', label: 'durchgeführt' },
  enthullen: { correct: 'enthüllen', label: 'enthüllen' },
  enttauschung: { correct: 'enttäuschung', label: 'enttäuschung' },
  erbarmlich: { correct: 'erbärmlich', label: 'erbärmlich' },
  erhohen: { correct: 'erhöhen', label: 'erhöhen' },
  erklart: { correct: 'erklärt', label: 'erklärt' },
  ermoglichen: { correct: 'ermöglichen', label: 'ermöglichen' },
  ermoglicht: { correct: 'ermöglicht', label: 'ermöglicht' },
  erwagt: { correct: 'erwägt', label: 'erwägt' },
  erwahnen: { correct: 'erwähnen', label: 'erwähnen' },
  erzahlen: { correct: 'erzählen', label: 'erzählen' },
  fahigkeit: { correct: 'fähigkeit', label: 'fähigkeit' },
  fahigkeiten: { correct: 'fähigkeiten', label: 'fähigkeiten' },
  fuhrungskrafte: { correct: 'führungskräfte', label: 'führungskräfte' },
  funf: { correct: 'fünf', label: 'fünf' },
  gefahrlich: { correct: 'gefährlich', label: 'gefährlich' },
  gefuhl: { correct: 'gefühl', label: 'gefühl' },
  gegenuber: { correct: 'gegenüber', label: 'gegenüber' },
  gehort: { correct: 'gehört', label: 'gehört' },
  geoffnet: { correct: 'geöffnet', label: 'geöffnet' },
  gepragt: { correct: 'geprägt', label: 'geprägt' },
  gerausch: { correct: 'geräusch', label: 'geräusch' },
  gesprach: { correct: 'gespräch', label: 'gespräch' },
  gewahlt: { correct: 'gewählt', label: 'gewählt' },
  gewohnlich: { correct: 'gewöhnlich', label: 'gewöhnlich' },
  grunden: { correct: 'gründen', label: 'gründen' },
  grundete: { correct: 'gründete', label: 'gründete' },
  haufig: { correct: 'häufig', label: 'häufig' },
  hauptsachlich: { correct: 'hauptsächlich', label: 'hauptsächlich' },
  hinzufugen: { correct: 'hinzufügen', label: 'hinzufügen' },
  horen: { correct: 'hören', label: 'hören' },
  integritat: { correct: 'integrität', label: 'integrität' },
  jager: { correct: 'jäger', label: 'jäger' },
  koder: { correct: 'köder', label: 'köder' },
  korper: { correct: 'körper', label: 'körper' },
  kriminalitat: { correct: 'kriminalität', label: 'kriminalität' },
  kuhl: { correct: 'kühl', label: 'kühl' },
  kuhlschrank: { correct: 'kühlschrank', label: 'kühlschrank' },
  kummern: { correct: 'kümmern', label: 'kümmern' },
  kummert: { correct: 'kümmert', label: 'kümmert' },
  kuste: { correct: 'küste', label: 'küste' },
  larm: { correct: 'lärm', label: 'lärm' },
  lastig: { correct: 'lästig', label: 'lästig' },
  marchen: { correct: 'märchen', label: 'märchen' },
  militar: { correct: 'militär', label: 'militär' },
  mittelmassig: { correct: 'mittelmäßig', label: 'mittelmäßig' },
  offnete: { correct: 'öffnete', label: 'öffnete' },
  personliches: { correct: 'persönliches', label: 'persönliches' },
  plotzlich: { correct: 'plötzlich', label: 'plötzlich' },
  punktlich: { correct: 'pünktlich', label: 'pünktlich' },
  qualitat: { correct: 'qualität', label: 'qualität' },
  schamen: { correct: 'schämen', label: 'schämen' },
  spater: { correct: 'später', label: 'später' },
  stadten: { correct: 'städten', label: 'städten' },
  standigen: { correct: 'ständigen', label: 'ständigen' },
  tur: { correct: 'tür', label: 'tür' },
  ubersehen: { correct: 'übersehen', label: 'übersehen' },
  ubersetzen: { correct: 'übersetzen', label: 'übersetzen' },
  ubertragen: { correct: 'übertragen', label: 'übertragen' },
  ubertrieben: { correct: 'übertrieben', label: 'übertrieben' },
  ubrig: { correct: 'übrig', label: 'übrig' },
  unabhangig: { correct: 'unabhängig', label: 'unabhängig' },
  unmoglich: { correct: 'unmöglich', label: 'unmöglich' },
  unterstutzen: { correct: 'unterstützen', label: 'unterstützen' },
  unterstutzt: { correct: 'unterstützt', label: 'unterstützt' },
  ursprunglich: { correct: 'ursprünglich', label: 'ursprünglich' },
  verandert: { correct: 'verändert', label: 'verändert' },
  verhaltnis: { correct: 'verhältnis', label: 'verhältnis' },
  veroffentlichen: { correct: 'veröffentlichen', label: 'veröffentlichen' },
  verstosst: { correct: 'verstößt', label: 'verstößt' },
  vollstandig: { correct: 'vollständig', label: 'vollständig' },
  weiterfuhrende: { correct: 'weiterführende', label: 'weiterführende' },
  wohlfuhlen: { correct: 'wohlfühlen', label: 'wohlfühlen' },
  wortern: { correct: 'wörtern', label: 'wörtern' },
  wuste: { correct: 'wüste', label: 'wüste' },
  zerreissen: { correct: 'zerreißen', label: 'zerreißen' },
  zuruckgeben: { correct: 'zurückgeben', label: 'zurückgeben' },
  zuruckzukehren: { correct: 'zurückzukehren', label: 'zurückzukehren' },
  zusammenreissen: { correct: 'zusammenreißen', label: 'zusammenreißen' }
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
    'fuhren ("drove", simple past of "fahren") OR "führen" ("to lead/manage") — review manually',
  nahe: 'nahe ("near", adj./adv.) OR "Nähe" ("proximity", noun) — review manually'
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
  // "saludo" (I greet / a greeting) vs "saludó" (greeted) is ambiguous — the
  // old map entry silently "fixed" correct present-tense "Saludo al vecino".
  // See ES_AMBIGUOUS_WORDS.
  // Added after auditing a2 output round 2 — see scripts/outputs/audit-*-a2-draft-*.txt (2026-07-05)
  despues: { correct: 'después', label: 'después' },
  // "mas" ("but", literary) never occurs in this corpus; unaccented "mas" is
  // always a degraded "más" ("mas tarde", "una vez mas").
  mas: { correct: 'más', label: 'más' },
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
  azucar: { correct: 'azúcar', label: 'azúcar' },
  generacion: { correct: 'generación', label: 'generación' },
  especializacion: { correct: 'especialización', label: 'especialización' },

  // Corpus-scan additions (2026-10-24): unaccented form has no valid reading.
  balon: { correct: 'balón', label: 'balón' },
  banarse: { correct: 'bañarse', label: 'bañarse' },
  cajon: { correct: 'cajón', label: 'cajón' },
  camion: { correct: 'camión', label: 'camión' },
  companero: { correct: 'compañero', label: 'compañero' },
  creia: { correct: 'creía', label: 'creía' },
  demostro: { correct: 'demostró', label: 'demostró' },
  desafio: { correct: 'desafío', label: 'desafío' },
  dramatico: { correct: 'dramático', label: 'dramático' },
  electronico: { correct: 'electrónico', label: 'electrónico' },
  electronicos: { correct: 'electrónicos', label: 'electrónicos' },
  ensena: { correct: 'enseña', label: 'enseña' },
  ensenar: { correct: 'enseñar', label: 'enseñar' },
  esqui: { correct: 'esquí', label: 'esquí' },
  exigio: { correct: 'exigió', label: 'exigió' },
  extrana: { correct: 'extraña', label: 'extraña' },
  extrano: { correct: 'extraño', label: 'extraño' },
  frio: { correct: 'frío', label: 'frío' },
  futbol: { correct: 'fútbol', label: 'fútbol' },
  gustaria: { correct: 'gustaría', label: 'gustaría' },
  higienico: { correct: 'higiénico', label: 'higiénico' },
  jardin: { correct: 'jardín', label: 'jardín' },
  lagrima: { correct: 'lágrima', label: 'lágrima' },
  lena: { correct: 'leña', label: 'leña' },
  mayoria: { correct: 'mayoría', label: 'mayoría' },
  mecanico: { correct: 'mecánico', label: 'mecánico' },
  montanas: { correct: 'montañas', label: 'montañas' },
  pais: { correct: 'país', label: 'país' },
  pequenos: { correct: 'pequeños', label: 'pequeños' },
  pidio: { correct: 'pidió', label: 'pidió' },
  reune: { correct: 'reúne', label: 'reúne' },
  reunion: { correct: 'reunión', label: 'reunión' },
  sabados: { correct: 'sábados', label: 'sábados' },
  sofa: { correct: 'sofá', label: 'sofá' },
  sueter: { correct: 'suéter', label: 'suéter' },
  tenia: { correct: 'tenía', label: 'tenía' }
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
  saludo: 'saludo ("I greet"/"greeting") OR "saludó" ("he/she greeted") — review manually',
  practico: 'practico ("I practice") OR "práctico" ("practical") — review manually'
};

// ── Context resolvers for ambiguous words ───────────────────────────────────
//
// The *_AMBIGUOUS_WORDS lists flag words that are valid both with and without
// a diacritic. Many occurrences are settled by grammar alone, so each
// resolver below returns true when the surrounding words show the unaccented
// form is the correct one — that occurrence is then not reported. Rules are
// linguistic (part of speech / sentence type), never per-entry. When in
// doubt a resolver returns false, so the word stays flagged for manual review.
//
// ctx = { toks: [{ word, lower, index }], i, text, field }

// Norwegian "far" = "father" after a possessive/article; "får" = "gets" is a
// verb that follows a subject, not a determiner.
const NO_FAR_NOUN_PRECEDERS = new Set([
  'min',
  'din',
  'sin',
  'vår',
  'hans',
  'hennes',
  'deres',
  'en',
  'hver',
  'ens',
  'felles'
]);

// ── Shared helpers for the resolvers below ────────────────────────────────

/** Nearest non-space character before `index` ('' at the start of the text). */
function charBefore(text, index) {
  let k = index - 1;
  while (k >= 0 && /\s/.test(text[k])) k--;
  return k >= 0 ? text[k] : '';
}

/** True when the token at `index` opens a sentence/quote/dialogue line. */
function isSentenceInitial(text, index) {
  return /^(|[.!?¿¡:"“«\-–—])$/.test(charBefore(text, index));
}

/** A bare headword ("que", "schon") has no sentence of its own to judge by, so
 * judge it by how the entry's own example uses the same word. */
function headwordMatchesExample(word, ctx, exampleField, resolve) {
  const { entry, viaHeadword } = ctx;
  if (viaHeadword || !entry || !entry[exampleField]) return false;
  const exToks = tokensWithIndex(entry[exampleField]);
  const j = exToks.findIndex((t) => t.lower === word);
  if (j < 0) return false;
  return resolve(word, {
    toks: exToks,
    i: j,
    text: entry[exampleField],
    field: exampleField,
    entry,
    viaHeadword: true
  });
}

// ── Norwegian resolvers ───────────────────────────────────────────────

const NO_SUBJECT_PRONOUNS = new Set([
  'jeg',
  'du',
  'han',
  'hun',
  'den',
  'det',
  'vi',
  'dere',
  'de',
  'man',
  'hen',
  'som',
  'hvem',
  'hva'
]);
const NO_COMMON_FINITE_VERBS = new Set([
  'går',
  'kan',
  'vil',
  'skal',
  'må',
  'er',
  'har',
  'ble',
  'kom',
  'fikk',
  'tar',
  'ser',
  'gjør'
]);
// Words after which a verb must be in the infinitive ("gå"), never past ("ga").
const NO_INFINITIVE_TRIGGERS = new Set([
  'å',
  'kan',
  'skal',
  'vil',
  'må',
  'bør',
  'ville',
  'kunne',
  'skulle',
  'måtte',
  'burde',
  'la',
  'lar',
  'lot'
]);
const NO_MODALS = new Set([
  'kan',
  'skal',
  'vil',
  'må',
  'bør',
  'ville',
  'kunne',
  'skulle',
  'måtte',
  'burde'
]);
const NO_SKIPPED_ADVERBS = new Set([
  'ikke',
  'aldri',
  'bare',
  'alltid',
  'ofte',
  'også',
  'snart',
  'nå',
  'gjerne',
  'sikkert'
]);
// Extra adverbs that can sit between a subject and "sa" (only used by resolveNoSa).
const NO_SA_EXTRA_ADVERBS = new Set(['nettopp', 'først', 'akkurat', 'allerede', 'da']);
const NO_FAR_PREDICATE_VERBS = new Set(['bli', 'blir', 'ble', 'vært', 'er', 'var']);
const NO_VARE_NOUN_PRECEDERS = new Set([
  'ta',
  'tar',
  'tok',
  'tatt',
  'en',
  'noen',
  'hver',
  'denne',
  'hele',
  'ny'
]);

export function resolveNO(word, ctx) {
  if (word === 'far') return resolveNoFar(ctx);
  if (word === 'fore') return resolveNoFore(ctx);
  if (word === 'fole') return resolveNoFole(ctx);
  if (word === 'ga') return resolveNoGa(ctx);
  if (word === 'sa') return resolveNoSa(ctx);
  if (word === 'vare') return resolveNoVare(ctx);
  return false;
}

// "fore" in "ha (noe) fore" (= have planned) is a real word; "føre" (to lead)
// is not preceded by a form of "ha". Only resolve when "ha" is close by.
const NO_HA_FORMS = new Set(['ha', 'har', 'hadde', 'hatt']);
function resolveNoFore({ toks, i }) {
  for (let j = Math.max(0, i - 3); j < i; j++) {
    if (NO_HA_FORMS.has(toks[j].lower)) return true;
  }
  return false;
}

// "fole" (foal) follows an article/adjective ("en fole", "en ung fole") or is a
// gendered headword ("fole (en)"); "føle" (to feel) is a verb.
const NO_FOLE_NOUN_PRECEDERS = new Set(['en', 'ei', 'et', 'liten', 'ung', 'den', 'hver']);
function resolveNoFole({ toks, i, text, field }) {
  const prev = toks[i - 1]?.lower;
  if (prev && NO_FOLE_NOUN_PRECEDERS.has(prev)) return true;
  if ((field === 'norsk' || field === 'lemma') && i === 0 && /\((en|ei|en\/ei)\)/i.test(text)) {
    return true;
  }
  return false;
}

// "ga" (gave) is correct as a finite past verb; "gå" (go) is required after
// å/modals ("kan gå", "kan du gå") and in imperatives ("Gå hjem!").
function resolveNoGa({ toks, i, text }) {
  if (toks.length === 1 || isSentenceInitial(text, toks[i].index)) return false;
  let j = i - 1;
  while (j >= 0 && NO_SKIPPED_ADVERBS.has(toks[j].lower)) j--;
  const p = toks[j]?.lower;
  if (!p || NO_INFINITIVE_TRIGGERS.has(p)) return false;
  if (NO_SUBJECT_PRONOUNS.has(p) && NO_MODALS.has(toks[j - 1]?.lower)) return false;
  return true;
}

// "sa" (said) follows its subject ("han sa", "det man sa", "hva sa du"), leads
// "at"-clauses, or opens a speech tag ("…, sa læreren"). "så" (so/then) does not.
function resolveNoSa({ toks, i, text }) {
  if (toks.length === 1) return false;
  // Skip adverbs between subject and verb ("det man nettopp sa", "man sa først").
  let j = i - 1;
  while (
    j >= 0 &&
    (NO_SKIPPED_ADVERBS.has(toks[j].lower) || NO_SA_EXTRA_ADVERBS.has(toks[j].lower))
  )
    j--;
  const prev = toks[j]?.lower;
  const next = toks[i + 1]?.lower;
  if (prev && NO_SUBJECT_PRONOUNS.has(prev)) return true;
  if (next === 'at' || next === 'ja' || next === 'nei') return true;
  if (
    charBefore(text, toks[i].index) === ',' &&
    next &&
    !NO_SUBJECT_PRONOUNS.has(next) &&
    !NO_COMMON_FINITE_VERBS.has(next)
  ) {
    return true;
  }
  return false;
}

// "vare" (goods; "ta vare på" = take care of) vs "våre" (our) / "være" (be).
function resolveNoVare({ toks, i }) {
  const prev = toks[i - 1]?.lower;
  return !!prev && NO_VARE_NOUN_PRECEDERS.has(prev);
}

function resolveNoFar({ toks, i, text, field, entry }) {
  const prev = toks[i - 1]?.lower;
  // One-word definition "far" of a masculine/feminine entry ("fatter (en)") —
  // "sheep" would be neuter ("et får"), so this can only be "father".
  if (
    field === 'definition' &&
    toks.length === 1 &&
    /\((en|ei|en\/ei)\)/i.test(entry?.norsk || '')
  ) {
    return true;
  }
  if (prev && NO_FAR_NOUN_PRECEDERS.has(prev)) return true;
  // "mor og far" / "mor, far og barn" — coordinated kinship nouns.
  if (prev === 'mor') return true;
  // "bli/er far" — predicate noun ("bli far til lam"); sheep would need "et får".
  if (prev && NO_FAR_PREDICATE_VERBS.has(prev)) return true;
  if (prev === 'og' && toks[i - 2]?.lower === 'mor') return true;
  // Headword "far (en)": masculine noun marker → "father" ("sheep" is "et får").
  if ((field === 'norsk' || field === 'lemma') && i === 0 && /\((en|ei|en\/ei)\)/i.test(text)) {
    return true;
  }
  // Bare "lemma" is a copy of "norsk" without the gender marker — use it.
  if (field === 'lemma' && toks.length === 1 && /\((en|ei|en\/ei)\)/i.test(entry?.norsk || '')) {
    return true;
  }
  return false;
}

// German "wurde" (past of "werden") vs "würde" (conditional). The conditional
// is signalled by a conditional/wish cue in the same sentence.
const DE_CONDITIONAL_CUES = new Set([
  'wenn',
  'falls',
  'ob',
  'gern',
  'gerne',
  'lieber',
  'sonst',
  'vielleicht',
  'stelle'
]);

const DE_SUBJECT_PRONOUNS = new Set(['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'man']);
// "fuhren" (drove) is followed by a direction/means ("fuhren durch den Tunnel");
// "führen" (lead) takes an object or "zu" — "zu/zum/zur" is deliberately absent
// because both verbs fit there.
const DE_MOTION_FOLLOWERS = new Set([
  'durch',
  'nach',
  'in',
  'ins',
  'mit',
  'über',
  'am',
  'an',
  'auf',
  'aus',
  'bis',
  'los',
  'ab',
  'weg',
  'zurück',
  'hinaus',
  'hinein',
  'vorbei',
  'herum'
]);

// Direction words that settle "fuhren" (drove) when they sit anywhere near it in
// the clause ("fuhren Jetski entlang des Strandes", "fuhren aufs Geratewohl
// dorthin"). "zu/zur/zum" are deliberately absent: "führen zu(r)" is common.
const DE_FUHREN_DIRECTION_CUES = new Set(['entlang', 'dorthin', 'dahin', 'aufs']);

export function resolveDE(word, ctx) {
  const { toks, i, text } = ctx;
  // Lowercase "nahe" is the adjective/adverb; only a capitalised "Nahe" could be a
  // degraded noun "Nähe".
  if (word === 'nahe') return toks[i].word === 'nahe';
  if (word === 'schon') {
    if (toks.length === 1) return headwordMatchesExample(word, ctx, 'example_german', resolveDE);
    // "Bist du schon fertig?" — "schon" (already) right after a subject pronoun.
    return DE_SUBJECT_PRONOUNS.has(toks[i - 1]?.lower);
  }
  if (word === 'fuhren') {
    if (toks.length <= 1) return false;
    // Allow an inverted subject pronoun: "fuhren wir nach Spanien".
    let k = i + 1;
    if (DE_SUBJECT_PRONOUNS.has(toks[k]?.lower)) k++;
    if (DE_MOTION_FOLLOWERS.has(toks[k]?.lower)) return true;
    for (let d = -4; d <= 4; d++) {
      if (d !== 0 && DE_FUHREN_DIRECTION_CUES.has(toks[i + d]?.lower)) return true;
    }
    return false;
  }
  if (word === 'wurde' || word === 'konnte') {
    if (toks.length === 1) return false;
    // Past tense unless a conditional cue, or a sentence-initial (question) position.
    if (isSentenceInitial(text, toks[i].index)) return false;
    // "stelle" only counts as a cue when it is the lowercase verb ("ich stelle mir
    // vor"), not the capitalised noun "Stelle" (job/position).
    return !toks.some(
      (t) => DE_CONDITIONAL_CUES.has(t.lower) && !(t.lower === 'stelle' && t.word !== 'stelle')
    );
  }
  return false;
}

// Spanish interrogatives/exclamatives (que, como, cuando, …) need an accent
// only when they ask or exclaim; as conjunctions/relatives they must not have
// one. So they are only worth flagging inside ¿…? / ¡…! (at the start of the
// clause or after a preposition) or after an indirect-question verb.
const ES_INTERROGATIVES = new Set(['que', 'como', 'donde', 'cuando', 'quien', 'cuanto', 'cuantos']);
const ES_PREPOSITIONS = new Set([
  'a',
  'de',
  'en',
  'por',
  'para',
  'con',
  'desde',
  'hasta',
  'sobre',
  'hacia',
  'entre'
]);
const ES_INDIRECT_TRIGGERS = new Set([
  'sé',
  'sabes',
  'sabe',
  'saber',
  'saben',
  'sabemos',
  'pregunto',
  'preguntas',
  'pregunta',
  'preguntar',
  'dime',
  'dígame',
  'explica',
  'explícame',
  'explicar',
  'entiendo',
  'entiendes',
  'entender',
  'depende',
  'averigua',
  'imagino'
]);
// "¡Qué bien!" (exclamative, accent) vs "¡Que duermas bien!" (optative "que", no accent).
const ES_EXCLAMATIVE_COMPLEMENTS = new Set([
  'bien',
  'mal',
  'bonito',
  'bonita',
  'lindo',
  'linda',
  'guay',
  'rico',
  'rica',
  'bueno',
  'buena',
  'pena',
  'lástima',
  'día',
  'suerte',
  'sorpresa',
  'alegría',
  'calor',
  'frío',
  'rápido',
  'fácil',
  'difícil',
  'horror',
  'vergüenza',
  'barbaridad',
  'pasada',
  'ganas',
  'gusto'
]);
// "está" (verb) is followed by an adjective/adverb/preposition/gerund; "esta"
// (demonstrative) by a noun.
const ES_ESTA_VERB_FOLLOWERS = new Set([
  'en',
  'a',
  'de',
  'aquí',
  'allí',
  'ahí',
  'muy',
  'bien',
  'mal',
  'ya',
  'no',
  'tan',
  'más',
  'cerca',
  'lejos',
  'listo',
  'lista',
  'cansado',
  'cansada',
  'ocupado',
  'ocupada',
  'cerrado',
  'cerrada',
  'abierto',
  'abierta',
  'enfermo',
  'enferma',
  'contento',
  'contenta',
  'triste',
  'feliz',
  'libre',
  'lleno',
  'llena',
  'vacío',
  'vacía',
  'preocupado',
  'preocupada',
  'enfadado',
  'enfadada',
  'casado',
  'casada',
  'sentado',
  'sentada',
  'limpio',
  'limpia',
  'sucio',
  'sucia',
  'caliente',
  'fría',
  'frio',
  'rota',
  'roto',
  'dormido',
  'dormida'
]);
const ES_DEMONSTRATIVE_LISTING = new Set(['este', 'esto', 'ese', 'esa', 'eso']);
const ES_NOUN_DETERMINERS = new Set([
  'un',
  'el',
  'mi',
  'tu',
  'su',
  'nuestro',
  'este',
  'ese',
  'otro',
  'ningún'
]);

// "antes de que", "a pesar de que"… are conjunction locutions (no accent), and
// "de que" + article ("asegurarte de que las puertas") is a conjunction too —
// an interrogative "qué" is followed by a noun/verb, not an article.
const ES_DE_QUE_LEADERS = new Set(['antes', 'después', 'pesar', 'tal', 'fin']);
const ES_ARTICLES = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas']);

// Verbal "está" needs a subject right before it: a pronoun ("Ella esta nerviosa")
// or a determiner + noun ("Mi hermano esta nervioso"). Demonstrative "esta" never
// sits there, so these shapes keep "esta" flagged even when the word after it
// is not in ES_ESTA_VERB_FOLLOWERS.
const ES_ESTA_SUBJECT_PRONOUNS = new Set(['ella', 'él', 'usted', 'ello']);
const ES_ESTA_SUBJECT_DETERMINERS = new Set([
  ...ES_ARTICLES,
  'mi',
  'mis',
  'tu',
  'tus',
  'su',
  'sus',
  'nuestro',
  'nuestra',
  'nuestros',
  'nuestras'
]);
// "un poco esta imagen": the article belongs to a quantifier, not to a subject noun.
const ES_ESTA_QUANTIFIERS = new Set(['poco', 'mucho']);
// "esta noche/semana/…" is always the demonstrative, wherever it sits in the clause.
const ES_ESTA_TIME_NOUNS = new Set([
  'noche',
  'semana',
  'tarde',
  'mañana',
  'vez',
  'mes',
  'año',
  'temporada',
  'época'
]);

// "Para ella esta decisión": after preposition + pronoun, "esta" is the demonstrative when a
// noun follows. Nouns are recognised by suffix or by this short list; any other follower
// ("Para ella esta claro") is treated as the verb, so the accent is still required.
const ES_ESTA_NOUN_SUFFIX = /(ción|sión|dad|tad|tud|ez|eza|ura|ncia|umbre|ie)$/;
const ES_ESTA_NOUNS = new Set([
  'idea',
  'persona',
  'cosa',
  'forma',
  'manera',
  'casa',
  'opción',
  'pregunta',
  'respuesta',
  'situación',
  'vez',
  'parte',
  'gente',
  'ciudad',
  'calle',
  'historia',
  'regla',
  'oferta'
]);
const esLooksLikeNoun = (w) => ES_ESTA_NOUNS.has(w) || ES_ESTA_NOUN_SUFFIX.test(w);

/** Finds the ¿…? or ¡…! span containing `index`, if any. */
function esSpanAt(text, index) {
  for (const m of text.matchAll(/[¿¡][^?!¿¡]*[?!]/gu)) {
    if (index >= m.index && index < m.index + m[0].length) {
      return { open: m[0][0], start: m.index };
    }
  }
  return null;
}

export function resolveES(word, ctx) {
  const { toks, i, text } = ctx;
  // A lone word is a headword/translation with no sentence of its own —
  // judge it by how the entry's example uses the same word, else keep it flagged.
  if (toks.length === 1) return headwordMatchesExample(word, ctx, 'example_spanish', resolveES);
  const prev = toks[i - 1]?.lower;
  const next = toks[i + 1]?.lower;

  // "un saludo" (a greeting) vs "saludó" (greeted); "saludo" after a determiner is the noun.
  if (word === 'saludo') return ES_NOUN_DETERMINERS.has(prev);

  if (word === 'esta') {
    if (!next) return toks.some((t) => ES_DEMONSTRATIVE_LISTING.has(t.lower));
    if (ES_ESTA_VERB_FOLLOWERS.has(next) || /(ando|iendo|yendo)$/.test(next)) return false;
    if (ES_ESTA_TIME_NOUNS.has(next)) return true;
    if (ES_ESTA_SUBJECT_PRONOUNS.has(prev)) {
      return ES_PREPOSITIONS.has(toks[i - 2]?.lower) && esLooksLikeNoun(next);
    }
    if (
      prev &&
      !ES_PREPOSITIONS.has(prev) &&
      !ES_ESTA_QUANTIFIERS.has(prev) &&
      ES_ESTA_SUBJECT_DETERMINERS.has(toks[i - 2]?.lower)
    ) {
      return false;
    }
    return true; // followed by a noun → demonstrative "esta"
  }

  if (!ES_INTERROGATIVES.has(word)) return false;

  if (word === 'que' && prev === 'de') {
    if (ES_DE_QUE_LEADERS.has(toks[i - 2]?.lower)) return true;
    if (ES_ARTICLES.has(next)) return true;
  }

  const span = esSpanAt(text, toks[i].index);
  const isFirstInSpan = span ? !prev || toks[i - 1].index < span.start : false;

  if (span?.open === '¿') {
    return !(isFirstInSpan || ES_PREPOSITIONS.has(prev) || ES_INDIRECT_TRIGGERS.has(prev));
  }
  if (span?.open === '¡') {
    if (word === 'que') return !(isFirstInSpan && ES_EXCLAMATIVE_COMPLEMENTS.has(next));
    return !(isFirstInSpan || ES_PREPOSITIONS.has(prev) || ES_INDIRECT_TRIGGERS.has(prev));
  }
  // Outside any question/exclamation: only an indirect question needs the accent.
  return !(prev && ES_INDIRECT_TRIGGERS.has(prev));
}

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

// Spelled-out letter sequences such as "A-N-N-A" or "P-E-T-E-R" (3+ single
// letters joined by hyphens) are spelling exercises, not words — each letter
// would otherwise tokenize as a bare "a"/"e"/… and collide with degraded
// forms ("a" → "å"). Excluded from tokenizing AND from --fix rewriting.
const SPELLED_OUT_SOURCE = String.raw`(?:(?<![\p{L}\p{N}-])\p{L}(?:-\p{L}){2,}(?![\p{L}\p{N}-]))|(?:(?<![\p{L}\p{N}-])\p{Lu}(?=-\p{L}{2,}))`;
// The second alternative masks a lone capital letter used as a prefix in a hyphen
// compound ("A-menneske", "T-skjorte", "U-Bahn") — that letter is a label, not the
// word "a"/"å".
const SPELLED_OUT_RE = new RegExp(SPELLED_OUT_SOURCE, 'gu');
const SPELLED_OUT_SPLIT_RE = new RegExp(`(${SPELLED_OUT_SOURCE})`, 'gu');

/** Blanks out spelled-out letter sequences (same length, so indices stay valid). */
function maskSpelledOut(text) {
  return (text || '').replace(SPELLED_OUT_RE, (m) => ' '.repeat(m.length));
}

/** Tokens with their lowercase form and character index in `text`. */
export function tokensWithIndex(text) {
  return [...maskSpelledOut(text).matchAll(WORD_RE)].map((m) => ({
    word: m[0],
    lower: m[0].toLowerCase(),
    index: m.index
  }));
}

export function tokens(text) {
  return tokensWithIndex(text).map((t) => t.word);
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
  // split() with a capture group puts spelled-out sequences at odd indices;
  // leave those untouched.
  return text
    .split(SPELLED_OUT_SPLIT_RE)
    .map((part, idx) => {
      if (idx % 2 === 1) return part;
      return part.replace(CHUNK_RE, (chunk) => {
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
    })
    .join('');
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
  resolveAmbiguous = null,
  entry = null,
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
    // If the correctly-spelled headword already appears in the example, a
    // token matching its degraded form is a different, legitimate word
    // (e.g. headword "hår" with example "Hun har langt hår." — "har" is
    // the verb "has"). Not a degradation.
    if (exampleTokensLower.has(word.toLowerCase())) continue;
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
    const toks = tokensWithIndex(value);
    for (let i = 0; i < toks.length; i++) {
      const tok = toks[i].lower;
      if (Object.prototype.hasOwnProperty.call(wordMap, tok)) {
        issues.push({
          kind: 'common-word',
          field: name,
          detail: `"${name}" contains "${tok}" (likely degraded "${wordMap[tok].label}")`
        });
      } else if (Object.prototype.hasOwnProperty.call(ambiguousWords, tok)) {
        // Grammatical context can settle the ambiguity (see resolveNO/DE/ES).
        if (
          resolveAmbiguous &&
          resolveAmbiguous(tok, { toks, i, text: value, field: name, entry })
        ) {
          continue;
        }
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

// ── Spanish -ción / -sión endings ──────────────────────────────────────────────────────
//
// Every Spanish word ending in "-cion"/"-sion" (singular) is really "-ción"/
// "-sión" — there are no legitimate unaccented ones, so unlike the word maps
// this needs no per-word list and also catches words nobody has listed yet.
// Plurals ("-ciones") are correct as written and don't match.
const ES_SUFFIX_RE = /(ci|si)on$/;

export function findSpanishSuffixIssues(text, fieldName, wordMap = {}) {
  const issues = [];
  if (!text) return issues;
  for (const tok of tokens(text)) {
    // Lowercase-ending words only (an ALL-CAPS word can't be told apart safely).
    if (!ES_SUFFIX_RE.test(tok)) continue;
    if (Object.prototype.hasOwnProperty.call(wordMap, tok.toLowerCase())) continue; // map already reports it
    issues.push({
      kind: 'suffix',
      field: fieldName,
      detail: `"${fieldName}" contains "${tok}" (unaccented ending, likely "${tok.replace(ES_SUFFIX_RE, '$1ón')}")`
    });
  }
  return issues;
}

export function fixSpanishSuffixes(text) {
  if (!text) return text;
  return text
    .split(SPELLED_OUT_SPLIT_RE)
    .map((part, idx) =>
      idx % 2 === 1
        ? part
        : part.replace(WORD_RE, (w) => (ES_SUFFIX_RE.test(w) ? w.replace(ES_SUFFIX_RE, '$1ón') : w))
    )
    .join('');
}

// ── German ue/oe/ae digraphs ──────────────────────────────────────────────────────
//
// Generation sometimes writes ü/ö/ä as ue/oe/ae ("Buerger", "Groenland"). Many
// real German words legitimately contain those letter pairs, so a word is only
// flagged when none of the exclusions below apply. The (?<![eaq]) guard skips
// "eue"/"aue"/"que" (neue, Feuer, Bauer, Queue). The report lists every hit, so
// check the --fix diff for anything that slips through before committing.
const DE_DIGRAPH_RE = /(?<![eaqäöü])ue|oe|ae/gi;
const DE_DIGRAPH_LEGIT_WORDS = new Set([
  'influencer',
  'influencerin',
  'influencern',
  'baguette',
  'baguettes',
  'osloer',
  'aerobic',
  'tue',
  'statue',
  'statuen',
  'poet',
  'poeten',
  'poesie',
  'poetisch',
  'poetischer',
  'poetische',
  'dominoeffekt',
  'elektroenzephalogramm',
  'wichtigtuerisch',
  'israel',
  'michael',
  'raphael',
  'goethe',
  'revue',
  'avenue',
  'venue',
  'queue',
  'boeing',
  'joe',
  'zoe',
  'chloe',
  'joel',
  'noel'
]);
// Legitimate substrings: -(t|x|d|n|s)uell (aktuell, sexuell, individuell, manuell,
// visuell), "zu" + e-prefix verbs (zuerst, zuerkennen, aufrechtzuerhalten,
// weiterzuentwickeln, zueinander), Laestadius/Laestadianismus (proper name), and
// compounds where one part ends in a/o and the next starts with e (Klima+emissionen,
// Netto+einkommen, Radio+empfänger), plus the "aero" prefix.
const DE_DIGRAPH_LEGIT_PARTS =
  /[txdns]uell|zuer(?:st|kenn|halt|kannt)|zuent|zuein|laestadi|(?:klima|netto|brutto|radio|video|audio|foto|photo|stereo)e|^aero/;

function isDeDigraphCandidate(word) {
  // Acronyms such as UEFA/OECD are not digraph spellings.
  if (word.length > 1 && word === word.toUpperCase()) return false;
  const lower = word.toLowerCase();
  DE_DIGRAPH_RE.lastIndex = 0;
  const has = DE_DIGRAPH_RE.test(lower);
  DE_DIGRAPH_RE.lastIndex = 0;
  if (!has) return false;
  if (DE_DIGRAPH_LEGIT_WORDS.has(lower)) return false;
  return !DE_DIGRAPH_LEGIT_PARTS.test(lower);
}

const DE_DIGRAPH_TO_UMLAUT = { ue: 'ü', oe: 'ö', ae: 'ä' };

function fixDeDigraphWord(word) {
  return word.replace(DE_DIGRAPH_RE, (m) => {
    const u = DE_DIGRAPH_TO_UMLAUT[m.toLowerCase()];
    return m[0] === m[0].toUpperCase() ? u.toUpperCase() : u;
  });
}

export function findGermanDigraphIssues(text, fieldName, wordMap = {}) {
  const issues = [];
  if (!text) return issues;
  for (const tok of tokens(text)) {
    const lower = tok.toLowerCase();
    if (!isDeDigraphCandidate(tok)) continue;
    if (Object.prototype.hasOwnProperty.call(wordMap, lower)) continue; // map already reports it
    issues.push({
      kind: 'digraph',
      field: fieldName,
      detail: `"${fieldName}" contains "${tok}" (ue/oe/ae digraph, likely "${fixDeDigraphWord(tok)}")`
    });
  }
  return issues;
}

export function fixGermanDigraphs(text, wordMap = {}) {
  if (!text) return text;
  return text
    .split(SPELLED_OUT_SPLIT_RE)
    .map((part, idx) =>
      idx % 2 === 1
        ? part
        : part.replace(WORD_RE, (w) => {
            const lower = w.toLowerCase();
            if (!isDeDigraphCandidate(w)) return w;
            if (Object.prototype.hasOwnProperty.call(wordMap, lower)) return w;
            return fixDeDigraphWord(w);
          })
    )
    .join('');
}

// ── German ss → ß (long-vowel "ss" written for "ß") ──────────────────────────────────────────
//
// Standard German (as used elsewhere in the data, e.g. "Straße") writes ß after a
// long vowel; generation sometimes writes "ss" ("sass", "gross", "Fussball").
// "ss" can't be turned into "ß" in general (dass, muss, bisschen, Schloss, Riss,
// Masse are correct), so this only rewrites words that START with a stem that is
// always ß, plus a few exact forms. Stems whose unaccented form is ambiguous with an
// umlaut word (größer/großer, äußere/außer) are skipped and left for manual review.
const DE_ESZETT_STEMS = [
  ['ausserst', 'äußerst'],
  ['massnahme', 'maßnahme'],
  ['schliess', 'schließ'],
  ['fliess', 'fließ'],
  ['geniess', 'genieß'],
  ['schiess', 'schieß'],
  ['gross', 'groß'],
  ['strass', 'straß'],
  ['spass', 'spaß'],
  ['heiss', 'heiß'],
  ['weiss', 'weiß'],
  ['stoss', 'stoß'],
  ['beiss', 'beiß'],
  ['giess', 'gieß'],
  ['fuss', 'fuß'],
  ['ausser', 'außer']
];
// "reiss" is ß only in the verb reißen (zerreissen, aufzureissen, …) and a few of its
// compounds. Reis + s… compounds (Reissuppe, Reisschüssel, Reissalat) keep "ss", so the
// whole word has to match — a bare "starts with reiss" test would rewrite them.
const DE_REISSEN_RE = new RegExp(
  '^(?:(?:zer|ab|an|auf|aus|durch|ein|los|nieder|um|weg|zusammen|heraus|hinunter|mit|ver|hin|her|fort)(?:zu)?)?' +
    'reiss(?=(?:en|t|e|st|end(?:e|en|er|es|em)?|verschluss\\w*|zweck\\w*|brett\\w*|nagel\\w*|leine\\w*|wolf\\w*)$)'
);
const DE_ESZETT_EXACT = { sass: 'saß', sassen: 'saßen', bloss: 'bloß', gruss: 'gruß' };
// Words that are correct with "ss" or whose umlaut form is ambiguous — never rewritten.
const DE_ESZETT_SKIP =
  /^(?:gross(?:er|ere|eren|erem|eres|te|ten|tem|ter|tes|ist\w*)|ausser(?:e|en|em|er|es|lich\w*|ung\w*|ste\w*)|fussel\w*|strass)$/;

function eszettFix(word) {
  if (word.length > 1 && word === word.toUpperCase()) return null;
  const lower = word.toLowerCase();
  if (DE_ESZETT_SKIP.test(lower)) return null;
  // Capitalised "Grosse/Grossen" may be the noun "Größe(n)" — leave for review.
  if (/^gross(?:e|en)$/.test(lower) && word[0] !== lower[0]) return null;
  if (Object.prototype.hasOwnProperty.call(DE_ESZETT_EXACT, lower)) {
    return matchCase(word, DE_ESZETT_EXACT[lower]);
  }
  const reissen = lower.match(DE_REISSEN_RE);
  if (reissen) {
    const at = reissen[0].length - 'reiss'.length;
    return word.slice(0, at) + matchCase(word.slice(at, at + 5), 'reiß') + word.slice(at + 5);
  }
  for (const [stem, rep] of DE_ESZETT_STEMS) {
    if (lower.startsWith(stem)) {
      return matchCase(word.slice(0, stem.length), rep) + word.slice(stem.length);
    }
  }
  // "schliess" is always "schließ" inside prefixed verbs/adjectives too
  // ("abzuschliessen", "einschliesslich", "anschliessend").
  const at = lower.indexOf('schliess');
  if (at > 0) return word.slice(0, at) + 'schließ' + word.slice(at + 'schliess'.length);
  return null;
}

export function findGermanEszettIssues(text, fieldName, wordMap = {}) {
  const issues = [];
  if (!text) return issues;
  for (const tok of tokens(text)) {
    const fixed = eszettFix(tok);
    if (!fixed) continue;
    if (Object.prototype.hasOwnProperty.call(wordMap, tok.toLowerCase())) continue; // map reports it
    issues.push({
      kind: 'eszett',
      field: fieldName,
      detail: `"${fieldName}" contains "${tok}" ("ss" written for "ß", likely "${fixed}")`
    });
  }
  return issues;
}

export function fixGermanEszett(text, wordMap = {}) {
  if (!text) return text;
  return text
    .split(SPELLED_OUT_SPLIT_RE)
    .map((part, idx) =>
      idx % 2 === 1
        ? part
        : part.replace(WORD_RE, (w) => {
            if (Object.prototype.hasOwnProperty.call(wordMap, w.toLowerCase())) return w;
            return eszettFix(w) || w;
          })
    )
    .join('');
}

// ── Mixed-script (homoglyph) tokens ──────────────────────────────────────────────────────
//
// A word that mixes Latin and Cyrillic letters (e.g. a Cyrillic "е" typed inside
// "Wuerzе") looks fine on screen but never matches any word list. Reported for
// manual fixing only — the right replacement is always the Latin letter, but
// that should be a deliberate edit.
export function findMixedScriptIssues(text, fieldName) {
  const out = [];
  if (!text) return out;
  for (const m of text.matchAll(/[\p{L}']+/gu)) {
    const w = m[0];
    if (/\p{Script=Cyrillic}/u.test(w) && /\p{Script=Latin}/u.test(w)) {
      out.push({
        kind: 'script',
        field: fieldName,
        detail: `"${fieldName}" contains "${w}", which mixes Latin and Cyrillic letters (homoglyph) — fix manually`
      });
    }
  }
  return out;
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
