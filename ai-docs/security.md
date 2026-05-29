# Security

## Security items

Good question. Since this is a SvelteKit + Supabase app, here are practical approaches layered by effort:

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

Want me to implement any of these?

## Cost

Good news — all the recommendations I made can be done **completely free**:

**Costs nothing, do these now**

- **Supabase OTP rate limiting** — just a setting change in your Supabase dashboard. Auth → Rate Limits. No code, no cost.
- **Honeypot field on the contact form** — pure HTML, zero cost.

**Free tier covers it**

- **Cloudflare** — the free plan includes bot detection, DDoS protection, and WAF. You just point your DNS to Cloudflare instead of Vercel directly. Vercel free tier works fine behind Cloudflare.
- **Cloudflare Turnstile** — free with no usage limits, unlike reCAPTCHA which has quotas.

**Already free via Supabase**

- Auth logs, RLS, and Postgres functions are all included in Supabase's free tier.

**The only real constraint** is Supabase free tier has a limit of 500MB database and 2GB bandwidth per month. Logging every request could eat into that if traffic grows. So I'd keep any logging lightweight — just log suspicious events, not everything.

**My suggested order given your situation:**

1. Tune Supabase OTP rate limits now (5 min, no code)
2. Add honeypot to contact form (10 min, 5 lines)
3. Set up Cloudflare when you get your own domain (free, ~30 min DNS config)
4. Add Turnstile to login when you have paying users and more to protect

Want me to implement the honeypot on the contact form, or show you exactly which Supabase settings to change?
