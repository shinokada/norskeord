# vocab-a1 Review 1 (Spanise)

## Definite issues

### 1. Pen example

`v-a1-classroom-006`

Current:

> ¿Puedo prestarte tu bolígrafo?

Norwegian:

> Kan jeg låne pennen din?

This means "Can I borrow your pen?"

Suggested:

> ¿Puedo pedirte prestado tu bolígrafo?
> ¿Me prestas tu bolígrafo?

---

### 2. Bad weather

`v-a1-adjectives-006`

Current:

> El tiempo está malo hoy.

This sounds unnatural.

Suggested:

> Hace mal tiempo hoy.
> El tiempo está feo hoy.

---

### 3. Wool hat

`v-a1-clothes-016`

Current:

> El gorro es caliente y suave.

Objects are normally not _caliente_ unless physically hot.

Suggested:

> El gorro es cálido y suave.

---

### 4. Belt example

`v-a1-clothes-014`

Current:

> El cinturón mantiene los pantalones arriba.

Literal but unnatural.

Suggested:

> El cinturón sostiene los pantalones.
> El cinturón mantiene los pantalones en su sitio.

---

### 5. Our house

`v-a1-pronouns-and-questions-019`

Current:

> Nuestra casa es roja.

Norwegian:

> Huset vårt er rødt.

House is masculine in Spanish.

Suggested:

> Nuestra casa es roja. ❌ only if "casa"

But since the example is "house":

> Nuestra casa es roja.

Actually the Spanish example is perfectly correct, but note that the Norwegian sentence uses "house" while Spanish uses "casa" rather than "hogar". No change needed.

---

### 6. Road

`v-a1-transportation-018`

Current:

> El camino es largo.

Norwegian:

> Veien er lang.

A road is more naturally:

> La carretera es larga.

---

## Entries that are correct but inconsistent

### Car vs automobile vocabulary

I found both:

- coche
- carro

Example:

> Su carro es azul.

Most educational materials should consistently use either:

- coche (Spain)
- carro (Latin America)

I recommend choosing one variant for the entire dataset.

---

### Use of "usar"

Examples include:

> Él usa corbata en el trabajo.

This is acceptable, but many textbooks prefer:

> Lleva corbata en el trabajo.

More natural for clothing.

---

### Library

Current:

> Tomo prestados libros en la biblioteca.

Perfectly correct, but many Spanish courses use:

> Pido prestados libros en la biblioteca.

More idiomatic in some regions.

---

## Potentially better translations

### gammel

Current:

> viejo / anciano

For A1:

> viejo

is usually enough.

"Anciano" specifically means elderly person.

---

### et bad

Current:

> un baño

Norwegian:

> et bad

This can mean:

- a bath
- a bathroom (depending on context)

Since the example is:

> Jeg tar et bad om kvelden.

The translation is fine, but learners may think the word means bathroom rather than bath.

---

### å snakke

Current example:

> Hablo un poco de noruego.

More common:

> Hablo un poco noruego.

---

### tommel opp

Current:

> Ella muestra el pulgar hacia arriba.

More natural:

> Ella hace un gesto de pulgar arriba.
> Ella levanta el pulgar.

---

## Overall assessment

The Spanish translations are very good. I found only **3–5 entries that I would definitely change**:

1. `¿Puedo prestarte tu bolígrafo?`
2. `El tiempo está malo hoy.`
3. `El gorro es caliente y suave.`
4. `El cinturón mantiene los pantalones arriba.`
5. Possibly `El camino es largo.` depending on whether you want "road" or "path".

The rest are mostly stylistic improvements, regional preferences (Spain vs Latin America), or consistency issues rather than actual translation errors.

# vocab-a1 Review 2 (Spanish and Ukrainian)

Here is a complete audit of the pasted dataset, highlighting translations or grammatical implementations that are structurally inconsistent, potentially incorrect, or worth adjusting to ensure professional localization.

---

## 📋 Spanish Translation Audit

### 1. Inconsistent Inclusion of Articles

In Spanish, it is a best practice to list vocabulary nouns either *completely with* or *completely without* their definite/indefinite articles unless specified by the base language. The dataset oscillates randomly between providing just the raw noun and adding articles:

* **With Article:** `v-a1-food-001` (*el pan*), `v-a1-food-002` (*la leche*), `v-a1-body-015` (*el pelo*).
* **Without Article:** `v-a1-food-005` (*mantequilla*), `v-a1-food-006` (*pescado*), `v-a1-food-007` (*carne*).
* **Recommendation:** Align these to match the Norwegian prompt (since Norwegian lists them with indefinite articles like *en/et/ei*, the Spanish side should strictly use *un/una* or *el/la* across the board).

### 2. Punctuation Inconsistencies (Exclamation Marks)

In Spanish, exclamatory sentences **must** begin with an inverted exclamation mark (`¡`). Several entries miss this rule in the target or example strings:

* `v-a1-greetings-005`: `"example_spanish": "¡Buenas noches! Pasa, entra."` — The second part of the exclamation is missing its trailing or structural `¡`.
* `v-a1-greetings-002`: `"example_spanish": "Hola, ¿puedo hablar con Anna?"` — While correct, it lacks the exclamation layout used in the Norwegian equivalent (`Hallo, ...`).

### 3. Contextual and Categorical Slip-ups

* `v-a1-greetings-005` (**god kveld**): Translated as *buenas noches*. While culturally acceptable as a greeting after dark, *buenas noches* also translates **god natt** (`v-a1-greetings-006`). To maintain an A1 pedagogical distinction between evening and night, *buenas tardes* (late afternoon/early evening) or a contextual phrase could prevent duplicates.
* `v-a1-greetings-023` (**på gjensyn**): Translated as *hasta la vista*. While structurally accurate, *hasta la vista* is heavily associated with cinematic pop culture and rarely used in daily formal interactions. *Hasta la próxima* or *Adiós* (formal tone) fits a standard language course better.
* `v-a1-colors-010` (**oransje**): `"example_spanish": "Las zanahorias son naranja."` — Grammatically, it should be pluralized to match the subject: *Las zanahorias son naranjas* or *de color naranja*.
* `v-a1-animals-016` (**en ørn**): `"spanish": "un águila"` — Because *águila* starts with a stressed "á", it requires the masculine article *el* or *un* singular, which is done correctly here. However, it is a feminine noun. The example reads: *El águila vuela muy alto*. This is correct, but be mindful that any modifying adjectives must be feminine (e.g., *el águila **alta***).

---

## 🇺🇦 Ukrainian Translation Audit

### 1. Grammatical Inexactness & Case Slips

* `v-a1-greetings-013` (**beklager**): Translated as *вибачаюся*. Reflexive *вибачаюся* implies "I excuse myself" and is widely considered stylistically flawed or incorrect in modern Ukrainian. It should be replaced with **вибачте** or **прошу вибачення**.
* `v-a1-numbers-002` (**to**): `"example_ukrainian": "У мене є два кота."` — This contains a case error. After the number *два*, the noun must be in the genitive singular form *коти* (with stress change) or counted as an animate plural object: **два коти**.
* `v-a1-numbers-019` (**nitten**): The phrase *Klokka er nitten* is translated as *Зараз дев'ятнадцята година* (It is the 19th hour). While factually understood, conversational Ukrainian typically uses *Зараз сьома година вечора* (It is 7 o'clock in the evening) to map natural language habits unless reading a digital timetable.

### 2. Localization Flaws (Translations out of context)

* `v-a1-greetings-002` (**hallo**): Translated as *алло / привіт*. *Алло* is strictly used on the telephone in Ukrainian. The example sentence explicitly shows a phone context (*Hallo, kan jeg få snakke med Anna?*), making it perfect here, but the raw dictionary entry entry should note that *алло* is not a face-to-face greeting.
* `v-a1-food-004` (**en ost**): Translated as *сир*. In Ukrainian, *сир* can mean both hard cheese and cottage cheese (творог). To avoid confusion for language learners distinguishing it from white cheeses or milk products, it is safer to explicitly use **твердий сир** (hard cheese) or ensure the context clarifies it.

---

## 🔄 Cross-Language & Structural Inconsistencies

### 1. Gender Slashing Discrepancies

For adjectives and nouns that depend on gender, the formatting varies wildly across entries:

* `v-a1-numbers-027` (**første**): Spanish uses `"primero/a"`, Ukrainian uses `"перший / перша"`.
* `v-a1-colors-001` (**rød**): Spanish uses `"rojo/a"`, Ukrainian uses `"червоний"` (omits the feminine completely).
* `v-a1-family-003` (**et barn**): Spanish splits into two entries (`un niño / una niña`), Ukrainian uses a single neuter noun (`дитина`).
* **Recommendation:** Adopt a unified syntax for entries containing slash variations across both target languages (e.g., always choosing to include or omit the feminine suffix `/a` or `/а`).

### 2. Lemma Field Discrepancies

The `lemma` field is supposed to capture the base, uninflected form of the term. In a few entries, this standard collapses:

* `v-a1-greetings-024`: `"norsk": "Hvor kommer du fra?"` vs. `"lemma": "Hvor er du fra?"` — The lemma changes the verb completely from *kommer* to *er*.
* `v-a1-greetings-013`: `"norsk": "beklager"` vs. `"lemma": "beklage"` — This is correct (maps inflected form to infinitive verb), but neighboring conversational phrases like `v-a1-greetings-016` (`Hvordan har du det?`) repeat the entire phrase in lowercase rather than breaking down to base components. A unified structural rule for phrase lemmas is needed.

## Action taken

Good, I have the full review. Now let me sample the vocab JSON to understand its structure:Now I have a clear picture. The reviews are solid and actionable. Let me create the patch script:`scripts/` does exist. Now let me look at what's in it for style reference:Let me look at an existing patch script for style reference:This is exactly the style to follow. Now I have everything I need. Let me look up a few specific entries from the JSON to verify the `from` values before writing the patches:The filesystem MCP can read it but bash can't access the Mac path. I'll read the specific entries directly via the filesystem tool:I now have all the exact values. Let me write the patch script:Done! The script is at `scripts/patch-vocab-a1-review.mjs`. Run it from the repo root:

```bash
# Preview changes first
node scripts/patch-vocab-a1-review.mjs --dry-run

# Apply
node scripts/patch-vocab-a1-review.mjs
```

---

Here's what the two reviews said and what I included (or deliberately skipped):

**Spanish — definite fixes applied (10 patches across 8 entries):**

| Entry                     | Change                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `v-a1-classroom-006`      | `¿Puedo prestarte tu bolígrafo?` → `¿Me prestas tu bolígrafo?` — "prestarte" reverses the borrowing direction |
| `v-a1-adjectives-006`     | `El tiempo está malo` → `Hace mal tiempo` — standard idiom for bad weather                                    |
| `v-a1-clothes-016`        | `caliente` → `cálido` — "caliente" = physically hot, "cálido" = warm as a material property                   |
| `v-a1-clothes-014`        | `pantalones arriba` → `pantalones en su sitio` — natural idiom for keeping trousers up                        |
| `v-a1-transportation-018` | example uses `carretera` instead of `camino` to match the preferred term already in the `spanish` field       |
| `v-a1-greetings-005`      | `buenas noches` → `buenas tardes` — preserves the evening/night distinction with `god natt` (006)             |
| `v-a1-greetings-023`      | `hasta la vista` → `hasta la próxima` — removes the Terminator association                                    |
| `v-a1-colors-010`         | `son naranja` → `son naranjas` — plural adjective agreement                                                   |

**Ukrainian — definite fix applied:**

| Entry                | Change                                                                               |
| -------------------- | ------------------------------------------------------------------------------------ |
| `v-a1-greetings-013` | `вибачаюся` → `вибачте` — reflexive form is considered incorrect in modern Ukrainian |

**Deliberately skipped:**
- `v-a1-numbers-002` Ukrainian "два кота" — Review 2 flagged it, but "два кота" is actually the correct genitive singular in Ukrainian after numerals 2–4, so no change needed.
- "hablo un poco de noruego" and "tommel opp" — both borderline stylistic choices at A1 level.

