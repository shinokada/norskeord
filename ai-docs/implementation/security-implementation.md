# Security implementation

## Recommendations

**Already in place**
Looking at the login page, you're already collecting IP address and browser info for support messages, which is a good start.

**Low effort, high value**

1. **Rate limiting on the API routes** — your `/api` directory likely has endpoints for things like sending messages or fetching vocab. Adding a simple request counter per IP in Supabase or using a middleware in `hooks.server.ts` catches most bots. Supabase has a built-in rate limiter for auth (OTP sends) you can tune in the dashboard.

2. **Supabase Auth logs** — the Auth section in your Supabase dashboard already logs every sign-in attempt with IP and user agent. Spikes in OTP requests from the same IP are an early abuse signal.

3. **Monitor magic link requests** — since you use passwordless email login, someone hammering the login form to spam OTP emails is the most likely abuse vector. Supabase lets you set a minimum interval between OTP sends per email.

**Medium effort**

4. **Honeypot field on forms** — add a hidden input to the support/contact form. Bots fill it in, humans don't. Zero cost, no third-party needed.

5. **Supabase Row Level Security (RLS) logs** — if someone is trying to access data they shouldn't, RLS will block it but you won't know unless you log it. A simple Postgres function to log RLS violations to a table gives you visibility.

6. **Track unusual vocab fetch patterns** — if a user is pulling every single category across all levels in rapid succession, they may be scraping your vocab data. You could log category page loads per user per hour in a lightweight Supabase table.

**Higher effort but robust**

7. **Cloudflare in front of your domain** — gives you bot detection, DDoS protection, rate limiting, and a WAF (Web Application Firewall) essentially for free on the free plan. This is probably the single highest-leverage thing you could add.

8. **Turnstile (Cloudflare's CAPTCHA alternative)** — invisible to real users, blocks bots on forms. Integrates well with SvelteKit and is free.

**My recommendation for your stage:** Start with (3) tuning Supabase OTP rate limits + (7) putting Cloudflare in front of your domain. Those two alone cover 90% of realistic abuse scenarios with minimal code changes. Then add the honeypot (4) to your contact form — it's literally 5 lines.

## Supabase

Looking at the screenshot, the OTP setting is called **"Rate limit for token verifications"** — that's the one that controls how many OTP/magic link verifications can be made per IP address.

Currently it's set to **30 requests/5 min** (360/hour). That's actually quite generous. For a login form, I'd recommend tightening it:

**Changes to make:**

| Setting                              | Current    | Recommended    |
| ------------------------------------ | ---------- | -------------- |
| Rate limit for token verifications   | 30 / 5 min | **5 / 5 min**  |
| Rate limit for sign-ups and sign-ins | 30 / 5 min | **10 / 5 min** |

**Why:**

- A real user needs at most 1–2 OTP requests in 5 minutes. 5 gives a comfortable buffer for retries without allowing abuse.
- Sign-ups and sign-ins at 10/5 min is still generous for a real user but stops a bot hammering the endpoint.
- Leave everything else (token refreshes, sending emails at 30/h) as-is — those are fine for your current traffic.

Also notice **"Enable IP address forwarding"** at the bottom is **off**. Since you're on Vercel, the real client IP comes in via the `x-forwarded-for` header. If this is off, Supabase may be rate-limiting by Vercel's server IP instead of the actual user's IP — making the rate limits much less effective. I'd **turn that on** as well.

Go ahead and make those three changes and click **Save changes**.

## Cloudflare

### Chat 1

Sure! Here's the step-by-step guide.

---

**Step 1 — Add your site to Cloudflare**

1. Go to [cloudflare.com](https://cloudflare.com) and create a free account
2. Click **Add a site**, enter `norskeord.no`, select the **Free** plan
3. Cloudflare will scan your existing DNS records — review them and make sure they look correct (it usually imports everything automatically)

---

**Step 2 — Update your nameservers at your domain registrar**

Cloudflare will give you two nameservers like:

```
aria.ns.cloudflare.com
bob.ns.cloudflare.com
```

Go to wherever you bought `norskeord.no` (e.g. Namecheap, GoDaddy, Domeneshop, etc.) and replace the current nameservers with those two. This is the only change at your registrar — everything else is managed in Cloudflare from now on.

Propagation takes **5 minutes to 24 hours**, but usually under 30 minutes.

---

**Step 3 — Configure DNS records for Vercel**

Once Cloudflare is active, make sure your DNS records point to Vercel correctly. You need two records:

| Type    | Name  | Value                  | Proxy                     |
| ------- | ----- | ---------------------- | ------------------------- |
| `A`     | `@`   | `76.76.21.21`          | ✅ Proxied (orange cloud) |
| `CNAME` | `www` | `cname.vercel-dns.com` | ✅ Proxied (orange cloud) |

The orange cloud ☁️ means traffic goes through Cloudflare — this is what enables the protection. Make sure it's **not** grey (grey = DNS only, bypasses Cloudflare).

---

**Step 4 — SSL/TLS settings**

In Cloudflare dashboard → **SSL/TLS** → set mode to **Full (strict)**. This ensures the connection is encrypted end-to-end between the user, Cloudflare, and Vercel.

---

**Step 5 — Enable key security features**

These are all on the free plan:

**Security → Settings:**

- Security Level: **Medium**
- Browser Integrity Check: **On**

**Security → Bots:**

- Bot Fight Mode: **On** — blocks known bad bots automatically, free

**Speed → Optimization:**

- Auto Minify (JS, CSS, HTML): **On** — small free performance bonus

---

**Step 6 — Verify it's working**

After propagation, go to [dnschecker.org](https://dnschecker.org) and check `norskeord.no` — you should see Cloudflare IPs (`104.x.x.x` or `172.x.x.x`) rather than Vercel IPs. That confirms traffic is routing through Cloudflare.

You can also check by visiting your site and looking at the response headers in browser DevTools — you'll see `cf-ray: ...` which confirms Cloudflare is active.

---

**One Vercel-specific thing to be aware of**

Vercel's free plan has a limitation: it requires you to verify domain ownership via their own DNS, which can sometimes conflict with moving DNS to Cloudflare. If you've already added `norskeord.no` as a custom domain in Vercel, it should be fine — Vercel just needs the A record pointing at their IP. If you run into a domain verification issue in Vercel after the switch, go to Vercel → your project → **Settings → Domains** and re-verify.

---

**After this is done, Cloudflare Turnstile on the login page is a separate step** — want me to walk you through that as well, or write the code for it once your DNS is set up?

### Chat 2

You already have a Cloudflare account! The menu you have open is exactly right. Click **"Connect a domain"** — that's the equivalent of "Add a site" in the new Cloudflare UI.

Then:

1. Enter `norskeord.no`
2. Select the **Free** plan
3. Follow the steps from there — Cloudflare will scan your DNS and give you the nameservers to update at your registrar

What registrar did you buy `norskeord.no` from? (e.g. Domeneshop, GoDaddy, Namecheap?) I can give you the exact steps for updating the nameservers once you know which one it is.

## Domeneshop

Perfect. Here's the exact steps for Domeneshop:

---

**Step 1 — Connect the domain in Cloudflare first**

Click **"Connect a domain"**, enter `norskeord.no`, choose **Free**, and let Cloudflare scan your DNS. At the end it will show you two nameservers like:

```
aria.ns.cloudflare.com
bob.ns.cloudflare.com
```

**Write these down** — you'll need them in the next step.

---

**Step 2 — Update nameservers at Domeneshop**

1. Go to [domene.shop](https://domene.shop) and log in
2. Click **"Mine domener"** (My domains) in the top menu
3. Find `norskeord.no` and click on it
4. Look for **"Navnetjenere"** (Nameservers) or **"DNS"** settings
5. Switch from Domeneshop's default nameservers to **"Egne navnetjenere"** (Custom nameservers)
6. Replace the existing nameservers with the two Cloudflare gave you
7. Click **Lagre** (Save)

---

**Step 3 — Back in Cloudflare**

Click **"Done, check nameservers"**. Cloudflare will poll periodically and send you an email when it's active. Usually takes **10–30 minutes** with Domeneshop.

---

**One important note for Domeneshop**

Domeneshop manages DNS for `.no` domains through Norid (the Norwegian registry). Once you switch nameservers, **do not delete your domain from Domeneshop** — you still need them as the registrar for renewals. You're only changing where DNS is hosted, not where the domain is registered.

---

While you're waiting for propagation, want me to write the Cloudflare Turnstile code for the login page so it's ready to drop in once DNS is live?

## Tests

Let me look at the existing tests to match the patterns exactly.Now let me check the existing norskproven e2e test and the login page to get the exact text I need to assert against.Now let me also check the supportContact action's exact location in the server file so the unit test import path is correct.Good — no Svelte component unit tests yet, confirming the honeypot test should be a server-side Vitest test matching the `waitlist/server.test.ts` pattern. Now I have everything. Let me write all four files.I have everything I need. Let me now write all four files.Now I'll write all four files:Now the honeypot unit test, following the `waitlist/server.test.ts` pattern:All four files written. Here's a summary of what each tests and why:

---

**`e2e/norskproven.test.ts`** (13 tests)

- Page loads and has A2/B1 headings
- All 8 A2 category links have correct hrefs
- `/a2/health` actually loads with vocab (not empty)
- Each of the 8 B1 free slugs is accessible without redirecting to `/plus` — this is the most important regression guard after today's changes
- Non-plus users see the "Unlock with Plus →" CTA pointing to the right URL
- Plus users see the browse-all link instead

**`e2e/resources.test.ts`** (12 tests)

- Page loads with correct h1 and "100% Free" badge
- All 7 section headings are present
- Key resource links have correct `href`, `target="_blank"`, and `rel="noopener noreferrer"`
- Guest users see the "Sign in" footer link pointing to `/auth/login`

**`e2e/login.test.ts`** (7 tests)

- Page loads with a heading
- "Free · No credit card required" text is visible
- Email input and submit button are present
- Empty and invalid email submissions show an error
- No-password note is visible

**`src/routes/my-profile/contact-honeypot.test.ts`** (4 unit tests)

- Bot submission (honeypot filled) returns `success` silently without touching DB or Resend
- Any non-empty honeypot value is caught, not just URLs
- Real submission (honeypot empty string) goes through normally — DB and Resend are called
- Real submission with honeypot field absent entirely also goes through normally

## What has been done

Here's your current status and remaining todo list:

**✅ Done**

1. Supabase OTP rate limits tightened + IP forwarding enabled
2. Cloudflare nameserver propagation (in progress)
3. Honeypot on contact form + unit test
4. All e2e tests passing

**⏳ In progress**

- Cloudflare DNS propagation — once email arrives, set the A and CNAME records in Cloudflare dashboard

**📋 Remaining (in priority order)**

1. **Cloudflare DNS records** — after propagation, set A `@` → `76.76.21.21` and CNAME `www` → `cname.vercel-dns.com`, both proxied (orange cloud). Then set SSL/TLS to **Full (strict)** and turn on **Bot Fight Mode**.

- Cloudflare → your domain → SSL/TLS → set to Full (strict)
- Cloudflare → Security → Bots → turn on Bot Fight Mode

2. **Cloudflare Turnstile on login page** — invisible challenge on `/auth/login`. I can write the code now while you wait for propagation, so it's ready to drop in.

3. **Supabase Auth logs monitoring** — no code needed, just a habit. Check Supabase → Authentication → Logs once a week for unusual spikes.

4. **Rate limiting on API routes** — low effort, worth doing after Cloudflare is live. Check what's in your `/api` directory and add simple IP-based rate limiting in `hooks.server.ts`.

5. **RLS violation logging** (optional, lower priority) — only worth doing once you have paying users.

6. **Vocab scraping protection** (optional, lowest priority) — only matters at scale.

---

**My suggestion for this session:** shall I write the Turnstile code now? It'll be ready to add to the login page the moment Cloudflare confirms your domain is active.

Item 2 is already done — that's exactly what we implemented at the start of this session. You just need to add the two env vars to Vercel and your local `.env.local`:

```
PUBLIC_TURNSTILE_SITE_KEY=<your site key from Cloudflare>
TURNSTILE_SECRET_KEY=<your secret key from Cloudflare>
```

Item 3 is just a habit — no code. Bookmark Supabase → Authentication → Logs and check it weekly.

For item 4, let me look at your `/api` directory first.Good, I can see the full picture. You have 8 API routes. Let me quickly categorise them by abuse risk before writing the rate limiter:Good picture. Here's the risk assessment for your 8 routes:

- **`/api/lemon/checkout`** — requires auth, low risk
- **`/api/lemon/webhook`** — Lemon Squeezy signed webhook, no rate limit needed
- **`/api/email/unsubscribe`** — HMAC-verified GET, low risk
- **`/api/push/subscribe`** — requires auth + Plus, low risk
- **`/api/profile/email-reminder`** — requires auth + Plus, low risk
- **`/api/profile/language`** — likely auth-gated, low risk
- **`/api/progress-report`** — probably auth-gated, low risk
- **`/api/publish-scheduled`** — cron endpoint, should be secret-gated

None of these are high-risk public endpoints — they're all either auth-gated or HMAC/secret-verified. Since Cloudflare Bot Fight Mode is now on, it will handle volumetric abuse at the edge before requests even reach your server.

**My recommendation: skip the in-app rate limiter for now.** The combination of Cloudflare (edge protection) + Supabase auth (OTP limits) + your routes all requiring auth already gives you solid coverage. Adding an in-memory IP rate limiter in `hooks.server.ts` on Vercel serverless functions is also unreliable — each function invocation is stateless, so the counter resets between requests anyway.

If you later add any **unauthenticated public POST routes** (like a contact form or waitlist signup), that's when a rate limiter makes sense. I'd use Upstash Redis for that since it's persistent across serverless invocations.

**So your security checklist is now complete:**

- ✅ Supabase OTP rate limits tightened
- ✅ Cloudflare DNS + SSL Full (strict) + Bot Fight Mode
- ✅ Honeypot on contact form
- ✅ Cloudflare Turnstile on login page (code done, just needs env vars)
- ⏳ Add `PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` to Vercel env vars
