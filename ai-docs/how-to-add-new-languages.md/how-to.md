# How to add new languages

## Create messages/xx.json file

## Update Supabase OTP Email Templete

### Implementation approach — Go template conditionals in the Supabase OTP email template

Supabase email templates support Go templating. The `options.data` payload passed to
`signInWithOtp` is available inside the template as `{{ .UserMetaData }}`. We pass
`locale` there and use `{{ if eq }}` blocks to render the correct language inline —
no Edge Function, no external email provider required.

**Code change in `+page.server.ts`:**

```ts
const locale = (cookies.get('PARAGLIDE_LOCALE') ?? 'en') as 'en' | 'nb' | 'es' | 'uk';

const { error: authError } = await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: true,
    data: { locale } // available in the template as {{ .UserMetaData.locale }}
  }
});
```

**Supabase dashboard → Authentication → Email Templates → OTP template** (manual step):

```
Subject:
{{ if eq .UserMetaData.locale "nb" }}Din engangskode for Norskeord
{{ else if eq .UserMetaData.locale "es" }}Tu código de acceso para Norskeord
{{ else if eq .UserMetaData.locale "uk" }}Ваш код входу для Norskeord
{{ else }}Your sign-in code for Norskeord{{ end }}

Body:
{{ if eq .UserMetaData.locale "nb" }}
  <p>Din engangskode er:</p>
  <h2>{{ .Token }}</h2>
  <p>Koden er gyldig i 10 minutter. Ikke del den med noen.</p>
{{ else if eq .UserMetaData.locale "es" }}
  <p>Tu código de un solo uso es:</p>
  <h2>{{ .Token }}</h2>
  <p>El código es válido durante 10 minutos. No lo compartas con nadie.</p>
{{ else if eq .UserMetaData.locale "uk" }}
  <p>Ваш одноразовий код:</p>
  <h2>{{ .Token }}</h2>
  <p>Код дійсний 10 хвилин. Не передавайте його нікому.</p>
{{ else }}
  <p>Your one-time sign-in code is:</p>
  <h2>{{ .Token }}</h2>
  <p>Valid for 10 minutes. Do not share it with anyone.</p>
{{ end }}
```

This is a one-time manual update in the Supabase dashboard. The template covers all 4
locales with a safe English fallback.
