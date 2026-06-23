Q: Updating contact

Currently the Contact support is in my-profile page with "Priority support Get help directly from the developer". This is for plus and logged in users to prevent spams. But it is hard to find/discover it.

I'm thinking the following:

1. Add Contact to top menu and footer menu.
2. When you click them go to /auth/login page with `?page=contact` or something like that.
3. When the user input 6 digits number, it redirect to a dedicated contact page, /contact.
4. Remove the contact form from /my-profile
   What do you think about these changes?

ANS: Let me look at the current codebase to understand the structure before giving you my thoughts.Now let me look at the my-profile server action and the messages structure:Good, I have a thorough picture of the codebase. Let me share my thoughts:

---

Your instinct is right — the contact form is genuinely hard to find buried in `/my-profile`, especially for someone with a bug or a question who might not be logged in. That said, your proposed flow has one wrinkle worth discussing:

**The proposed flow (step 2 → 3):** redirecting to `/contact` after OTP verification is technically workable but it's a **lot of friction for a support request**. A user who hits a bug has to: find Contact in the nav → go to login → enter email → wait for OTP → enter 6 digits → _then_ fill out a form. That's 5 steps before they can type their message.

**A simpler alternative I'd suggest:**

1. **Add `/contact` as a real standalone page** (no auth wall). Use the existing honeypot + Turnstile (already present on login) for spam protection — same bot mitigation you have on the login form, no auth needed.
2. **Add "Contact" to the footer** under Resources. That's a natural home for it.
3. **Add it to the mobile sidebar and the "Help" dropdown** in `Nav.svelte` (currently Guide + Free Resources).
4. **For logged-in users**, pre-fill email and detect Plus status on the server so the form still works seamlessly from `/my-profile` (or you can remove it from there entirely as you planned).
5. **Keep the anti-spam simple**: Turnstile (already in the project) + honeypot + rate limit on the server action. Logged-out users just can't get their reply pre-filled (they type their email in the form).

This gives you discoverability without the OTP-gated contact wall. The main reason you had auth-gating originally was spam, and Turnstile handles that better than login friction does.

**If you really want auth-gating** (for priority routing or to reduce noise), the cleaner UX is:

- `/contact` is public and shows the form immediately
- After successful submit, if the user is _not_ logged in, you show a note: "Reply will be sent to the email you provided — [log in](/auth/login) to link this to your account."
- No OTP interruption mid-flow

---

**To summarise my recommendation:**

| Your proposal                           | My suggestion                             |
| --------------------------------------- | ----------------------------------------- |
| Auth wall before contact                | Public `/contact` with Turnstile          |
| Login redirects to `/contact` after OTP | Direct link to `/contact` everywhere      |
| Remove from `/my-profile`               | Remove from `/my-profile` ✓               |
| Footer + top nav links                  | Footer + Help dropdown + mobile sidebar ✓ |

Want me to go ahead and implement this? Or if you prefer to keep the auth wall, I can implement that flow instead — just let me know which direction you want to go.

Q: I created an empty ai-docs/implementation/contact.md. Can you write your implementation plan in this doc first with step by step approach?

ANS: Now I have everything I need. Let me write the implementation plan:Now I have a complete picture of the codebase. Let me write the implementation plan:The plan is written. Here's a summary of the key decisions captured in it:

**Architecture highlights:**

- `/contact` is public — Turnstile + honeypot handles spam, no auth wall needed
- A new shared helper `src/lib/server/contact.ts` extracts the send logic (DB insert + Resend email) so it's reusable and testable, and the `my-profile` action just goes away
- For logged-in users, the email field is `readonly` in the UI but the server ignores the submitted value and uses `locals.user.email` directly — so it can't be spoofed
- No new env vars, no DB migration, no new Turnstile keys needed — everything reuses what's already there

**Implementation order:** i18n keys → new route (server + page) → nav/footer links → remove from my-profile → guide FAQ update. Each step is independently testable.

**Notable detail on the test file:** `contact-honeypot.test.ts` currently lives in `my-profile/` but it should move to test the new shared `src/lib/server/contact.ts` helper instead, so coverage isn't lost.

Ready to start implementing when you are — Step 1 (i18n keys) is the natural first move since everything else depends on them.
