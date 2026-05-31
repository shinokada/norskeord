#!/usr/bin/env python3
"""
add_a2_words.py
Adds 17 new A2-level Norwegian words to vocab-a2.json.

Usage:
    python3 add_a2_words.py
    python3 add_a2_words.py --dry-run
    python3 add_a2_words.py --file /path/to/vocab-a2.json
"""

import json
import argparse
from pathlib import Path

# Absolute path — no need to place the script in any particular folder
A2_FILE = Path("/Users/shinichiokada/Svelte/svelte-languages/norskeord/src/lib/data/vocab-a2.json")

NEW_WORDS = [
    {
        "norsk": "faktisk",
        "lemma": "faktisk",
        "english": "actually / in fact",
        "example": "Det er faktisk sant.",
        "example_english": "That is actually true.",
        "definition": "Brukes for å understreke at noe virkelig er tilfellet.",
        "level": "A2",
        "category": "communication",
        "part": "adverb",
    },
    {
        "norsk": "en krig",
        "lemma": "krig",
        "english": "a war",
        "example": "Krigen varte i mange år.",
        "example_english": "The war lasted for many years.",
        "definition": "En væpnet konflikt mellom land eller grupper.",
        "level": "A2",
        "category": "social-life",
        "part": "noun",
    },
    {
        "norsk": "en gud",
        "lemma": "gud",
        "english": "a god",
        "example": "De trodde på mange guder.",
        "example_english": "They believed in many gods.",
        "definition": "Et høyere vesen som mange religioner tilber.",
        "level": "A2",
        "category": "social-life",
        "part": "noun",
    },
    {
        "norsk": "i tillegg",
        "lemma": "i tillegg",
        "english": "in addition / also",
        "example": "Han snakker norsk og i tillegg engelsk.",
        "example_english": "He speaks Norwegian and in addition English.",
        "definition": "Brukes for å legge til noe ekstra.",
        "level": "A2",
        "category": "communication",
        "part": "phrase",
    },
    {
        "norsk": "med andre ord",
        "lemma": "med andre ord",
        "english": "in other words",
        "example": "Med andre ord, du er ikke enig.",
        "example_english": "In other words, you disagree.",
        "definition": "Brukes for å forklare noe på en annen måte.",
        "level": "A2",
        "category": "communication",
        "part": "phrase",
    },
    {
        "norsk": "ettersom",
        "lemma": "ettersom",
        "english": "since / because / as",
        "example": "Ettersom det regner, tar vi bussen.",
        "example_english": "Since it is raining, we will take the bus.",
        "definition": "Konjunksjon som angir årsak eller tid.",
        "level": "A2",
        "category": "communication",
        "part": "conjunction",
    },
    {
        "norsk": "frihet",
        "lemma": "frihet",
        "english": "freedom / liberty",
        "example": "Frihet er viktig for alle mennesker.",
        "example_english": "Freedom is important for all people.",
        "definition": "Tilstanden der man kan handle uten å bli hindret.",
        "level": "A2",
        "category": "social-life",
        "part": "noun",
    },
    {
        "norsk": "en kjærlighet",
        "lemma": "kjærlighet",
        "english": "love",
        "example": "Kjærligheten mellom dem var sterk.",
        "example_english": "The love between them was strong.",
        "definition": "En sterk følelse av hengivenhet for noen.",
        "level": "A2",
        "category": "social-life",
        "part": "noun",
    },
    {
        "norsk": "en vennskap",
        "lemma": "vennskap",
        "english": "a friendship",
        "example": "De har hatt et godt vennskap i mange år.",
        "example_english": "They have had a good friendship for many years.",
        "definition": "Et nært og tillitsfullt forhold mellom to eller flere personer.",
        "level": "A2",
        "category": "social-life",
        "part": "noun",
    },
    {
        "norsk": "en ekteskap",
        "lemma": "ekteskap",
        "english": "a marriage",
        "example": "De feiret ti år med ekteskap.",
        "example_english": "They celebrated ten years of marriage.",
        "definition": "En formell union mellom to personer.",
        "level": "A2",
        "category": "social-life",
        "part": "noun",
    },
    {
        "norsk": "en prest",
        "lemma": "prest",
        "english": "a priest / a minister",
        "example": "Presten holdt en tale i kirken.",
        "example_english": "The priest gave a speech in the church.",
        "definition": "En person som leder religiøse seremonier.",
        "level": "A2",
        "category": "occupations",
        "part": "noun",
    },
    {
        "norsk": "en prøve",
        "lemma": "prøve",
        "english": "a test / an exam",
        "example": "Vi har en prøve i norsk i morgen.",
        "example_english": "We have a Norwegian test tomorrow.",
        "definition": "En skriftlig eller muntlig test på skolen.",
        "level": "A2",
        "category": "social-life",
        "part": "noun",
    },
    {
        "norsk": "en professor",
        "lemma": "professor",
        "english": "a professor",
        "example": "Professoren underviser ved universitetet.",
        "example_english": "The professor teaches at the university.",
        "definition": "En høyt kvalifisert lærer ved et universitet.",
        "level": "A2",
        "category": "occupations",
        "part": "noun",
    },
    {
        "norsk": "en kunde",
        "lemma": "kunde",
        "english": "a customer",
        "example": "Kunden spurte om prisen på jakken.",
        "example_english": "The customer asked about the price of the jacket.",
        "definition": "En person som kjøper varer eller tjenester.",
        "level": "A2",
        "category": "shopping",
        "part": "noun",
    },
    {
        "norsk": "et kontinent",
        "lemma": "kontinent",
        "english": "a continent",
        "example": "Afrika er et stort kontinent.",
        "example_english": "Africa is a large continent.",
        "definition": "Et av jordens store landområder, for eksempel Europa eller Asia.",
        "level": "A2",
        "category": "nature",
        "part": "noun",
    },
    {
        "norsk": "et klima",
        "lemma": "klima",
        "english": "a climate",
        "example": "Norge har et kaldt klima.",
        "example_english": "Norway has a cold climate.",
        "definition": "Det vanlige været i et område over lang tid.",
        "level": "A2",
        "category": "environment",
        "part": "noun",
    },
    {
        "norsk": "en vulkan",
        "lemma": "vulkan",
        "english": "a volcano",
        "example": "Vulkanen spydde ut lava.",
        "example_english": "The volcano spewed out lava.",
        "definition": "Et fjell som kan kaste ut lava og aske.",
        "level": "A2",
        "category": "nature",
        "part": "noun",
    },
]


def main():
    parser = argparse.ArgumentParser(description="Add 17 new words to vocab-a2.json")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--file", type=Path, default=A2_FILE, help="Path to vocab-a2.json")
    args = parser.parse_args()

    a2_path = args.file.resolve()
    print(f"Target file: {a2_path}")

    if not a2_path.exists():
        print(f"ERROR: File not found: {a2_path}")
        return

    with open(a2_path, encoding="utf-8") as f:
        a2 = json.load(f)

    existing_norsk = {e["norsk"] for e in a2}

    to_add = []
    skipped = []
    for entry in NEW_WORDS:
        if entry["norsk"] in existing_norsk:
            skipped.append(entry["norsk"])
        else:
            to_add.append(entry)

    print(f"vocab-a2.json currently has {len(a2)} entries.")
    print(f"\nWords to ADD ({len(to_add)}):")
    for e in to_add:
        print(f"  + {e['norsk']!r:<22} [{e['category']}]")

    if skipped:
        print(f"\nWords already present — skipped ({len(skipped)}):")
        for w in skipped:
            print(f"  = {w!r}")

    if args.dry_run:
        print("\nDry run — no changes written.")
        return

    a2.extend(to_add)

    with open(a2_path, "w", encoding="utf-8") as f:
        json.dump(a2, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"\nDone. vocab-a2.json now has {len(a2)} entries (+{len(to_add)} added).")


if __name__ == "__main__":
    main()