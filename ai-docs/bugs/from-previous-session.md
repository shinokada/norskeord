Before removing duplicates, I had the following in src/lib/data/vocab-b2.json.

```
v-b2-politics-068
v-b2-economics-048
v-b2-social-issues-061
v-b2-arts-025
v-b2-science-027
v-b2-emotions-049
v-b2-history-031
v-b2-law-081
v-b2-literature-030
v-b2-advanced-adjectives-077
v-b2-philosophy-029
v-b2-medicine-026
v-b2-psychology-042
v-b2-business-027
v-b2-religion-024
v-b2-environment-052
v-b2-technology-045
v-b2-media-044
v-b2-education-047
v-b2-language-044
v-b2-argumentation-043
v-b2-abstract-nouns-068
v-b2-advanced-verbs-066
v-b2-geography-039
v-b2-culture-048
v-b2-global-issues-045
v-b2-academic-language-064
v-b2-discourse-markers-034
v-b2-work-career-046
v-b2-relationships-044
v-b2-communication-051
```

v-b2-politics-068 means there are 68 entries in politics.
Now I want to merge vocab-b2-new.json to vocab-b2.json.

I have a couple of questions.

1. Will it be too large as file size to use in my flashcard page?
2. Can you add `id` field after the above list. For example, the first entry in vocab-b2-new.json, "norsk": "opplæringsspråk" has category of education, so the id is v-b2-education-048, etc.
3. Is it possible to merge after the same category? For example, the first entry in vocab-b2-new.json has "category": "education" and I'd like to add this after the last "category": "education" entry in vocab-b2.json.
