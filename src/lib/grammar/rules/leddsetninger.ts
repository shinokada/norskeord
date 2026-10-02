// src/lib/grammar/rules/leddsetninger.ts
// Rules for chapter 4 · Leddsetninger (Part 1). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const LEDDSETNINGER_RULES: Record<string, GrammarRule> = {
  'subordinate-order': {
    id: 'subordinate-order',
    titleEn: 'Subordinate clause word order',
    titleNb: 'Leddsetningers ordstilling',
    explanationEn:
      'In subordinate clauses introduced by conjunctions (at, fordi, hvis, når, selv om, …): ' +
      '1) No inversion — subject always precedes verb. ' +
      '2) Adverbs like "ikke", "alltid", "aldri" go between subject and verb. ' +
      '"Jeg vet at hun alltid spiser frokost." (I know that she always eats breakfast.)',
    explanationNb:
      'I leddsetninger innledet av konjunksjoner (at, fordi, hvis, når, selv om, …):\n\n' +
      '• **ingen inversjon** — subjektet kommer alltid før verbet\n' +
      '• **adverbplassering** — adverb som «ikke», «alltid», «aldri» plasseres mellom subjekt og verb: "Jeg vet at hun alltid spiser frokost."'
  },

  'da-naar': {
    id: 'da-naar',
    titleEn: '«da» vs. «når»',
    titleNb: '«da» og «når»',
    explanationEn:
      'Use «da» for a SINGLE completed event in the past: "Da jeg var femten, flyttet jeg til ' +
      'Norge." Use «når» for a REPEATED/habitual past event, or for anything present or future: ' +
      '"Når jeg var liten, lekte jeg ute hver dag." (repeated) "Ring meg når du får tid." (future) ' +
      'A common test: if you can substitute "hver gang" and it still makes sense, use «når»; if it ' +
      'describes one specific occasion, use «da». «Da» also attaches directly to a noun phrase ' +
      'naming the specific occasion — «den gangen da», «den dagen da», «året da» — to point back at ' +
      'one particular past moment ("Husker du den gangen da vi dro til Danmark?").',
    explanationNb:
      'To hovedbruk av «da» og «når»:\n\n' +
      '• **«da»** — brukes om én avsluttet hendelse i fortiden: "Da jeg var femten, flyttet jeg til Norge."\n' +
      '• **«når»** — brukes om en gjentatt/vanemessig hendelse i fortiden, eller om noe i presens/framtid: "Når jeg var liten, lekte jeg ute hver dag." (gjentatt) "Ring meg når du får tid." (framtid)\n\n' +
      'Enkel test: hvis du kan sette inn «hver gang» og det fortsatt gir mening, bruk «når»; ' +
      'gjelder det én bestemt anledning, bruk «da».\n\n' +
      '«Da» kan også kobles direkte til et substantiv som navngir anledningen — «den gangen da», «den dagen da», «året da» — for å peke tilbake på étt bestemt tidspunkt i fortiden ("Husker du den gangen da vi dro til Danmark?").'
  },

  'hvis-om-betingelse': {
    id: 'hvis-om-betingelse',
    titleEn: '«hvis» vs. «om» (condition vs. embedded question)',
    titleNb: '«hvis» og «om» (betingelse og leddsetning)',
    explanationEn:
      '«Hvis» introduces a CONDITION ("if"): "Jeg kommer hvis jeg har tid." «Om» introduces an ' +
      'embedded YES/NO QUESTION ("whether"): "Jeg vet ikke om jeg har tid." The two look similar ' +
      'because both can often be translated "if" in English, but only «hvis» states a condition — ' +
      '«om» always follows a verb of asking/knowing/wondering about an uncertain fact.',
    explanationNb:
      'To hovedbruk av «hvis» og «om»:\n\n' +
      '• **«hvis»** — innleder en BETINGELSE: "Jeg kommer hvis jeg har tid."\n' +
      '• **«om»** — innleder en leddsetning som gjengir et JA/NEI-SPØRSMÅL: "Jeg vet ikke om jeg har tid."\n\n' +
      'De to ligner fordi begge ofte kan oversettes med engelsk "if", men bare «hvis» uttrykker en betingelse — «om» kommer alltid etter et verb som spør/vet/lurer på noe usikkert.'
  },

  'indirekte-tale-at-om': {
    id: 'indirekte-tale-at-om',
    titleEn: 'Reported speech: «at» vs. «om»',
    titleNb: 'Referert tale: «at» og «om»',
    explanationEn:
      'Report a STATEMENT with «at»: "Det er kaldt ute." → "Han sier at det er kaldt ute." ' +
      'Report a YES/NO QUESTION with «om»: "Skal du ut?" → "Han spør om hun skal ut." A ' +
      'wh-question keeps its own question word instead of «om»: "Hvor bor du?" → "Han spør hvor ' +
      'hun bor." When the question word (hvem, hva, hvilken X) is itself the SUBJECT of the ' +
      'embedded clause, Norwegian inserts «som» directly after it: "Jeg vet ikke hvem som kommer ' +
      'i dag." "Han lurte på hva som hadde skjedd." No «som» is added when the question word is ' +
      'the OBJECT instead: "Jeg vet ikke hva han sier." If the REPORTING verb (sier/sa, spør/spurte) ' +
      "is itself in preteritum, the reported clause's verb usually shifts back one step in " +
      'time too — presens → preteritum: "Alt er ok" + "Roger sier" → "Roger sier at alt er ok" ' +
      '(no shift, presens stays), but "Alt er ok" + "Roger sa" → "Roger sa at alt var ok" ' +
      "(shift, matching the preteritum reporting verb). The reported clause's tense mirrors " +
      'whether the ORIGINAL statement is still true/current (no shift needed) or is being ' +
      'reported purely as something said in the past (shift to match «sa»/«spurte»). Besides a full ' +
      '«at»/«om»-clause, Norwegian also marks that information is SECONDHAND (hearsay, not verified ' +
      'firsthand) with «ifølge X» (according to X) placed before the clause, or with the modal ' +
      'adverb «visstnok» inside it: "Ifølge far vil mor at vi skal male hytta" (according to father, ' +
      'mother wants...), "Mor vil visstnok at vi skal male hytta" (mother apparently wants...). ' +
      'Both can combine with an ordinary «at»-clause and behave like any other fronted adverbial or ' +
      'setningsadverbial for word order.',
    explanationNb:
      'Norsk skiller mellom flere typer referert tale, avhengig av hva som refereres:\n\n' +
      '• **påstand** → «at»: "Det er kaldt ute." → "Han sier at det er kaldt ute."\n' +
      '• **ja/nei-spørsmål** → «om»: "Skal du ut?" → "Han spør om hun skal ut."\n' +
      '• **spørreordspørsmål** → beholder sitt eget spørreord i stedet for «om»: "Hvor bor du?" → "Han spør hvor hun bor."\n\n' +
      'Når spørreordet (hvem, hva, hvilken X) selv er SUBJEKTET i den innfelte setningen, setter norsk inn «som» rett etter: "Jeg vet ikke hvem som kommer i dag." "Han lurte på hva som hadde skjedd." Det legges ikke til «som» når spørreordet i stedet er OBJEKTET: "Jeg vet ikke hva han sier."\n\n' +
      'Hvis SELVE GJENGIVELSESVERBET (sier/sa, spør/spurte) står i preteritum, flyttes vanligvis også tiden i den refererte setningen ett hakk bakover — presens → preteritum: "Alt er ok" + "Roger sier" → "Roger sier at alt er ok" (ingen forskyvning, presens forblir), men "Alt er ok" + "Roger sa" → "Roger sa at alt var ok" (forskyvning, samsvarer med preteritumsverbet). Tiden i den refererte setningen følger av om det opprinnelige utsagnet fortsatt gjelder/er aktuelt (ingen forskyvning nødvendig) eller om det bare refereres som noe som ble sagt i fortiden (forskyvning for å samsvare med «sa»/«spurte»).\n\n' +
      'Utenom en hel «at»/«om»-setning markerer norsk også at informasjonen er ANDREHÅNDS (hørt fra andre, ikke bekreftet selv) med «ifølge X» (ifølge noen) foran setningen, eller med det modale adverbet «visstnok» inne i den: "Ifølge far vil mor at vi skal male hytta" (ifølge det far sier, vil mor ...), "Mor vil visstnok at vi skal male hytta" (mor vil visstnok/antakelig ...). Begge kan kombineres med en vanlig «at»-setning og oppfører seg som ethvert annet fundamentplassert adverbial eller setningsadverbial i ordstillingen.'
  },

  'relative-som': {
    id: 'relative-som',
    titleEn: 'Relative clauses with "som"',
    titleNb: 'Relativsetninger med "som"',
    explanationEn:
      '"som" introduces a relative clause and stands for the subject or object of the embedded ' +
      'sentence: "Mannen som bor her, er lege." "Boka som jeg leste, var god." When "som" is the ' +
      'SUBJECT of the embedded clause it is always required ("en venn som ikke kommer" — "som" ' +
      'stands for "vennen"). When "som" is instead the OBJECT, it becomes optional at this level ' +
      'and both versions are correct: "Boka som jeg leste, var god" = "Boka jeg leste, var god." ' +
      'A relative clause is subordinate, so adverbs like "ikke" come BEFORE the verb regardless of ' +
      'whether "som" is written out: "en venn som ikke kommer", "en bok jeg ikke har lest". For a ' +
      'PLACE noun, «der» can replace «som … [preposition]», avoiding a stranded preposition at the ' +
      'end of the clause — more typical of formal/written style: "byen der jeg bor" = "byen som ' +
      'jeg bor i". «Der» only works for places, never for people or things.',
    explanationNb:
      '«Som» innleder en relativsetning og står for subjektet eller objektet i den innfelte ' +
      'setningen: "Mannen som bor her, er lege." "Boka som jeg leste, var god."\n\n' +
      '• Når «som» er SUBJEKT i leddsetningen, er det alltid obligatorisk: "en venn som ikke kommer" ("som" står for "vennen").\n' +
      '• Når «som» i stedet er OBJEKT, blir det valgfritt på dette nivået, og begge versjoner er riktige: "Boka som jeg leste, var god" = "Boka jeg leste, var god."\n' +
      '• En relativsetning er en leddsetning, så adverb som «ikke» kommer FØR verbet uansett om «som» skrives ut eller ikke: "en venn som ikke kommer", "en bok jeg ikke har lest".\n' +
      '• Foran et STEDSSUBSTANTIV kan «der» erstatte «som … [preposisjon]» og unngå en etterhengt preposisjon til slutt i setningen — mer typisk for formelt/skriftlig språk: "byen der jeg bor" = "byen som jeg bor i". «Der» fungerer bare om steder, aldri om personer eller ting.'
  }
};
