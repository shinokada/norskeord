// src/lib/grammar/rules/preposisjoner.ts
// Rules for chapter 14 · Preposisjoner (Part 2). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const PREPOSISJONER_RULES: Record<string, GrammarRule> = {
  'preposisjoner-sted': {
    id: 'preposisjoner-sted',
    titleEn: 'Place & relation prepositions',
    titleNb: 'Stedspreposisjoner og relasjonspreposisjoner',
    explanationEn:
      'For a fixed spatial relationship — i (inside), på (on/at), bak (behind), foran (in front of), ' +
      'under (under), over (above) — the choice stays the same whether something is standing still ' +
      'or being placed: "Boka ligger på bordet." "Katten ligger under stolen." ' +
      '«I» = inside an enclosed space: i skapet, i skogen, i banken, i en butikk. ' +
      '«På» = on a surface or open area, and for most workplaces: på bordet, på fjellet, på kontor, på skolen, på kafé. ' +
      'Geography: «i» for countries, cities, and regions (i Japan, i Bergen, i Nord-Norge); «på» for islands (på Mallorca, på Island) and Norwegian districts (på Vestlandet). ' +
      "«Hos» = at someone's place/premises (being there): «Jeg var hos legen.» To go TO someone, use «til»: «Jeg skal til legen.» " +
      '«Ved» = right next to: «De bor ved sjøen.» ' +
      'Relative/comparative position between two things or people uses «til venstre for» (to the ' +
      'left of), «til høyre for» (to the right of), and «mellom X og Y» (between X and Y): «Banken ' +
      'ligger til venstre for kirken.» «Butikken ligger mellom apoteket og biblioteket.» These ' +
      'behave like the fixed spatial prepositions above — same choice whether something is ' +
      'standing still or being placed. ' +
      'Possession: «bilen til Frida» (belonging to a person → «til»); «kongen i Norge» (geographic → «i»); «fargen på bilen» (property of a thing → «på»). ' +
      '«Av» = made of (material): «laget av tre.» «Fra» = coming from (origin): «fra hagen.» ' +
      'Compound prepositions: ved siden av (next to), i nærheten av (near), i stedet for (instead of), på grunn av (because of), ved hjelp av (with the help of). ' +
      'Two more relative-position prepositions worth flagging: «ovenfor» = higher up than something, in a physical/spatial sense ("Dette bildet bør henge ovenfor det andre bildet" = this picture should hang above the other one); «overfor» = face-to-face with/opposite ("De stod overfor hverandre" = they stood facing each other) or, extended, regarding/toward a person ("Hennes følelser overfor foreldrene var sterke" = her feelings toward her parents were strong). The two are not interchangeable — «ovenfor» is purely about vertical position, «overfor» is about facing or being directed toward someone/something.',
    explanationNb:
      'For et fast romlig forhold — i, på, bak, foran, under, over — er valget det samme enten noe ' +
      'står i ro eller blir plassert: «Boka ligger på bordet.» «Katten ligger under stolen.»\n\n' +
      '• **i** = innenfor et lukket rom: i skapet, i skogen, i banken, i en butikk\n' +
      '• **på** = på overflaten eller et åpent område, og for de fleste arbeidsplasser: på bordet, på fjellet, på kontor, på skolen, på kafé\n' +
      '• **hos** = hos noen (man er der): «Jeg var hos legen.» (bevegelse til noen: «til» — «Jeg skal til legen.»)\n' +
      '• **ved** = like ved siden av: «De bor ved sjøen.»\n\n' +
      'Geografi: «i» for land, byer og regioner (i Japan, i Bergen, i Nord-Norge); «på» for øyer ' +
      '(på Mallorca, på Island) og norske landsdeler (på Vestlandet).\n\n' +
      'Relativ/sammenlignende plassering mellom to ting eller personer bruker «til venstre for», ' +
      '«til høyre for» og «mellom X og Y»: «Banken ligger til venstre for kirken.» «Butikken ' +
      'ligger mellom apoteket og biblioteket.» Dette følger samme mønster som de faste ' +
      'stedspreposisjonene over — samme valg enten noe står i ro eller blir plassert.\n\n' +
      'Tilhørighet og opprinnelse:\n' +
      '• **til** = tilhørighet til en person: «bilen til Frida»\n' +
      '• **i** = geografisk tilhørighet: «kongen i Norge»\n' +
      '• **på** = egenskap ved en ting: «fargen på bilen»\n' +
      '• **av** = laget av (materiale): «laget av tre»\n' +
      '• **fra** = kommer fra (opprinnelse): «fra hagen»\n\n' +
      'Sammensatte preposisjoner: ved siden av, i nærheten av, i stedet for, på grunn av, ved hjelp av.\n\n' +
      'To flere relative posisjonspreposisjoner er verdt å nevne:\n' +
      '• **ovenfor** = høyere oppe enn noe, i fysisk/romlig forstand: «Dette bildet bør henge ovenfor det andre bildet.»\n' +
      '• **overfor** = ansikt til ansikt med/rett imot: «De stod overfor hverandre.» Eller, utvidet: angående/rettet mot en person: «Hennes følelser overfor foreldrene var sterke.»\n\n' +
      'De to er IKKE ombyttbare — «ovenfor» handler bare om vertikal posisjon, mens «overfor» handler om å vende mot eller være rettet mot noen/noe.'
  },

  'for-siden': {
    id: 'for-siden',
    titleEn: '«for … siden» (time ago)',
    titleNb: '«for … siden»',
    explanationEn:
      'To say how long ago something happened, Norwegian frames the duration with «for» … «siden»: ' +
      '"for to uker siden" (two weeks ago), "for en time siden" (an hour ago).',
    explanationNb:
      'For å si hvor lenge siden noe skjedde, rammer norsk inn tidsrommet med «for» … «siden»:\n\n' +
      '• "for to uker siden"\n' +
      '• "for en time siden"'
  },

  'preposisjoner-tid': {
    id: 'preposisjoner-tid',
    titleEn: 'Time prepositions (i, om, for–siden, på)',
    titleNb: 'Tidspreposisjoner (i, om, for–siden, på)',
    explanationEn:
      '«I» expresses duration (how long): «Hun har bodd her i to år.» It is also used with years, months, and named periods: i 1989, i april, i ferien. ' +
      '«For … siden» marks a past point in time (ago): «De kom for to uker siden.» Always used with preteritum. ' +
      '«Om» points to a future moment: «De kommer om fem minutter.» ' +
      '«Til» with a definite season means the upcoming season: «Til sommeren skal vi flytte.» ' +
      '«På» shows how long something TOOK to complete: «Han leste boka på to timer.» ' +
      'With «ikke», «på» marks elapsed time without an event: «Jeg har ikke sett henne på måneder.» ' +
      'For seasons and parts of the day: «i» + indefinite noun = the specific instance (i høst, i kveld); «om» + definite noun = habitual/general (om høsten, om kvelden). ' +
      'Holidays behave differently: «i» + DEFINITE noun (i julen, i påsken, i pinsen) can refer to the past, present, OR future — the tense of the verb decides which: "Hva skal du gjøre i julen?" (future), "Hva gjorde dere i påsken i fjor?" (past), "I pinsen pleier vi å dra på tur" (general/habitual).',
    explanationNb:
      'Norsk skiller mellom flere tidspreposisjoner avhengig av hva du uttrykker:\n\n' +
      '• **i** = varighet (hvor lenge): «Hun har bodd her i to år.» Brukes også med årstall, måneder og navngitte perioder: i 1989, i april, i ferien\n' +
      '• **for … siden** = et tidspunkt i fortida: «De kom for to uker siden.» Brukes alltid med preteritum\n' +
      '• **om** = et fremtidig tidspunkt: «De kommer om fem minutter.»\n' +
      '• **til** + bestemt årstid = den kommende årstiden: «Til sommeren skal vi flytte.»\n' +
      '• **på** = hvor lang tid noe tok å fullføre: «Han leste boka på to timer.» Med «ikke» markerer «på» i stedet forløpt tid uten at noe har skjedd: «Jeg har ikke sett henne på måneder.»\n\n' +
      'For årstider og deler av dagen: «i» + ubestemt substantiv = den konkrete forekomsten (i høst, i kveld); «om» + bestemt substantiv = vanlig/generell (om høsten, om kvelden).\n\n' +
      'Høytider oppfører seg annerledes: «i» + BESTEMT substantiv (i julen, i påsken, i pinsen) kan vise til fortid, nåtid ELLER framtid — det er verbets tidsform som avgjør: «Hva skal du gjøre i julen?» (framtid), «Hva gjorde dere i påsken i fjor?» (fortid), «I pinsen pleier vi å dra på tur» (generelt/vanemessig).'
  },

  'preposisjoner-tilhorighet': {
    id: 'preposisjoner-tilhorighet',
    titleEn: 'Belonging and connection',
    titleNb: 'Tilhørighet og tilknytning',
    explanationEn:
      'Prepositions can show who something belongs to, who someone has a relationship with, ' +
      'where someone lives or works, and where someone comes from. "Til" + a person shows who ' +
      'something or someone belongs to: "bilen til Anna", "søsteren til Ola", "naboen til Ola". ' +
      '"Med" shows the relationship between people: "gift med", "venn med", "sammen med": "Hun er ' +
      'gift med Ola." "Vi bor sammen med venner." "Hos" + a person or a company shows who someone ' +
      'lives or works with or for: "Jeg bor hos foreldrene mine." "Han jobber hos Equinor." "Fra" ' +
      'shows origin: "Hun er fra Spania."',
    explanationNb:
      'Preposisjoner kan vise hvem noe tilhører, hvem noen har et forhold til, hvor noen bor eller ' +
      'jobber, og hvor noen kommer fra.\n\n' +
      '• **Til:** «til» + person viser hvem noe eller noen tilhører: «bilen til Anna», «søsteren ' +
      'til Ola», «naboen til Ola».\n' +
      '• **Med:** «med» viser forholdet mellom personer: «gift med», «venn med», «sammen med»: ' +
      '«Hun er gift med Ola.» «Vi bor sammen med venner.»\n' +
      '• **Hos:** «Hos» + person eller firma viser hvem noen bor hos eller jobber hos: «Jeg bor ' +
      'hos foreldrene mine.» «Han jobber hos Equinor.»\n' +
      '• **Fra:** «fra» viser opprinnelse: «Hun er fra Spania.»'
  },

  'preposisjoner-annen-bruk': {
    id: 'preposisjoner-annen-bruk',
    titleEn: 'Means, topic and purpose',
    titleNb: 'Måte, tema og formål',
    explanationEn:
      'Prepositions can show how something happens, what a conversation is about, and who or ' +
      'what something is meant for. "Med" shows a tool or how we travel: "Jeg reiser med tog." ' +
      '"Han skriver med blyant." "Uten" shows that something is missing: "kaffe uten sukker". ' +
      '"Om" shows the topic: "Vi snakker om været." "en bok om Norge". "For" shows who ' +
      'something is good or important for, and it is used with "takk": "Dette er bra for deg." ' +
      '"Takk for hjelpen!" "Til" shows who something is meant for, or what it is used for: "en ' +
      'gave til mamma", "kake til kaffen".',
    explanationNb:
      'Preposisjoner kan vise hvordan noe skjer, hva en samtale handler om, og hvem eller hva noe ' +
      'er ment for.\n\n' +
      '• **Med:** «med» viser hjelpemiddel og hvordan vi reiser: «Jeg reiser med tog.» «Han ' +
      'skriver med blyant.»\n' +
      '• **Uten:** «uten» viser at noe mangler: «kaffe uten sukker».\n' +
      '• **Om:** «om» viser temaet: «Vi snakker om været.» «en bok om Norge».\n' +
      '• **For:** «for» viser hvem noe er bra eller viktig for, og vi bruker det med «takk»: ' +
      '«Dette er bra for deg.» «Takk for hjelpen!»\n' +
      '• **Til:** «til» viser hvem noe er ment for, eller hva noe skal brukes til: «en gave til ' +
      'mamma», «kake til kaffen».'
  },

  'sammensatte-preposisjoner': {
    id: 'sammensatte-preposisjoner',
    titleEn: 'Compound prepositions',
    titleNb: 'Sammensatte preposisjoner',
    explanationEn:
      'A compound preposition is a fixed group of words that works as one preposition. The words ' +
      'in the group belong together. "I nærheten av" shows that something is not far away: "Jeg bor i ' +
      'nærheten av skolen." "I stedet for" shows what is replaced: "Jeg tar te i stedet for kaffe." ' +
      '"På grunn av" shows the cause: "Flyet er forsinket på grunn av snøen." "Ved hjelp av" shows ' +
      'the tool or help we use: "Han åpner boksen ved hjelp av en kniv." "I forhold til" compares ' +
      'two things: "Det er billig i forhold til Oslo." "Til tross for" shows that something happens ' +
      'even though there is an obstacle: "Vi går tur til tross for regnet."',
    explanationNb:
      'En sammensatt preposisjon er en fast gruppe ord som fungerer som én preposisjon. Ordene i ' +
      'gruppen hører sammen.\n\n' +
      '• **Sted:** «i nærheten av» viser at noe ikke er langt unna: «Jeg bor i nærheten av skolen.»\n' +
      '• **Erstatning:** «i stedet for» viser hva som byttes ut: «Jeg tar te i stedet for kaffe.»\n' +
      '• **Årsak:** «på grunn av» viser årsaken: «Flyet er forsinket på grunn av snøen.»\n' +
      '• **Hjelpemiddel:** «ved hjelp av» viser hva vi bruker: «Han åpner boksen ved hjelp av en ' +
      'kniv.»\n' +
      '• **Sammenligning:** «i forhold til» sammenligner to ting: «Det er billig i forhold til Oslo.»\n' +
      '• **Motsetning:** «til tross for» viser at noe skjer selv om det er et hinder: «Vi går tur til ' +
      'tross for regnet.»'
  },

  'preposisjoner-uttrykk-b2': {
    id: 'preposisjoner-uttrykk-b2',
    titleEn: 'Idiomatic B2 preposition collocations',
    titleNb: 'Idiomatiske preposisjonsuttrykk på nivå B2',
    explanationEn:
      'Beyond the literal time/place rules, many common B2 verbs, nouns, and adjectives take a ' +
      'fixed preposition that has to be learned per expression, not derived from a general rule: ' +
      '«ta ansvar for», «ha inntrykk av», «være forberedt på», «komme på» (to remember), «kjempe ' +
      'for», «sette pris på», «bestemme (seg) for/over», «stemme på». These sit a notch below the ' +
      'more advanced/rarer idiomatic prepositions in `preposisjoner-generelt-c` — high-frequency ' +
      'everyday collocations rather than literary or specialist ones.',
    explanationNb:
      'Utover de bokstavelige tids-/stedsreglene tar mange vanlige B2-verb, -substantiv og -adjektiv en fast preposisjon som må læres per uttrykk, ikke utledes fra en generell regel:\n\n' +
      '• ta ansvar for\n' +
      '• ha inntrykk av\n' +
      '• være forberedt på\n' +
      '• komme på\n' +
      '• kjempe for\n' +
      '• sette pris på\n' +
      '• bestemme (seg) for/over\n' +
      '• stemme på\n\n' +
      'Disse står et hakk under de mer avanserte/sjeldnere idiomatiske preposisjonene i `preposisjoner-generelt-c` — høyfrekvente hverdagskollokasjoner snarere enn litterære eller fagspesifikke.'
  },

  'preposisjoner-kroppsdel-uttrykk': {
    id: 'preposisjoner-kroppsdel-uttrykk',
    titleEn: 'Body-part idioms with prepositions',
    titleNb: 'Kroppsdelsuttrykk med preposisjoner',
    explanationEn:
      'A large family of fixed idioms built around body-part nouns with specific prepositions: ' +
      '"kaste et blikk på" (glance at), "ha en knapp på" (favor), "sette fast" (corner someone), ' +
      '"ta beina på nakken" (flee), "ha øyne i nakken," "gå med krum hals" (submit reluctantly).',
    explanationNb:
      'En stor familie faste uttrykk bygget rundt kroppsdelsubstantiv med bestemte preposisjoner:\n\n' +
      '• kaste et blikk på\n' +
      '• ha en knapp på\n' +
      '• sette fast\n' +
      '• ta beina på nakken\n' +
      '• ha øyne i nakken\n' +
      '• gå med krum hals'
  },

  'preposisjoner-generelt-c': {
    id: 'preposisjoner-generelt-c',
    titleEn: 'Advanced idiomatic prepositions',
    titleNb: 'Avanserte idiomatiske preposisjoner',
    explanationEn:
      'Advanced, often idiomatic preposition choices beyond the A2/B1 time/place rules — fixed ' +
      'collocations with verbs and nouns that don\'t follow a predictable pattern: "gå ut på," ' +
      '"sette pris på," "komme til bunns i," "sette i sving," "stå til ansvar for."',
    explanationNb:
      'Avanserte, ofte idiomatiske preposisjonsvalg utover A2/B1s tids-/stedsregler — faste kollokasjoner med verb og substantiv som ikke følger et forutsigbart mønster:\n\n' +
      '• gå ut på\n' +
      '• sette pris på\n' +
      '• komme til bunns i\n' +
      '• sette i sving\n' +
      '• stå til ansvar for'
  }
};
