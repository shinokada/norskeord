# Dexie.js + JSON Export/Import — Implementation Plan

## Overview

Replace `localStorage` with **Dexie.js** (IndexedDB wrapper) as the single persistent storage layer for the app. Add a **JSON export/import** feature as a backup/restore mechanism. This supports:

- Voice settings persistence (speed, pitch, voice name)
- Word tagging (learned / difficult) per vocab entry
- Downloadable word lists from external sources
- User-controlled deck filtering by tag

---

## Phase 1 — Install & Schema

### Install

```bash
pnpm add dexie
```

### Schema — `src/lib/db.ts`

```ts
import Dexie, { type Table } from 'dexie';
import type { VocabEntry, CEFRLevel } from './types';

// A tag applied by the user to a specific word
export interface WordTag {
  id?: number;
  listId: string; // e.g. 'norske-a1' or 'downloaded-oslo-pack'
  wordId: string; // `${norsk}__${level}__${category}` — see makeWordId()
  tag: 'learned' | 'difficult';
  updatedAt: number; // Date.now()
}

// A downloaded word list (not the built-in ones bundled in /src/lib/data)
export interface WordList {
  id: string; // slug, e.g. 'oslo-daily-pack'
  title: string;
  language: string; // 'nb' for Norwegian
  level?: CEFRLevel;
  entries: VocabEntry[];
  downloadedAt: number;
}

// Singleton row for voice settings (replaces localStorage keys)
export interface VoiceSettings {
  id: 'singleton';
  speed: string;
  pitch: string;
  voiceName: string;
}

class AppDB extends Dexie {
  tags!: Table<WordTag>;
  wordLists!: Table<WordList>;
  voiceSettings!: Table<VoiceSettings>;

  constructor() {
    super('norskeord');
    this.version(1).stores({
      // ++id = auto-increment PK; compound index on [listId+wordId] for fast lookup
      tags: '++id, [listId+wordId], listId, tag',
      wordLists: 'id',
      voiceSettings: 'id'
    });
  }
}

export const db = new AppDB();

// Stable, human-readable ID for a VocabEntry (no numeric IDs in the JSON data)
export function makeWordId(entry: VocabEntry): string {
  return `${entry.norsk}__${entry.level}__${entry.category}`;
}
```

---

## Phase 2 — Migrate Voice Settings

Replace the three `localStorage` keys added in v2 (`voice-settings-speed`, `-pitch`, `-voice`) with a single Dexie read/write.

### `src/lib/SpeakButton.svelte` changes

**Read on mount:**

```ts
import { db } from './db';
import { onMount } from 'svelte';

let speed = $state('1');
let pitch = $state('1');

onMount(async () => {
  const saved = await db.voiceSettings.get('singleton');
  if (saved) {
    speed = saved.speed;
    pitch = saved.pitch;
    // selectedVoiceName handled inside loadVoices() below
  }
  loadVoices();
  // ... rest of existing onMount
});
```

**Write on change** (replace `localStorage.setItem` calls):

```ts
async function saveVoiceSettings() {
  await db.voiceSettings.put({
    id: 'singleton',
    speed,
    pitch,
    voiceName: selectedVoiceName
  });
}

// Call saveVoiceSettings() in onSelect for speed/pitch and onchange for voice select
// instead of the individual localStorage.setItem calls
```

**One-time migration** (optional, for existing users):

```ts
onMount(async () => {
  // Migrate from localStorage if Dexie record doesn't exist yet
  const existing = await db.voiceSettings.get('singleton');
  if (!existing) {
    const speed = localStorage.getItem('voice-settings-speed') ?? '1';
    const pitch = localStorage.getItem('voice-settings-pitch') ?? '1';
    const voiceName = localStorage.getItem('voice-settings-voice') ?? '';
    await db.voiceSettings.put({ id: 'singleton', speed, pitch, voiceName });
    localStorage.removeItem('voice-settings-speed');
    localStorage.removeItem('voice-settings-pitch');
    localStorage.removeItem('voice-settings-voice');
  }
});
```

---

## Phase 3 — Word Tagging

### Tag helpers — `src/lib/tags.ts`

```ts
import { db, makeWordId } from './db';
import type { VocabEntry } from './types';

export type Tag = 'learned' | 'difficult';

export async function setTag(listId: string, entry: VocabEntry, tag: Tag | null) {
  const wordId = makeWordId(entry);
  const existing = await db.tags.where('[listId+wordId]').equals([listId, wordId]).first();

  if (tag === null) {
    if (existing?.id) await db.tags.delete(existing.id);
  } else if (existing) {
    await db.tags.update(existing.id!, { tag, updatedAt: Date.now() });
  } else {
    await db.tags.add({ listId, wordId, tag, updatedAt: Date.now() });
  }
}

export async function getTagsForList(listId: string): Promise<Map<string, Tag>> {
  const rows = await db.tags.where('listId').equals(listId).toArray();
  return new Map(rows.map((r) => [r.wordId, r.tag]));
}

export async function getTag(listId: string, entry: VocabEntry): Promise<Tag | null> {
  const row = await db.tags
    .where('[listId+wordId]')
    .equals([listId, makeWordId(entry)])
    .first();
  return row?.tag ?? null;
}
```

### UI — tag buttons on the flashcard

Add two small toggle buttons (✓ Learned / ★ Difficult) below the flashcard in `VocabFlashcardPage.svelte`. Clicking a tag that's already set clears it (toggle behaviour).

```svelte
<script lang="ts">
  import { setTag, getTagsForList } from '$lib/tags';
  import { makeWordId } from '$lib/db';

  // listId derived from current route level, e.g. 'norske-a1'
  export let listId: string;

  let tagMap = $state(new Map<string, 'learned' | 'difficult'>());

  // Load tags when deck changes
  $effect(() => {
    getTagsForList(listId).then((m) => (tagMap = m));
  });

  async function toggleTag(tag: 'learned' | 'difficult') {
    if (!current) return;
    const wordId = makeWordId(current.entry);
    const existing = tagMap.get(wordId);
    const next = existing === tag ? null : tag;
    await setTag(listId, current.entry, next);
    // Update local map reactively
    const updated = new Map(tagMap);
    if (next === null) updated.delete(wordId);
    else updated.set(wordId, next);
    tagMap = updated;
  }

  let currentTag = $derived(current ? tagMap.get(makeWordId(current.entry)) : undefined);
</script>

<!-- Tag buttons -->
{#if !completed && current}
  <div class="mt-2 flex gap-2">
    <button
      onclick={() => toggleTag('learned')}
      class={currentTag === 'learned' ? 'bg-green-500 text-white ...' : 'bg-gray-200 ...'}
      >✓ Learned</button
    >
    <button
      onclick={() => toggleTag('difficult')}
      class={currentTag === 'difficult' ? 'bg-red-400 text-white ...' : 'bg-gray-200 ...'}
      >★ Difficult</button
    >
  </div>
{/if}
```

### Deck filtering

Add a filter toggle to `VocabFlashcardPage.svelte`:

```ts
type DeckFilter = 'all' | 'learned' | 'difficult' | 'untagged';
let deckFilter = $state<DeckFilter>('all');

async function buildFilteredDeck(es: VocabEntry[], m: Mode, ct: CardType) {
  if (deckFilter === 'all') {
    buildDeck(es, m, ct);
    return;
  }
  const tags = await getTagsForList(listId);
  const filtered = es.filter((e) => {
    const t = tags.get(makeWordId(e));
    if (deckFilter === 'untagged') return !t;
    return t === deckFilter;
  });
  buildDeck(filtered, m, ct);
}
```

---

## Phase 4 — Downloadable Word Lists

### Format — hosted JSON

Each downloadable list is a JSON file you publish (GitHub, CDN, etc.):

```json
{
  "id": "oslo-daily-pack",
  "title": "Oslo Daily Life",
  "language": "nb",
  "level": "A2",
  "entries": [
    {
      "norsk": "T-banen",
      "english": "the subway / metro",
      "example": "Jeg tar T-banen til jobb.",
      "example_english": "I take the subway to work.",
      "level": "A2",
      "category": "transport",
      "part": "noun"
    }
  ]
}
```

### Download & store

```ts
// src/lib/wordlists.ts
import { db } from './db';
import type { WordList } from './db';

export async function downloadAndStore(url: string): Promise<WordList> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const list: WordList = await res.json();
  list.downloadedAt = Date.now();
  await db.wordLists.put(list);
  return list;
}

export async function getStoredLists(): Promise<WordList[]> {
  return db.wordLists.toArray();
}

export async function deleteStoredList(id: string): Promise<void> {
  await db.wordLists.delete(id);
  // Also remove associated tags
  await db.tags.where('listId').equals(id).delete();
}
```

---

## Phase 5 — JSON Export / Import (Backup)

### `src/lib/backup.ts`

```ts
import { db } from './db';

export interface BackupData {
  version: 1;
  exportedAt: number;
  tags: typeof db.tags extends import('dexie').Table<infer T> ? T[] : never;
  wordLists: typeof db.wordLists extends import('dexie').Table<infer T> ? T[] : never;
  voiceSettings: typeof db.voiceSettings extends import('dexie').Table<infer T> ? T[] : never;
}

export async function exportBackup(): Promise<void> {
  const backup = {
    version: 1 as const,
    exportedAt: Date.now(),
    tags: await db.tags.toArray(),
    wordLists: await db.wordLists.toArray(),
    voiceSettings: await db.voiceSettings.toArray()
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `norskeord-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File): Promise<void> {
  const text = await file.text();
  const backup = JSON.parse(text) as BackupData;
  if (backup.version !== 1) throw new Error('Unsupported backup version');

  await db.transaction('rw', [db.tags, db.wordLists, db.voiceSettings], async () => {
    // Clear existing data and replace with backup
    await db.tags.clear();
    await db.wordLists.clear();
    await db.voiceSettings.clear();
    if (backup.tags?.length) await db.tags.bulkAdd(backup.tags);
    if (backup.wordLists?.length) await db.wordLists.bulkAdd(backup.wordLists);
    if (backup.voiceSettings?.length) await db.voiceSettings.bulkAdd(backup.voiceSettings);
  });
}
```

### UI — Settings / About page

Add export/import controls to the existing `/about` route or a new `/settings` route:

```svelte
<script lang="ts">
  import { exportBackup, importBackup } from '$lib/backup';

  let importError = $state('');

  async function handleImport(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      await importBackup(file);
      alert('Backup restored successfully.');
    } catch (err) {
      importError = String(err);
    }
  }
</script>

<section>
  <h2>Backup & Restore</h2>
  <p class="text-sm text-gray-500">
    Export your tags and settings to a JSON file. Import it to restore on any device or browser.
  </p>
  <button onclick={exportBackup}>Export backup</button>
  <label>
    Import backup
    <input type="file" accept=".json" onchange={handleImport} />
  </label>
  {#if importError}<p class="text-red-500">{importError}</p>{/if}
</section>
```

---

## Migration summary

| Data                        | Before                  | After                        |
| --------------------------- | ----------------------- | ---------------------------- |
| Voice speed / pitch / voice | `localStorage` (3 keys) | `db.voiceSettings` singleton |
| Word tags                   | —                       | `db.tags` table              |
| Downloaded lists            | —                       | `db.wordLists` table         |
| Backup                      | —                       | JSON export/import           |

---

## Implementation order

1. Install Dexie, create `src/lib/db.ts`
2. Migrate voice settings (`SpeakButton.svelte`) with one-time localStorage migration
3. Add tag UI and helpers (`tags.ts`)
4. Add deck filter toggle (`VocabFlashcardPage.svelte`)
5. Add downloadable list support (`wordlists.ts`)
6. Add export/import UI (`backup.ts` + settings page)
