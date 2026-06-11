# A practical manual test plan covering everything changed

**1. Turnstile invisible mode**

Just visit `/auth/login`. The Cloudflare widget should be invisible — no dark badge or block rendered inside the form. Only a small Cloudflare branding badge may appear in the corner of the page. Dark mode too since you have `data-theme="auto"`. Click "Send sign-in link" and verify the button shows a spinner while verifying.

**2. Last-path redirect — unauthenticated**

```bash
# In DevTools console on /
localStorage.clear()
```

Refresh `/` — should stay on the homepage, no redirect.

**3. Last-path redirect — returning authenticated user**

```bash
# In DevTools console while logged in
localStorage.setItem('last-flashcard-path', '/learn/a1')
```

Navigate to `/` — should immediately redirect to `/learn/a1`.

**4. Invalid stored path is cleaned up**

```bash
localStorage.setItem('last-flashcard-path', '/auth/login')
```

Refresh `/` — should stay on `/`, and running `localStorage.getItem('last-flashcard-path')` afterwards should return `null`.

**5. First-time login → lands on `/learn/a1`**

- Open a private/incognito window (clean localStorage, no session)
- Sign up with a real email you can access
- Click the magic link
- Should land on `/learn/a1`, not `/`

**6. Returning user login → lands on last page**

- While logged in, navigate to e.g. `/grammar`
- Check `localStorage.getItem('last-flashcard-path')` returns `'/grammar'`
- Sign out
- Sign back in via magic link
- Should land on `/grammar`

**7. In-app browser banner**

The trickiest one to test since you need a real in-app browser. Two options:

- **Gmail on Android**: send yourself an email containing your `localhost` dev URL or the production URL, open it in Gmail, tap the link — the banner should appear at the bottom
- **Desktop simulation**: in DevTools console, temporarily override the user agent:

```bash
# In DevTools console
Object.defineProperty(navigator, 'userAgent', {
  get: () => 'Mozilla/5.0 (Linux; Android 12) wv FBAN/test'
})
location.reload()
```

The banner should appear. Tap ✕ to dismiss, it should disappear.

**8. Welcome sequence email (when you have real users in the 23–25hr window)**

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://norskeord.no/api/email/welcome-sequence
```

Returns `{"sent":0,"failed":0,"reason":"no candidates"}` if nobody is in the window right now — that's correct. To test a real send, you can temporarily widen the window in the SQL RPC to e.g. `interval '48 hours'` / `interval '1 hour'` and run it against a test email address.

**9. Supabase SQL (before deploying the email feature)**

Run `supabase/email-log-and-welcome-rpc.sql` in the SQL Editor, then verify:

```sql
-- Should return an empty table
select * from email_log;

-- Should return users in the 23–25hr window (empty if none right now)
select * from get_welcome_sequence_candidates();
```

---

**Order I'd run these before deploying:**

1–4 locally (quick, no email needed), then 5–6 in staging or production with your own email, then 9 in Supabase before merging, then 7 on your Android device, and leave 8 until after deploy.
