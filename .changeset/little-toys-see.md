---
'norske-flashcard': patch
---

fix: Remove the prompt entirely (silent auto-update)
- vite.config.ts — registerType changed from 'prompt' to 'autoUpdate'
- +layout.svelte — removed the PwaUpdatePrompt import
- +layout.svelte — removed the <PwaUpdatePrompt /> component tag
