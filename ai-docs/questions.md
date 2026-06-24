# Questions

I have added the path, /Users/shinichiokada/Svelte to Filesystem so you should be able to access /Users/shinichiokada/Svelte/svelte-languages/norskeord.

You can find db schema in supabase/current-schema.sql, current-functions.sql and current-cron-push-notification.sql. You can find all the db migration files in supabase/migrations directory.

No long paragraphs, academic-style explanations, and walls of text. Users on a learning app want quick, scannable answers, not essays.

You should be able to use Edit_File. Use Edit_File when you are modifying a large file.
Please do not use Write_file, it takes time. Instead can you write a script to update file(s) rather than rewrite whole file(s)? I can run the script locally and in that way, the session limit won't be over-used.

The Filesystem tool can read it but str_replace can't find it. You need to read it fully and rewrite it. In this case, if the file is big and the rewrite is just adding lines or simple replacement, please output it with instruction or create a downloadable file or write Python or mjs script so that I can do it. Because your Write File operation has to rewrite whole file and it takes time to complete.

---

- decide vocab format for substantiv, verb, adjektiv
  One way which is the simplest is to ignore any bøying and particles since this is not a dictionary. You can see them in examples.
  Another way is show only for substantiv en/et
  substantiv
  a) et hus
  b) hus(et)
  c) hus(-et)
  d) hus (dictionary form)
  verb
  a) få/fikk/fått
  b) få (dictionary form)
  c) å få
  adjektiv
  a) dictionary form

- I have a bunch of blog posts in src/lib/posts directory. My project UI uses i18n with four languages at the moment and it will increase more in future. Many of posts are written Norwegian and English. I think there are two options for me. 1. make all the blog posts i18n, but files in messages directory will become larger. 2. Write it purely in Norwegian, as simple Norwegian as possible. 3. Only TL;DR has i18n, otherwise only Norwegian. So remove whole hard-coded English.
  What do you think?

- Mobile check
- How about Start free button rather than login?
- Grammtikk section for B2/C1
  This is different from Quiz.
  Quiz has one question by one question. For grammer questions, I'd like to show all the questions at once and user type or select answers.

- I also want to order src/lib/vocab-b2.json according to category field and merge vocab-b2-new.json to vocab-b2.json file according to category field.
