// src/lib/grammar/rules/adverb.ts
// Rules for chapter 12 · Adverb (Part 2). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const ADVERB_RULES: Record<string, GrammarRule> = {
  'adverb-sted-hjem': {
    id: 'adverb-sted-hjem',
    titleEn: 'Location vs. movement adverbs (inne/ute, inn/ut, hjem/hjemme)',
    titleNb: 'Stedsadverb: inne/ute, inn/ut, hjem/hjemme',
    explanationEn:
      'Norwegian uses a different adverb form for BEING somewhere than for MOVING there: "Jeg er ' +
      'ute" (I am outside) vs. "Jeg går ut" (I go/walk outside). The same pattern applies to ' +
      'inne/inn and hjemme/hjem: "Vi er hjemme" vs. "Vi går hjem."',
    explanationNb:
      'Norsk bruker ulik adverbform for Å VÆRE et sted og Å BEVEGE SEG dit:\n\n' +
      '• **statisk** — inne, ute, hjemme: "Jeg er ute." "Vi er hjemme."\n' +
      '• **dynamisk** — inn, ut, hjem: "Jeg går ut." "Vi går hjem."'
  },

  'stedsadverb-statisk-dynamisk': {
    id: 'stedsadverb-statisk-dynamisk',
    titleEn: 'Static vs. dynamic location adverbs',
    titleNb: 'Statiske og dynamiske stedsadverb',
    explanationEn:
      'Several location adverbs have two forms: a static one for being at a place, and a dynamic one ' +
      'for moving toward it: hjemme/hjem, inne/inn, ute/ut, oppe/opp, nede/ned, borte/bort, framme/' +
      'fram, der/dit, her/hit. "Jeg er hjemme" (static — I am at home) vs. "Jeg skal hjem" (dynamic — ' +
      'I\'m heading home); "Er du ute?" vs. "Jeg skal gå ut." The choice depends on whether the verb ' +
      'describes a location/state or a movement toward that location. «Hjem» has a third, related ' +
      'form for movement AWAY from a place: «hjemmefra» ("from home"): "Jeg kjørte hjemmefra klokka ' +
      'åtte," "Han dro hjemmefra som sekstenåring." So the three-way pattern is dynamic-toward ' +
      '(hjem) / static (hjemme) / dynamic-away (hjemmefra) — the same «-fra» pattern also appears ' +
      'with other adverbs (ovenfra, nedenfra, utenfra, innenfra).\n\n' +
      'A related set of adverbs is static-only, marking relative position within a group or space ' +
      'rather than a place name: fremst/bakerst (front/back), øverst/nederst (top/bottom), ' +
      'innerst/ytterst (innermost/outermost). Unlike the pairs above, these have no matching ' +
      'dynamic form built on the same root — movement toward them is expressed with a verb + ' +
      'directional adverb instead: "Han satte seg bakerst" (static position) vs. "Han gikk bakover" ' +
      '(movement, different root). Compass-direction adverbs (nordover, sørover, østover, vestover) ' +
      'work the other way — they are dynamic-only, describing movement in a direction; the static ' +
      'equivalent uses a prepositional phrase instead of a matching adverb: "i nord," not a word ' +
      'ending in -over.',
    explanationNb:
      'Flere stedsadverb har to former: en statisk for å være et sted, og en dynamisk for å bevege ' +
      'seg mot det:\n\n' +
      '• **statisk** — hjemme, inne, ute, oppe, nede, borte, framme, der, her: "Jeg er hjemme." "Er du ute?"\n' +
      '• **dynamisk** — hjem, inn, ut, opp, ned, bort, fram, dit, hit: "Jeg skal hjem." "Jeg skal gå ut."\n\n' +
      'Valget avhenger av om verbet beskriver et sted/en tilstand eller en bevegelse mot stedet.\n\n' +
      '«Hjem» har i tillegg en tredje form for bevegelse VEKK fra et sted: «hjemmefra» ("fra hjemmet"):\n\n' +
      '• "Jeg kjørte hjemmefra klokka åtte."\n' +
      '• "Han dro hjemmefra som sekstenåring."\n\n' +
      'Mønsteret blir dermed tredelt: dynamisk-mot (hjem) / statisk (hjemme) / dynamisk-vekk (hjemmefra). ' +
      'Samme «-fra»-mønster finnes også hos andre adverb (ovenfra, nedenfra, utenfra, innenfra).\n\n' +
      'En beslektet gruppe adverb er rent statiske og markerer relativ posisjon i en gruppe eller et rom, ikke et stedsnavn: fremst/bakerst, øverst/nederst, innerst/ytterst. I motsetning til parene over har disse ingen tilsvarende dynamisk form med samme rot — bevegelse mot dem uttrykkes heller med verb + retningsadverb: «Han satte seg bakerst» (statisk posisjon) mot «Han gikk bakover» (bevegelse, annen rot). Kompassretningsadverb (nordover, sørover, østover, vestover) fungerer motsatt vei — de er rent dynamiske og beskriver bevegelse i en retning; den statiske motsvarigheten er en preposisjonsfrase, ikke et tilsvarende adverb: «i nord», ikke et ord som ender på -over.'
  },

  'adjektiv-eller-adverb': {
    id: 'adjektiv-eller-adverb',
    titleEn: 'Adjective or adverb? (sikker/sikkert, god/godt)',
    titleNb: 'Adjektiv eller adverb?',
    explanationEn:
      'Many Norwegian adjectives share their neuter (-t) form with an adverb used to modify a verb. ' +
      'Use the AGREEING adjective form when describing a noun/subject: "Jeg er sikker på det." ' +
      '(sikker agrees with "jeg", masculine/feminine.) Use the -t form when modifying a VERB: "Det ' +
      'går sikkert bra." Same pattern: "Maten var god" (adjective, describes maten) vs. "Den ' +
      'smakte godt" (adverb, modifies smakte).',
    explanationNb:
      'Mange norske adjektiver deler intetkjønnsformen (-t) med et adverb som brukes til å beskrive et verb:\n\n' +
      '• **adjektiv (samsvarende form)** — når du beskriver et substantiv/subjekt: "Jeg er sikker på det." "Maten var god."\n' +
      '• **adverb (-t-form)** — når du beskriver et VERB: "Det går sikkert bra." "Den smakte godt."'
  },

  'adverb-gradboying': {
    id: 'adverb-gradboying',
    titleEn: 'Adverb comparison',
    titleNb: 'Adverbets gradbøyning',
    explanationEn:
      'Just like adjectives, many manner/frequency adverbs can be compared with -ere (comparative) ' +
      'and -est (superlative), following «enn» after the comparative exactly like adjectives: ' +
      'sakte → saktere (Han kjørte saktere enn før), fort → fortere → fortest, ofte → oftere → ' +
      'oftest, tidlig → tidligere → tidligst.\n\n' +
      'One common trio is irregular (suppletive, i.e. built from different word stems, like ' +
      'god→bedre→best): **gjerne** (gladly, positive) → **heller** (comparative — preferring one ' +
      'thing over another, used with «enn»: "Jeg vil heller ha te enn kaffe") → **helst** ' +
      '(superlative — what is preferred most of all, out of many options, no «enn»: "Jeg vil helst ' +
      'ha suppe"). Note this is a separate, irregular series — there is no "gjernere" or "gjernest".',
    explanationNb:
      'Akkurat som adjektiv kan mange måte-/hyppighetsadverb gradbøyes med -ere (komparativ) og ' +
      '-est (superlativ), og komparativen følges av «enn» akkurat som ved adjektiv.\n\n' +
      '• sakte → saktere — *Han kjørte saktere enn før.*\n' +
      '• fort → fortere → fortest\n' +
      '• ofte → oftere → oftest\n' +
      '• tidlig → tidligere → tidligst\n\n' +
      'Ett vanlig trekløver er uregelmessig (dannet av ulike ordstammer, som god→bedre→best):\n\n' +
      '• **gjerne** (positiv — gjerne/villig) → **heller** (komparativ — å foretrekke én ting fremfor ' +
      'en annen, brukes med «enn»: «Jeg vil heller ha te enn kaffe.») → **helst** (superlativ — det ' +
      'som foretrekkes mest av alt, blant flere alternativer, ingen «enn»: «Jeg vil helst ha ' +
      'suppe.»)\n\n' +
      'Legg merke til at dette er en egen, uregelmessig rekke — det finnes ikke «gjernere» eller ' +
      '«gjernest».'
  },

  'adverb-setningsbinding': {
    id: 'adverb-setningsbinding',
    titleEn: 'Connective adverbs linking two sentences',
    titleNb: 'Adverb som binder setninger sammen',
    explanationEn:
      'Several adverbs link two sentences by expressing the logical relationship between them, ' +
      'and (being adverbs, not conjunctions) each triggers V2 inversion when it opens the second ' +
      'sentence: «så» (time — «Først spiste de middag. Så spiste de kake.»), «derfor» (årsak/grunn ' +
      '— «Han var syk. Derfor gikk han ikke på jobb.»), «likevel» (motsetning — «Han var syk. ' +
      'Likevel gikk han på jobb.»), «dessuten» (tillegg — «Hun følte seg kvalm. Dessuten hadde hun ' +
      'feber.»).',
    explanationNb:
      'Flere adverb binder to setninger sammen ved å uttrykke forholdet mellom dem. Siden dette er ' +
      'adverb (ikke konjunksjoner), utløser hvert av dem V2-inversjon når de åpner den andre ' +
      'setningen.\n\n' +
      '• **så** (tid) — *Først spiste de middag. Så spiste de kake.*\n' +
      '• **derfor** (årsak/grunn) — *Han var syk. Derfor gikk han ikke på jobb.*\n' +
      '• **likevel** (motsetning) — *Han var syk. Likevel gikk han på jobb.*\n' +
      '• **dessuten** (tillegg) — *Hun følte seg kvalm. Dessuten hadde hun feber.*\n\n' +
      'Legg merke til at verbet kommer før subjektet i den andre setningen, akkurat som ved andre ' +
      'fronterte adverbial.'
  },

  'jo-desto-komparativ': {
    id: 'jo-desto-komparativ',
    titleEn: 'The jo…desto correlative comparative',
    titleNb: 'Korrelativkonstruksjonen jo … desto',
    explanationEn:
      'The correlative construction "jo + comparative … desto/jo + comparative" links two ' +
      'increasing/decreasing quantities: "Jo mer hun spiser, jo tykkere blir hun." Both clauses ' +
      'break normal V2 order — the verb comes directly after jo/desto.',
    explanationNb:
      'Korrelativkonstruksjonen «jo + komparativ … desto/jo + komparativ» binder sammen to økende/minkende størrelser: «Jo mer hun spiser, jo tykkere blir hun.»\n\n' +
      'Begge setningsleddene bryter med vanlig V2 — verbet kommer rett etter jo/desto.'
  },

  setningsadverbial: {
    id: 'setningsadverbial',
    titleEn: 'Sentence adverbials (setningsadverbialer)',
    titleNb: 'Setningsadverbialer',
    explanationEn:
      'Sentence adverbials — ikke, aldri, alltid, heldigvis, dessverre, ofte, sjelden and similar — ' +
      'follow the same placement rule as «ikke»: ' +
      'In MAIN clauses they come AFTER the finite verb: "Jeg går aldri dit." ' +
      'In SUBORDINATE clauses (after at, fordi, hvis, når, …) they come BEFORE the verb: ' +
      '"Jeg vet at han aldri går dit." ' +
      'This is the same rule as for «ikke» — all setningsadverbialer behave identically.',
    explanationNb:
      'Setningsadverbialer — ikke, aldri, alltid, heldigvis, dessverre, ofte, sjelden og lignende — ' +
      'følger samme plasseringsregel som «ikke»:\n\n' +
      '• **hovedsetninger** — kommer ETTER det bøyde verbet: "Jeg går aldri dit."\n' +
      '• **leddsetninger** (etter at, fordi, hvis, når, …) — kommer FØR verbet: "Jeg vet at han aldri går dit."\n\n' +
      'Dette er samme regel som for «ikke» — alle setningsadverbialer oppfører seg identisk.'
  },

  'modale-adverb': {
    id: 'modale-adverb',
    titleEn: 'Modal adverbs (nok, vel, jo, faktisk, egentlig...)',
    titleNb: 'Modale adverb',
    explanationEn:
      'A small set of adverbs signal how certain the speaker is, or what they assume the listener ' +
      'already knows, without changing the literal content of the sentence: «faktisk» marks a fact ' +
      '(often a surprising one), «egentlig» signals a contrast between what was said and how things ' +
      'really are, «nok» hedges an assumption ("I assume/guess"), «vel» has three related senses — ' +
      'pointing out something that seems obvious ("Dette forstår du vel?" = you understand this, ' +
      'right?), marking something as probable ("De greier vel å gå ti kilometer" = they probably ' +
      'manage), or seeking confirmation ("Du kommer vel på festen?" = you\'re coming, aren\'t you?) ' +
      '— «jo» signals shared knowledge between speaker and listener, «kanskje» and «sikkert» mark ' +
      'degrees of certainty, «visst» shifts meaning with position: in the normal midtfelt slot it ' +
      'marks something heard secondhand ("Han har visst giftet seg" = he has apparently gotten ' +
      'married), but placed first in the sentence it becomes emphatic, meaning "definitely!" ' +
      '("Visst har han giftet seg!"), and «neppe» marks something judged unlikely. These sit in the ' +
      'midtfelt like other setningsadverbial (except «visst» in its emphatic front-position use).',
    explanationNb:
      'Et lite sett adverb signaliserer hvor sikker taleren er, eller hva taleren antar at mottakeren allerede vet, uten å endre det bokstavelige innholdet i setningen:\n\n' +
      '• **faktisk** = markerer et faktum (ofte overraskende)\n' +
      '• **egentlig** = signaliserer en motsetning mellom det som er sagt og hvordan det egentlig er\n' +
      '• **nok** = avdemper en antakelse ("jeg antar/tror")\n' +
      '• **vel** = har tre nære betydninger: peker på noe som synes opplagt ("Dette forstår du vel?"), markerer det sannsynlige ("De greier vel å gå ti kilometer"), eller søker bekreftelse ("Du kommer vel på festen?")\n' +
      '• **jo** = signaliserer felles kunnskap mellom taler og mottaker\n' +
      '• **kanskje / sikkert** = markerer sikkerhetsgrad\n' +
      '• **visst** = i midtfeltet markerer «visst» noe hørt fra andre ("Han har visst giftet seg" = antakelig/trolig); først i setningen blir «visst» emfatisk og betyr «helt sikkert!» ("Visst har han giftet seg!")\n' +
      '• **neppe** = markerer at noe vurderes som usannsynlig\n\n' +
      'Disse står i midtfeltet som andre setningsadverbial (unntatt «visst» i den emfatiske bruken først i setningen).'
  }
};
