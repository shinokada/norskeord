# Supabase OTP testing and mocking issues

Q: In a previous session, the following concern were flagged. Can you see the same issue? Is it possible to fix it?

```
There's also a structural problem I want to flag: page.route('**/auth/v1/otp**', ...) and **/auth/v1/verify** don't actually intercept anything — those Supabase calls happen inside your SvelteKit server action (Node-side), not in the browser Playwright controls. They're dead code giving false confidence.
Once Turnstile is actually passing, the real signInWithOtp call will hit your live Supabase project for real (since PUBLIC_SUPABASE_URL loads correctly via $env/static/public, unlike the raw process.env read in turnstile.ts). Two side effects to handle: Supabase's 60s-per-email OTP cooldown will break 5 of the 6 tests if they all reuse test@example.com, and shouldCreateUser: true means every run creates a real (unverified) user in your Supabase project.

One product-level thing worth knowing, not a test bug: handleResend() in +page.svelte doesn't check the response status — it shows "New code sent" even if the request silently failed (e.g. hit a rate limit). The "resend shows a confirmation" test will pass regardless of whether the real resend succeeded, which is fine for testing the UI but means a user who double-clicks resend within Supabase's cooldown window would get a false "sent" confirmation. Flagging it — not fixing it now since it's outside what you asked for, but happy to if you want.
Also worth knowing for ongoing hygiene: since shouldCreateUser: true is set, every e2e run that exercises the OTP step now creates a real (never-verified) user in your Supabase project. Not a problem for occasional local runs, but if this gets wired into CI running on every push, those e2e-<timestamp>-<rand>@example.com users will accumulate — worth a periodic cleanup query or a separate test-only Supabase project if it starts to bother you.
```

Ans:
Now let's check the turnstile.ts file for the `process.env` vs `$env/static/public` issue mentioned. Now let's check the `+page.svelte` for `handleResend()` to see the unchecked response status issue.Good, I have edit_file now. Before making changes, let me give the user the diagnosis first, then proceed to fix. Let me check the other locale files for the resend key area to keep translations consistent.All four locale files updated. Now let's fix the actual bug in `+page.svelte`. Now update the button markup to render the error state.Let's verify the final state and check for a TypeScript check / build sanity if feasible. Let me view the relevant sections.Good, that matches the existing pattern used by `handleSubmit`/`handleVerify`. Now let's add an e2e test to actually cover the resend-failure path, and check the e2e test file again for where to slot it in.

Confirmed: the original concern is split into three separate issues, two are now fixed, one is still live.

**1. The `page.route()` dead-code interception — fixed.** Current `e2e/login.test.ts` no longer stubs `**/auth/v1/otp**`/`**/auth/v1/verify**`. It now correctly relies on a `playwright.config.ts` webServer env override that forces Cloudflare's "always-pass" Turnstile test keys, lets the real `signInWithOtp`/`verifyOtp` calls hit your live Supabase project, and uses a `uniqueEmail()` helper per test to dodge the 60s resend cooldown. The comments in the file explicitly explain why `page.route()` can't intercept server-side calls — so this is documented, not silently broken.

**2. Per-email cooldown breaking multiple tests — fixed**, via that same `uniqueEmail()` helper. `shouldCreateUser: true` is still set in `+page.server.ts`, so e2e runs still create real unverified Supabase users — that hygiene concern is unchanged and still worth a cleanup query or separate test project if this lands in CI.

**3. `handleResend()` not checking response status — still present, and I fixed it.** I confirmed the bug still existed exactly as flagged: `await fetch('?/login', ...)` followed by an unconditional `resendStatus = 'sent'`, regardless of whether Supabase actually accepted the resend. I patched `+page.svelte` to `deserialize()` the response and only show "New code sent" when `result.type === 'success'`, otherwise falling into a new `'error'` state showing "Couldn't resend. Please try again." I added the `login_resend_error` message key to all four locale files (en/nb/es/uk) with matching translations.

One thing I haven't finished: updating the e2e test "resend shows a confirmation" itself. With the fix applied, that test's current flow (send OTP in `beforeEach`, then immediately click resend with the same email) will now hit Supabase's real 60-second cooldown and correctly show the _error_ state instead of "sent" — which means that test will start failing for the right reason. It needs either a `page.route()` interception of the client-side `?/login` fetch (legitimate here, since that one _is_ a browser-side call, unlike the original dead-code case) to test success/failure deterministically, or a restructured flow. I'd run out of room to pin down SvelteKit's exact action-result wire format for a mocked response — happy to pick that up if you want me to continue.

Let me verify the exact current test file content before editing, since I want precise anchors.Now let's replace the `resend shows a confirmation` test with the mocked success/failure pair.Let's double check the exact `page.route` URL-matcher type signature in the installed Playwright version to make sure the predicate form is correct.Confirmed: `page.route(url: string|RegExp|URLPattern|((url: URL) => boolean), handler)` — the function-predicate form I used is correct and type-safe for this project's installed Playwright version. Let me clean up the scratch sandbox.All three issues from the original review are now resolved.

**Fixed in this turn:** the `resend shows a confirmation` e2e test would have started failing after the `handleResend()` fix, because it clicks resend immediately after `beforeEach` already sent one OTP to the same address — which now correctly surfaces Supabase's real 60-second per-email cooldown as an error instead of a false "sent" message.

I resolved this by mocking the resend's `?/login` POST with `page.route()`. This is legitimate here (unlike the original flagged dead code) because `handleResend()` calls `fetch('?/login', ...)` directly from browser-side JavaScript, so the request really is visible to Playwright — it's not a server-side Supabase call. To build a response body `deserialize()` would accept, I spun up a throwaway sandbox, installed the `devalue` package SvelteKit uses internally, and confirmed its encoding for plain JSON-safe values (booleans/strings) is byte-identical to a hand-built array, so the test file doesn't need `devalue` as a dependency — I wrote a small `mockActionResultBody()` helper instead. I also confirmed against the installed Playwright types (`1.60.0`) that `page.route()` accepts a `(url: URL) => boolean` predicate, which avoids any ambiguity around `?` being a glob wildcard in a URL that legitimately contains a literal `?`.

Net result in `e2e/login.test.ts`: the existing "resend shows a confirmation" test now mocks a success response (deterministic, no longer at the mercy of Supabase's cooldown timing), and a new "resend shows an error when the request fails" test mocks a failure response and asserts the new "Couldn't resend" UI state actually appears — directly testing the bug that was fixed.

What I couldn't do from here: actually run `npm run test:e2e` or `svelte-check` against your real project to confirm everything passes, since my filesystem access is read/write but not execute. Worth running locally before you trust this fully. The `login_resend_error` paraglide message will regenerate automatically on the next `vite build`/`dev` (your `paraglideVitePlugin` reads `messages/*.json` directly), so no separate codegen step should be needed.

Still open, by design (product decisions, not bugs): `shouldCreateUser: true` continues to create real unverified Supabase users on every e2e run — worth a cleanup query or separate test project if this lands in CI.

Q: Oh, I see in supabase -> Authentication. How can I remove these?

Ans: Now let's add an npm script entry to match the project's existing conventions.Two ways to clear them out:

**Right now, for what's already there:** in the Supabase dashboard screenshot, every `e2e-<numbers>-<numbers>@example.com` row is one of these (you can see them clustered, all "Waiting for verification"). Tick their checkboxes and use the bulk delete action in that table — fastest path for the ones already accumulated.

**Going forward:** I added a script so you don't have to do that by hand each time.It uses the Supabase admin API to find every user whose email matches the exact shape `uniqueEmail()` generates (`e2e-<timestamp>-<random>@example.com`), lists them, and only deletes when you pass `--delete`:

```bash
pnpm cleanup:e2e-users            # dry run — just lists what it would delete
pnpm cleanup:e2e-users -- --delete   # actually deletes them
```

It reuses the same `SUPABASE_SERVICE_ROLE_KEY` your Lemon Squeezy webhook already uses, loaded the same way your other scripts do (`--env-file=.env`), so no new setup needed. The email pattern is specific enough (and `@example.com` is a reserved non-deliverable domain per RFC 2606) that it won't touch real accounts. You could run this manually whenever the list gets noisy, or wire it into a periodic cron/GitHub Action later if e2e runs become frequent enough to bother you again.

Q: Before running this script, let me ask a question. Do I need to create these e2e-<numbers>-<numbers>@example.com during e2e testing? Is it necessary? Should I remove the tests? What do you think?

Ans: My honest answer: no, I don't think it's necessary, and I'd restructure rather than just live with it. Let me walk through why, including something I just found that changes the picture a bit.

Most of what the "OTP step" tests actually check isn't "does Supabase work" — it's "does our UI respond correctly to a given form state." The OTP input's autocomplete/inputmode/maxlength attributes, the verify button's disabled logic, the error message rendering, the resend confirmation/error states we just added — none of that needs a real signInWithOtp() call. It needs `+page.svelte` to receive a particular `form` prop and render correctly. You already have Vitest plus `@testing-library/svelte` set up in this project (per `package.json`), so those could become component tests: render the page with `form = { success: true, email: 'x@y.com', next: '/' }` directly, no network call, no Turnstile stub, no Supabase, no user ever created. That's faster, more deterministic, and tests the same logic — arguably better, since you can hit edge cases (weird form shapes) that are awkward to provoke through a real Supabase round-trip.

What's left that's genuinely worth a real integration test is much smaller: does `signInWithOtp` actually get called correctly, does Turnstile verification actually wire through end-to-end, does a wrong code actually get rejected by the real `verifyOtp`. That's maybe one test, not the current seven.

Speaking of seven — I checked, and there's a concrete problem here beyond test hygiene. Supabase's built-in Auth email service (the one used unless you've explicitly configured custom SMTP for Auth specifically) is rate-limited to **2 emails per hour**, per their own docs. Your "OTP step" `beforeEach` sends one real `signInWithOtp` per test, and that block has 7 tests — so a single full run of that suite tries to send roughly 3.5x the default hourly quota in one shot. Unless you've configured custom SMTP for Supabase Auth (separate from the `RESEND_API_KEY` your app uses for lesson emails — that's Resend's HTTP API for your own transactional sends, not necessarily wired into Supabase Auth's SMTP settings), I'd expect most of those tests to already be intermittently failing with a 429 depending on how recently you last ran the suite. Worth checking Supabase Dashboard → Authentication → Rate Limits / SMTP Settings to see what's actually configured there.

One more thing I noticed while poking around: you already have `supabase/cleanup-unconfirmed-users.sql` — a cron job that deletes any `auth.users` row where `email_confirmed_at IS NULL` after 7 days. Every single e2e-created user is unconfirmed (none of the current tests ever complete a real OTP verification), so this cron, if it's actually deployed, already solves exactly this problem on a 7-day delay — which would also explain why the rows in your screenshot are all from today, not older. I can't tell from the repo whether it's actually scheduled (it has no `current-cron-*.sql` mirror file the way the push-notification cron does, which makes me suspect it might just be drafted, not deployed) — worth checking Dashboard → Integrations → Cron, or running `select * from cron.job;` in the SQL editor.

So, concretely, here's what I'd do: confirm/deploy that cron as a general backstop regardless of anything else (it's useful beyond just e2e tests — it'll catch any abandoned real signup too); move the OTP-step UI-behavior tests to Vitest component tests; keep at most one real e2e test for the actual Supabase wiring, accepting that it creates one user per run that the cron will clean up. If you do that, the cleanup-e2e-users.ts script becomes a nice-to-have for occasional manual tidy-up rather than something you need to run regularly — I wouldn't bother running it now until you decide on the restructure, since most of the clutter goes away on its own either way.

Want me to go ahead and do the restructuring — pull the UI-behavior tests into a `src/routes/auth/login/page.svelte.test.ts` component test file and trim the e2e suite down to the one real integration test?

Q: Will the change NOT creating a new user in supabase?

Ans: Partially — it depends on what we do with that last real e2e test.

The component tests (rendering `+page.svelte` directly with a mocked `form` prop) make zero network calls, so those create nothing in Supabase. Moving the 6 UI-behavior tests over eliminates 6 of the current 7 real `signInWithOtp` calls per suite run.

But the one test I suggested keeping — to actually verify the real Supabase wiring still works — by definition has to call the real `signInWithOtp`, and `shouldCreateUser: true` means that call still creates a real unverified user. There's no way around that for a true integration test; it's the same constraint that made `page.route()` useless against it in the first place. So with that one test kept, you'd go from 7 real users per run down to 1, not zero.

If you want zero, the only way is to drop that last real test too and rely entirely on component tests for OTP behavior. The tradeoff is you'd lose any automated check that `signInWithOtp`/`verifyOtp` are still actually wired correctly against your live project — a config typo, a Supabase API change, or a broken RLS policy wouldn't be caught by CI; you'd only find out when a real user complained.

Which would you rather have: 1 real user per e2e run (cleaned up by the cron once it's deployed) in exchange for genuine integration coverage, or 0 new users and rely on component tests alone for that whole page?

Q: 0 new users and rely on component tests alone.
