// src/lib/grammar/rules/ordbruk-og-nyanser.ts
// Rules for chapter 19 · Ordbruk og nyanser (Part 4). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const ORDBRUK_OG_NYANSER_RULES: Record<string, GrammarRule> = {
  'nyanser-uttrykk': {
    id: 'nyanser-uttrykk',
    titleEn: 'Near-synonym discrimination',
    titleNb: 'Nyanseforskjeller mellom lignende ord',
    explanationEn:
      'Norwegian has many word groups that translate similarly into English but carry a real ' +
      'meaning difference in Norwegian, so only one fits a given context. Some pairs split by ' +
      'countability or register («tid» = time in general vs. «time» = a clock-hour vs. «gang» = an ' +
      'occurrence: «jeg har vært der mange ganger», not «mange tider»). Some are near-synonym ' +
      'adjectives with a tone difference («alvorlig» = stern/serious-looking vs. «seriøs» = ' +
      'sincere/professional). Some are single words with several unrelated senses that only context ' +
      'disambiguates («ryke»: literally «to smoke/emit smoke», but also «to snap» (a rope, a tendon), ' +
      '«to fall through» (a plan, a deal), or «to be knocked out» (a competition). An intensifying ' +
      'adverb like «såpass» («that much/so much») works the same way — one word, many shades ' +
      'depending on what it modifies. Three more common clusters: «heldig» (adjective, describing ' +
      'a lucky PERSON or a fortunate SITUATION: "Jeg var heldig") vs. «flaks» (noun, the abstract ' +
      'force/event of luck itself, opposite «uflaks»: "Det var bare flaks") vs. «sjanse» (noun, an ' +
      'opportunity or possibility, not luck itself: "Jeg fikk en sjanse til å prøve"). «Forberedt» ' +
      '(adjective, a state: "Jeg er forberedt") vs. «å forberede seg» (reflexive verb, the act of ' +
      'getting ready: "Jeg må forberede meg til eksamen") vs. «å forbedre seg» (reflexive verb, a ' +
      'completely different meaning — to improve/get better at something, not to get ready: "Jeg ' +
      'må forbedre meg i matte") — easy to confuse since the words look alike. «Under» + a noun ' +
      'names a point or stretch WITHIN a period without focusing on its span ("under møtet" = at ' +
      'some point during the meeting) vs. «i løpet av» + a noun frames the WHOLE period as a span ' +
      'to be completed within ("i løpet av møtet" = over the course of/by the end of the meeting). ' +
      'One more polysemy case worth its own note: «å fatte» has a plain sense — "to understand/grasp" ' +
      '("Jeg fatter ikke hva som skjedde") — but it also appears in a cluster of fixed collocations ' +
      'where it means roughly "to form/take" an abstract thing: «å fatte en beslutning» (to make a ' +
      'decision), «å fatte et vedtak» (to pass/adopt a resolution), «å fatte håp» (to find hope), ' +
      '«å fatte mistanke» (to grow suspicious), «å fatte interesse for» (to take an interest in), and ' +
      'the imperative «Fatt mot!» (Take courage!). None of these substitute a different verb for ' +
      '«forstå» — they are a separate, fixed-collocation sense that has to be learned as a set. ' +
      'Two more everyday cases: «å kalle» has three distinct senses that only context separates — ' +
      '(1) "to call out/shout" ("Mamma kalte på oss fra vinduet"), (2) "to name/refer to someone ' +
      'as" ("Alle kaller henne tante Adele"), and (3) reflexively, "to call oneself" ("Han kaller ' +
      'seg Toto, men han heter Torstein"). And «å bli/være vant til» (adjective phrase, describing ' +
      'a STATE of having grown accustomed to something: "Hun blir vant til å bo der") vs. «å venne ' +
      'seg til» (reflexive verb, the PROCESS/ACT of getting used to something, often used in ' +
      'perfektum to mark that the adjustment is complete: "Hun har vennet seg til å bo der") — ' +
      'both describe the same underlying experience, but the adjective phrase frames it as an ' +
      'ongoing condition while the verb frames it as something you actively did. One more pair ' +
      'worth a careful look: «å bytte» = to give something away and get something back (mutual ' +
      'exchange), «å skifte» = to change/replace/alternate. The two are genuinely synonymous only ' +
      'when swapping TO THE SAME TYPE/KIND of thing (e.g. clothes: «Hun bytter/skifter ofte ' +
      'klær»). They are NOT interchangeable when the focus is on giving something away and ' +
      'receiving something DIFFERENT back in return — trading or bartering («Barna byttet ' +
      'steiner med hverandre», «man kan bytte varen man kjøper i butikken») — only «å bytte» ' +
      'works there, because the emphasis is on the reciprocal exchange itself, not on replacing ' +
      'one thing with another of the same kind. A final pair that trips learners up: «å miste» ' +
      'and «å tape» both roughly translate as "to lose," but for different kinds of loss. «Å ' +
      'miste» covers misplacing something ("å miste nøklene" = to lose one\'s keys), doing ' +
      'without/running out of something ("vi har ingen tid å miste" = we have no time to spare), ' +
      'missing a form of transport ("å miste bussen" = to miss the bus), and losing something ' +
      'abstract that was once yours — sight, hearing, hair, life, parents, hope, patience, an ' +
      'overview, courage. «Å tape», by contrast, is about suffering a defeat or a financial loss: ' +
      'losing money ("å tape penger på gambling"), losing a game/match/competition ("Liverpool ' +
      'tapte mot Manchester United"), or — in the fixed reflexive «å tape seg» — losing one\'s ' +
      "looks/attractiveness over time. The two are NOT interchangeable: you can't «tape nøklene» " +
      "(you misplace keys, you don't lose a contest with them) and you can't «miste en kamp» " +
      '(a match is lost by defeat, not by misplacing it). One last pair worth flagging: ' +
      '«samme» + a NOUN expresses sameness/identity ("De dro ut samme dag" = they left on the ' +
      'same day; "den samme dagen" with the definite article is equally common), while «like» + ' +
      'an ADJECTIVE or ADVERB expresses equal degree ("Hun er like vakker som før" = she is just ' +
      'as beautiful as before; "Det har snødd like mye i dag som i går" = it has snowed just as ' +
      'much today as yesterday). The two are not interchangeable: «samme» never combines directly ' +
      'with an adjective/adverb to mean "equally," and «like» never combines directly with a bare ' +
      'noun to mean "the same one" — «like dag» is not valid, and «samme vakker» is not valid. ' +
      'One final polysemous verb worth flagging: «å gjelde» has four distinct senses that ' +
      'share no single English translation. It can mean (1) to MATTER/be at stake ("Nå ' +
      'gjelder det å løpe fort!" = now it’s about running fast), (2) to CONCERN/be about ' +
      '("Det jeg skal fortelle, gjelder min far" = what I’m about to tell concerns my ' +
      'father), (3) to be VALID ("Denne billetten gjelder ikke" = this ticket isn’t valid), ' +
      'and (4) to COUNT/be included ("To av brikkene gjelder ikke" = two of the pieces don’t ' +
      'count). The senses are not interchangeable — a ticket that «ikke gjelder» is invalid, ' +
      'not “not at stake,” and a story that «gjelder» someone is about them, not valid for ' +
      'them — so the surrounding noun (billett, far, brikke) is the clue to which sense is meant.' +
      ' Getting these right means reading the whole sentence for ' +
      'meaning, not pattern-matching the surface word.',
    explanationNb:
      'Norsk har mange ordgrupper som oversettes likt til engelsk, men som har en reell ' +
      'betydningsforskjell på norsk, slik at bare étt av dem passer i en gitt sammenheng.\n\n' +
      '• **tid / time / gang**: «tid» = tid generelt, «time» = en klokketime, «gang» = en ' +
      'forekomst — «jeg har vært der mange ganger», ikke «mange tider»\n' +
      '• **alvorlig / seriøs**: «alvorlig» = streng/dyster i uttrykket, «seriøs» = oppriktig/ordentlig\n' +
      '• **ryke**: bokstavelig «avgi røyk», men også «å ryke» (et tau, en sene), «å falle gjennom» ' +
      '(en plan, en avtale), eller «å bli slått ut» (en konkurranse)\n' +
      '• **såpass**: étt ord, mange nyanser avhengig av hva det står til\n' +
      '• **heldig / flaks / sjanse**: «heldig» = adjektiv, beskriver en heldig PERSON eller en heldig SITUASJON («Jeg var heldig»); «flaks» = substantiv, selve hell-fenomenet, motsatt «uflaks» («Det var bare flaks»); «sjanse» = substantiv, en mulighet, ikke selve hellet («Jeg fikk en sjanse til å prøve»)\n' +
      '• **forberedt / å forberede seg / å forbedre seg**: «forberedt» = adjektiv, en tilstand («Jeg er forberedt»); «å forberede seg» = refleksivt verb, selve forberedelsen («Jeg må forberede meg til eksamen»); «å forbedre seg» = refleksivt verb, en helt annen betydning — å bli bedre på noe, ikke å gjøre seg klar («Jeg må forbedre meg i matte») — lett å forveksle siden ordene ligner\n' +
      '• **under / i løpet av**: «under» + substantiv peker på et tidspunkt eller en strekning INNENFOR en periode uten å fokusere på hele spennet («under møtet» = på et tidspunkt i løpet av møtet); «i løpet av» + substantiv rammer inn HELE perioden som et spenn som skal fylles/fullføres («i løpet av møtet» = i løpet av hele møtet, innen møtet er ferdig)\n' +
      '• **å fatte**: grunnbetydning = å forstå/skjønne («Jeg fatter ikke hva som skjedde»), men ordet brukes også i en gruppe faste uttrykk der det betyr «å ta/danne» noe abstrakt: «å fatte en beslutning» (å ta en bestemmelse), «å fatte et vedtak» (kommunestyret/styret vedtar noe), «å fatte håp» (å få håp), «å fatte mistanke» (å bli mistenksom), «å fatte interesse for» (å bli interessert i), og imperativen «Fatt mot!» (Vær modig!) — disse erstatter ikke «forstå»-betydningen, de er en egen, fast uttrykksgruppe som må læres samlet\n' +
      '• **å kalle**: tre betydninger — (1) å rope («Mamma kalte på oss fra vinduet»), (2) å gi navn/omtale noen som («Alle kaller henne tante Adele»), (3) refleksivt, å kalle seg noe («Han kaller seg Toto, men han heter Torstein»)\n' +
      '• **å bli/være vant til / å venne seg til**: «vant til» = adjektivuttrykk, en TILSTAND av å ha blitt vant til noe («Hun blir vant til å bo der»); «å venne seg til» = refleksivt verb, selve PROSESSEN med å bli vant til noe, ofte i perfektum for å vise at tilvenningen er fullført («Hun har vennet seg til å bo der») — begge beskriver samme opplevelse, men adjektivuttrykket rammer det inn som en tilstand, mens verbet rammer det inn som noe man aktivt gjorde\n' +
      '• **å bytte / å skifte**: «å bytte» = å gi fra seg noe og få noe tilbake (gjensidig utveksling); «å skifte» = å forandre/veksle. De to er kun synonyme når man bytter TIL NOE AV SAMME SLAG/TYPE (f.eks. klær: «Hun bytter/skifter ofte klær»). De er IKKE synonyme når fokuset ligger på å gi fra seg noe og få noe ANNET tilbake — bytte/bytting av varer («Barna byttet steiner med hverandre», «man kan bytte varen man kjøper i butikken») — der kan bare «å bytte» brukes, fordi vekten ligger på selve den gjensidige utvekslingen, ikke på å erstatte noe med noe av samme type\n' +
      '• **å miste / å tape**: begge oversettes ofte med «lose» på engelsk, men gjelder ulike typer tap. «Å miste» dekker å rote bort noe («å miste nøklene»), å unnvære/ikke ha nok av noe («vi har ingen tid å miste»), å komme for sent til et transportmiddel («å miste bussen»), og å miste noe abstrakt man en gang hadde — syn, hørsel, hår, liv, foreldre, håp, tålmodighet, oversikt, mot. «Å tape» handler derimot om å lide et nederlag eller et økonomisk tap: å tape penger («å tape penger på gambling»), å tape en kamp/konkurranse («Liverpool tapte mot Manchester United»), eller — i det faste refleksive uttrykket «å tape seg» — å miste utseendet/skjønnheten over tid. De to er IKKE synonyme: man kan ikke «tape nøklene» (man roter dem bort, man taper ikke en konkurranse med dem), og man kan ikke «miste en kamp» (en kamp tapes ved nederlag, ikke ved at man roter den bort)\n' +
      '• **samme / like**: «samme» + SUBSTANTIV uttrykker likhet/identitet («De dro ut samme dag» — «den samme dagen» med bestemt form er like vanlig); «like» + ADJEKTIV eller ADVERB uttrykker samme grad («Hun er like vakker som før», «Det har snødd like mye i dag som i går»). De to kan ikke byttes om: «samme» kombineres aldri direkte med et adjektiv/adverb for å uttrykke «like mye», og «like» kombineres aldri direkte med et bart substantiv for å uttrykke «den samme» — «like dag» er ikke gyldig, og «samme vakker» er ikke gyldig\n' +
      '• **å gjelde**: fire ulike betydninger som ikke deler noen felles engelsk oversettelse. Kan bety (1) å VÆRE VIKTIG/stå på spill («Nå gjelder det å løpe fort!»), (2) å HANDLE OM («Det jeg skal fortelle, gjelder min far»), (3) å VÆRE GYLDIG («Denne billetten gjelder ikke»), og (4) å TELLE MED/være inkludert («To av brikkene gjelder ikke»). Betydningene er ikke ombyttbare — en billett som «ikke gjelder» er ugyldig, ikke «som ikke står på spill», og noe som «gjelder» noen handler om dem, ikke er gyldig for dem — substantivet rundt (billett, far, brikke) avgjør hvilken betydning som er ment\n\n' +
      'Å treffe riktig krever å lese hele setningen for betydning, ikke å gjenkjenne overflateordet.'
  },

  'synes-tror': {
    id: 'synes-tror',
    titleEn: '«synes» vs. «tror»',
    titleNb: '«synes» og «tror»',
    explanationEn:
      '«Synes» gives an OPINION about something you can directly perceive or judge — taste, ' +
      'looks, quality: "Jeg synes kaka er god." «Tror» expresses a BELIEF or uncertainty about a ' +
      'fact: "Jeg tror hun kommer senere."\n\n' +
      'You cannot use «synes» about the FUTURE, since you cannot yet have an impression of ' +
      'something that hasn\'t happened — use «tror» instead: "Jeg tror det blir fint vær i morgen" ' +
      '(not «synes»). The one exception is when «synes» combines with «bør» to state an opinion ' +
      'about how the future SHOULD be: "Jeg synes det bør bli fint vær framover." «Tro på» (with ' +
      '«på») means to believe IN someone or something (faith/trust): "Jeg tror på Gud."',
    explanationNb:
      'To ulike betydninger av "think":\n\n' +
      '• **«synes»** — gir en MENING om noe du kan sanse eller vurdere direkte — smak, utseende, kvalitet: "Jeg synes kaka er god."\n' +
      '• **«tror»** — uttrykker TRO eller usikkerhet om et faktum: "Jeg tror hun kommer senere."\n\n' +
      'Vi kan IKKE bruke «synes» om FRAMTIDEN, for vi har ennå ikke noe inntrykk av noe som ikke har skjedd — bruk «tror» i stedet: "Jeg tror det blir fint vær i morgen" (ikke «synes»). Unntaket er når «synes» kombineres med «bør» for å uttrykke en mening om hvordan framtiden BØR bli: "Jeg synes det bør bli fint vær framover." «Tro på» (med «på») betyr å ha tillit til eller tro på noen/noe: "Jeg tror på Gud."'
  },

  'mene-synes-tro-tenke': {
    id: 'mene-synes-tro-tenke',
    titleEn: '«mene», «synes», «tro», «tenke»',
    titleNb: '«mene», «synes», «tro» og «tenke»',
    explanationEn:
      'All four can translate as English "think," but aren\'t interchangeable. «Mene» = hold a ' +
      'stated position/opinion: "Jeg mener at vi bør endre planen." «Synes» = have an impression or ' +
      'reaction, often about something experienced: "Jeg synes maten var god." «Tro» = believe or ' +
      'guess, with some uncertainty about a fact: "Jeg tror det blir sol i morgen." «Tenke» = ' +
      'ponder, have something in mind, or be about to say something: "Hva tenker du på?" "Jeg ' +
      'tenkte å ringe deg i kveld."',
    explanationNb:
      'Alle fire kan oversettes med engelsk «think», men er ikke utskiftbare:\n\n' +
      '• **mene** = ha en uttalt holdning/mening: «Jeg mener at vi bør endre planen.»\n' +
      '• **synes** = ha et inntrykk eller en reaksjon, ofte om noe man har opplevd: «Jeg synes maten var god.»\n' +
      '• **tro** = tro eller gjette, med en viss usikkerhet om et faktum: «Jeg tror det blir sol i morgen.»\n' +
      '• **tenke** = fundere, ha noe i tankene, eller være i ferd med å si noe: «Hva tenker du på?» «Jeg tenkte å ringe deg i kveld.»'
  },

  'sannsynlighet-uttrykk': {
    id: 'sannsynlighet-uttrykk',
    titleEn: 'Expressing probability',
    titleNb: 'Å uttrykke sannsynlighet',
    explanationEn:
      'Several expressions cover different degrees of certainty about something happening: «det er ' +
      'mulig at» (possible), «det er sannsynlig at» / «det er lite sannsynlig at» (likely/unlikely), ' +
      '«det kommer til å» (prediction, fairly confident), «det kan hende at» (might), «jeg tror»/«jeg ' +
      "antar» (I think/assume — speaker's own uncertain belief). «Trolig» and «antakelig» are " +
      'single-adverb paraphrases of «det er sannsynlig at» — same degree of certainty, just ' +
      'compressed into one sentence adverb: "Det er sannsynlig at hun kommer" = "Hun kommer ' +
      'trolig/antakelig." Paraphrasing between them means keeping the same degree of certainty, ' +
      'not just swapping in any probability phrase.',
    explanationNb:
      'Flere uttrykk dekker ulike grader av sikkerhet om at noe skal skje:\n\n' +
      '• **det er mulig at** = mulig\n' +
      '• **det er sannsynlig at / det er lite sannsynlig at** = sannsynlig/usannsynlig\n' +
      '• **det kommer til å** = spådom, ganske sikker\n' +
      '• **det kan hende at** = kan skje\n' +
      '• **jeg tror / jeg antar** = talerens egen usikre oppfatning\n' +
      '• **trolig / antakelig** = ettordsomskrivning av «det er sannsynlig at», samme grad av ' +
      'sikkerhet: «Det er sannsynlig at hun kommer» = «Hun kommer trolig/antakelig.»\n\n' +
      'Å skrive om mellom dem betyr å beholde samme grad av sikkerhet, ikke bare bytte inn et hvilket som helst sannsynlighetsuttrykk.'
  }
};
