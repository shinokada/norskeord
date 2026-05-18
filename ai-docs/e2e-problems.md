I have added the path, /Users/shinichiokada/Svelte/svelte-languages/norskeord to Filesystem so you should be able to access.

The failing tests all navigate to ssr:false practice routes and injectPlusPlan is not patching the plan before the $effect gate fires and redirects
What's been tried: moving gate from load() to $effect, onMount → $effect, !== 'plus' → === 'free', text-replace in \_\_data.json
The quiz route uses the exact same ssr:false
onMount gate pattern and passes — so the key question is what's structurally different between quiz and these routes

Also I tried the following:

What was actually wrong: Paraglide's locale strategy is ["cookie", "globalVariable", "baseLocale"] with baseLocale = "en". Playwright test browsers have no PARAGLIDE_LOCALE cookie, so every test rendered in English. The assertions used Norwegian strings (/tekst 1 av/i, /5 ord/i, /øv/i, etc.) which don't exist in the English UI.
The fix: injectPlusPlan now also calls setNorwegianLocale first, which adds the PARAGLIDE_LOCALE=nb cookie to the browser context before page.goto() fires. The server's paraglide middleware reads that cookie and serves Norwegian on every request.
