In the last session, I asked the following:
```
I have added the path, /Users/shinichiokada/Svelte to Filesystem so you should be able to access /Users/shinichiokada/Svelte/svelte-languages/norskeord.

For not-plus and not-logged in users, http://localhost:5173/c/archaic shows `Proverbs ->` but when I click it, `No vocabulary available yet. Check back soon!` is shown since it is only for Plus users. so the `Proverbs ->` should be linked to /plus page with `+{n} with Plus ->` . 
For not-plus and not-logged in users, B1 and B2 pages, http://localhost:5173/b1/uttrykk-preview, http://localhost:5173/b2/uttrykk-preview page has no right arrow. Shouldn't it be the same as above link to the plus page with  `+{n} with Plus ->`. 

What do you think?
```

You have update files. 
http://localhost:5173/learn/c has "+17 with Plus", but http://localhost:5173/c/highly-formal has "+15 with Plus". Since there are 26 categories, "+17 with Plus" is correct. 
If I add more categories in future, it should automatically reflect the number as well. And it should be i18n.
