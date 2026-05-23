# Adding definition to flashcard

## Inspiration
```
**Graduate to Monolingual Clues:** As an A2 learner approaching B1, the goal is to stop using English prompts entirely. If you use custom flashcard apps (like Anki), try making cards where the front is a simple Norwegian explanation, and the back is the Norwegian word/phrase you want to use.
```

## Goals

1. Add definition field to src/lib/data/vocab-b1.json file.
2. Make definition as the default in the my-profile Preferences Card type. Add a note that this is for level B1/B2/C1/C2.
3. Change English/Norsk button in Flashcard to a button to cycle Definition/English/Norsk (or radio buttons) when Word/Phrase button is Word. And when you select Definition, Word/Phrase button should change to Word.

## What's done
1. types.ts — definition?: string added to VocabEntry (optional, so all existing cards without it still work).
2. vocab-b1.json — The full environment category (20 entries) now has definition. Each one is a simple Norwegian definition using A1/A2 vocabulary — no English, no loan words from English where avoidable. For example:

bærekraftig → "Noe som kan brukes lenge uten å skade naturen eller bruke opp ressurser for fremtidige generasjoner."
å resirkulere → "Å bruke gamle ting på nytt eller lage nye produkter av dem, for å ikke kaste dem."

3. VocabFlashcardPage.svelte — The toggle button now cycles through three states:

📖 Norwegian explanation (default if the card has one)
🇬🇧 English translation
Hidden

Cards without definition skip straight to english ↔ hidden. The keyboard shortcut E still works, cycling through the same states.
4. PreferencesSection.svelte (my-profile) — A new "Example helper (default)" radio group lets you set your preferred default: Norwegian explanation / English / Hidden. Saved to localStorage on form submit.


## Code
### /src/lib/VocabFlashcardPage.svelte
```
diff --git a/src/lib/VocabFlashcardPage.svelte b/src/lib/VocabFlashcardPage.svelte
index 7750ceb..b422a09 100644
--- a/src/lib/VocabFlashcardPage.svelte
+++ b/src/lib/VocabFlashcardPage.svelte
@@ -44,6 +44,10 @@
   const LS_CARD_TYPE = 'vocab-flashcard-card-type';
   const LS_SHOW_EXAMPLE = 'vocab-flashcard-show-example';
   const LS_DECK_MODE = 'vocab-flashcard-deck-mode';
+  // 3-way toggle: 'definition' | 'english' | 'hidden'
+  // Falls back to 'english' for cards without definition
+  type ExampleMode = 'definition' | 'english' | 'hidden';
+  const LS_EXAMPLE_MODE = 'vocab-flashcard-example-mode';
   const NEW_CARD_SESSION_LIMIT = 20;
 
   function getInitialMode(): Mode {
@@ -63,6 +67,14 @@
     return localStorage.getItem(LS_SHOW_EXAMPLE) === 'true';
   }
 
+  function getInitialExampleMode(): ExampleMode {
+    if (!browser) return 'definition';
+    const saved = localStorage.getItem(LS_EXAMPLE_MODE);
+    if (saved === 'definition' || saved === 'english' || saved === 'hidden') return saved;
+    // Legacy: if old show-example was true, treat as english; false as definition
+    return localStorage.getItem(LS_SHOW_EXAMPLE) === 'true' ? 'english' : 'definition';
+  }
+
   function getInitialDeckMode(): DeckMode {
     if (!browser) return 'all';
     const saved = localStorage.getItem(LS_DECK_MODE);
@@ -75,6 +87,7 @@
   let showExampleDefault = $state(getInitialShowExample());
   let showCardBack = $state(false);
   let showExampleEnglish = $state(getInitialShowExample());
+  let exampleMode = $state<ExampleMode>(getInitialExampleMode());
   let deck = $state<DeckItem[]>([]);
   let currentIndex = $state(0);
   let completed = $state(false);
@@ -220,6 +233,7 @@
     completed = false;
     showCardBack = false;
     showExampleEnglish = showExampleDefault;
+    exampleMode = getInitialExampleMode();
     sessionNewCardCount = 0;
     clearUndo();
   }
@@ -372,6 +386,23 @@
     });
   });
 
+  // ── Example mode cycle ────────────────────────────────────────────────────
+
+  /**
+   * Cycle the example helper text:
+   *   has explanation → explanation → english → hidden → explanation …
+   *   no explanation  → english → hidden → english …
+   */
+  function cycleExampleMode(entry: VocabEntry) {
+    const hasDefinition = !!entry.definition;
+    const order: ExampleMode[] = hasDefinition
+      ? ['definition', 'english', 'hidden']
+      : ['english', 'hidden'];
+    const idx = order.indexOf(exampleMode);
+    exampleMode = order[(idx + 1) % order.length];
+    localStorage.setItem(LS_EXAMPLE_MODE, exampleMode);
+  }
+
   // ── Input handlers ────────────────────────────────────────────────────────────
   function handleTouchStart(e: TouchEvent) {
@@ -409,9 +440,7 @@
       restart();
     } else if (!completed && current && (e.key === 'e' || e.key === 'E')) {
       e.preventDefault();
-      showExampleEnglish = !showExampleEnglish;
-      showExampleDefault = showExampleEnglish;
-      localStorage.setItem(LS_SHOW_EXAMPLE, String(showExampleEnglish));
+      cycleExampleMode(current.entry);
     } else if (!completed && current && e.key === '/') {
       e.preventDefault();
       speakButtonRef?.speak();
@@ -805,7 +834,11 @@
       </p>
       {#if currentExampleTranslation}
         <div class="mt-2">
-          {#if showExampleEnglish}
+          {#if exampleMode === 'definition' && current.entry.definition}
+            <p class="mb-1 text-sm text-emerald-700 dark:text-emerald-400">
+              📖 {current.entry.definition}
+            </p>
+          {:else if exampleMode === 'english'}
             <p class="mb-1 text-sm text-gray-500 dark:text-gray-400">
               {currentExampleTranslation}
             </p>
@@ -813,13 +846,15 @@
           <button
             type="button"
             class="text-sm text-blue-600 hover:underline dark:text-blue
-400"
-            onclick={() => {
-              showExampleEnglish = !showExampleEnglish;
-              showExampleDefault = showExampleEnglish;
-              localStorage.setItem(LS_SHOW_EXAMPLE, String(showExampleE
nglish));
-            }}
+            onclick={() => cycleExampleMode(current.entry)}
           >
-            {showExampleEnglish ? m.flashcard_hide_translation() : m.fl
ashcard_show_translation()}
+            {#if exampleMode === 'definition' && current.entry.definiti
on}
+              Show English
+            {:else if exampleMode === 'english'}
+              Hide
+            {:else}
+              {current.entry.definition ? 'Show definition' : m.flashca
rd_show_translation()}
+            {/if}
           </button>
         </div>
       {/if}
```


### /src/lib/types.ts
```
diff --git a/src/lib/types.ts b/src/lib/types.ts
index 4ab6624..06ba66a 100644
--- a/src/lib/types.ts
+++ b/src/lib/types.ts
@@ -281,6 +281,7 @@ export interface VocabEntry {
   english: string;
   example: string;
   example_english: string;
+  definition?: string; // monolingual Norwegian definition of the word (B1+)
   level: CEFRLevel;
   category: Category;
   part: PartOfSpeech;
```

### src/routes/my-profile/PreferencesSection.svelte
```
diff --git a/src/routes/my-profile/PreferencesSection.svelte b/src/routes/my-profile/PreferencesSection.svelte
index c916f5d..53afcc7 100644
--- a/src/routes/my-profile/PreferencesSection.svelte
+++ b/src/routes/my-profile/PreferencesSection.svelte
@@ -28,6 +28,16 @@
 
   const LS_SPEED = 'voice-settings-speed';
   const LS_PITCH = 'voice-settings-pitch';
+  const LS_EXAMPLE_MODE = 'vocab-flashcard-example-mode';
+
+  type ExampleModeOption = 'definition' | 'english' | 'hidden';
+
+  function getInitialExampleMode(): ExampleModeOption {
+    if (typeof localStorage === 'undefined') return 'definition';
+    const saved = localStorage.getItem(LS_EXAMPLE_MODE);
+    if (saved === 'definition' || saved === 'english' || saved === 'hidden') return saved;
+    return 'definition';
+  }
 
   // Derive defaults from the profile prop so they stay reactive if the prop changes.
   let targetLevel = $derived(profile?.target_level ?? 'B1');
@@ -44,6 +54,7 @@
   let sessionLimit = $derived(
          profile?.session_limit != null ? String(profile.session_limit) : '2
0'
   );
+  let exampleModeDefault = $state<ExampleModeOption>(getInitialExampleM
ode());
   // quiz_limit: null in DB → default to 'default' sentinel; number → i
ts string value
   let quizLimit = $derived(profile?.quiz_limit != null ? String(profile
.quiz_limit) : 'default');
 
@@ -69,6 +80,7 @@
     localStorage.setItem(LS_PITCH, voicePitch);
     localStorage.setItem('vocab-flashcard-session-limit', sessionLimit)
;
     localStorage.setItem('vocab-quiz-limit', quizLimit);
+    localStorage.setItem(LS_EXAMPLE_MODE, exampleModeDefault);
     // Write through the store so the nav button updates reactively.
     localeStore.set(uiLanguage);
   }
@@ -199,6 +211,37 @@
       </p>
     </div>
 
+    <!-- Example helper default (monolingual mode) -->
+    <div>
+      <p class="mb-2 block text-sm font-medium text-gray-700 dark:text-
gray-300">
+        Example helper (default)
+      </p>
+      <div class="flex flex-col gap-1.5">
+        {#each [
+          { value: 'definition', label: '📖 Norwegian definition', hint
: 'Show a simple Norwegian definition of the word (B1+ — monolingual mod
e)' },
+          { value: 'english', label: '🇬🇧 English translation', hint: 'S
how the English translation immediately' },
+          { value: 'hidden', label: '🙈 Hidden', hint: 'Hide until you 
tap the button — challenge yourself!' }
+        ] as opt (opt.value)}
+          <label class="flex cursor-pointer items-start gap-2">
+            <input
+              type="radio"
+              name="example_mode"
+              value={opt.value}
+              bind:group={exampleModeDefault}
+              class="accent-indigo-600 mt-0.5"
+            />
+            <span class="text-sm text-gray-700 dark:text-gray-300">
+              {opt.label}
+              <span class="block text-xs text-gray-400">{opt.hint}</spa
n>
+            </span>
+          </label>
+        {/each}
+      </div>
+      <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
+        Controls what appears below the example sentence on each flashc
ard. Norwegian explanations use simple vocabulary so you can stay in Nor
wegian.
+      </p>
+    </div>
+
     <!-- Pronunciation speed -->
     <div>
       <p class="mb-2 block text-sm font-medium text-gray-700 dark:text-
gray-300">
```

### src/lib/data/vocab-b1.json
Some are added `definition` field.

### add-example-explanations.mjs has been added.
