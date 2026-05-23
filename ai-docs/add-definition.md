# Adding definition to flashcard

## Inspiration
```
**Graduate to Monolingual Clues:** As an A2 learner approaching B1, the goal is to stop using English prompts entirely. If you use custom flashcard apps (like Anki), try making cards where the front is a simple Norwegian explanation, and the back is the Norwegian word/phrase you want to use.
```

## Goals

1. Add definition field to src/lib/data/vocab-b1.json file.
2. my-profile Preferences Card direction: 
When the Card type is Word, then
   - definition → norsk and english → norsk and norsk → english for B1/B2/C1/C2
   - Norwegian → English and English → Norwegian for A1/A2

Add a note that this is for level B1/B2/C1/C2.
When the Card type is Phrase, then keep the current.

1. Change English/Norsk button in Flashcard to a button to cycle Definition/English/Norsk when Word/Phrase button is Word. And when you select Definition, Word/Phrase button should change to Word.

