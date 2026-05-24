# email service todos NOT DOING THIS ANY MORE

[Implementation guide](./implementation/email-service-implementation.md)

Except Step 7, completed all

## Step 7 — pg_cron Schedule

In the Supabase Dashboard → Database → Cron Jobs, add:

| Name                | Schedule    | Command                                                                                                                                               |
| ------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `send-lesson-email` | `0 8 * * 5` | `SELECT net.http_post(url := 'https://<ref>.supabase.co/functions/v1/send-lesson-email', headers := '{"Authorization": "Bearer <anon-key>"}'::jsonb)` |

This fires every Friday at 08:00 UTC. The function itself checks `isSendDay` per group, so A/B emails only go out on the 1st and 3rd Friday. No emails are wasted on off-weeks.

Consider the following options

## Automation Without Human Review

The design doc recommends human review (the `approved` flag) for the first few months.
Once you trust the generation quality, you can remove the manual gate entirely:

**Option A — Auto-approve on generation**

In `generate-lessons.ts`, change the insert to:

```ts
await supabase.from('daily_lessons').insert({
  // ...
  approved: true // ← was false
});
```

**Option B — Auto-approve via a Supabase Edge Function (recommended)**

Create `supabase/functions/auto-approve-lessons/index.ts` that runs weekly (every Monday at 06:00 UTC via pg_cron):

```ts
Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Auto-approve lessons generated more than 48 hours ago.
  // This gives you a window to spot-check /admin/lessons and reject anything bad.
  // Everything else is approved automatically before the Friday send.
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 48);

  const { data, error } = await supabase
    .from('daily_lessons')
    .update({ approved: true })
    .eq('approved', false)
    .lt('generated_at', cutoff.toISOString())
    .select('id, level_group, lesson_date');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  console.log(`[auto-approve] approved ${data?.length ?? 0} lessons`);
  return new Response(JSON.stringify({ ok: true, approved: data?.length ?? 0 }), { status: 200 });
});
```

pg_cron schedule: `0 6 * * 1` (every Monday at 06:00 UTC).

Normal operation with Option B: run `pnpm generate:lessons` on Monday → check `/admin/lessons` if you want → Wednesday the auto-approve function fires → Friday the send function finds approved lessons and sends. No required action from you in steady state.

---
