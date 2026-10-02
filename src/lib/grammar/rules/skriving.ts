// src/lib/grammar/rules/skriving.ts
// Rules for chapter 21 · Skriving (Part 4). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const SKRIVING_RULES: Record<string, GrammarRule> = {
  kommaregler: {
    id: 'kommaregler',
    titleEn: 'Comma rules (kommaregler)',
    titleNb: 'Kommaregler',
    explanationEn:
      'Two common comma rules. 1) Subordinate clause comma: when a subordinate clause is fronted ' +
      '(placed before the main clause), a comma goes right after it, before the main clause starts: ' +
      '"Selv om det regnet, gikk vi en tur." When the subordinate clause instead follows the main ' +
      'clause, no comma is needed: "Vi gikk en tur selv om det regnet." 2) List comma (oppramsing): ' +
      'items in a list are separated by commas, but NOT before the final item when it is joined by ' +
      '«og»/«eller»: "Hun kjøpte epler, bananer og pærer." — comma after «epler» and «bananer», but ' +
      'no comma before «og pærer».',
    explanationNb:
      'To vanlige kommaregler:\n\n' +
      '• **komma ved leddsetning** — når en leddsetning er flyttet foran helsetningen (fundamentplassert), settes det komma rett etter den, før helsetningen fortsetter: "Selv om det regnet, gikk vi en tur." Når leddsetningen i stedet kommer etter helsetningen, trengs det ikke komma: "Vi gikk en tur selv om det regnet."\n' +
      '• **komma i oppramsing** — elementer i en liste skilles med komma, men IKKE foran det siste elementet når det bindes sammen med «og»/«eller»: "Hun kjøpte epler, bananer og pærer." — komma etter «epler» og «bananer», men ikke komma foran «og pærer».'
  }
};
