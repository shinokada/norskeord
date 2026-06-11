# How to check if auth is working on Supabase

There are several places in the Supabase dashboard to check this. Here's where to look:

**1. Authentication → Users**
The most direct place. Shows every registered user, their email, `last_sign_in_at`, provider (email/magic link), and whether they're confirmed. Good for verifying a specific user logged in successfully.

**2. Authentication → Logs** (if on Pro plan)
Real-time auth event logs — sign-ins, sign-ups, token refreshes, failures. Very useful for debugging slow or failed logins.

**3. Table Editor or SQL Editor → your data tables**
If you're storing user progress in a table (e.g. `user_progress`, `flashcard_progress`, or similar), you can query it directly:

```sql
select * from user_progress
where user_id = '<paste-user-id-from-auth-users>'
order by updated_at desc;
```

**4. SQL Editor → `auth.users`**
You can query the auth schema directly to see all users and metadata:

```sql
select id, email, last_sign_in_at, created_at, raw_user_meta_data
from auth.users
order by last_sign_in_at desc;
```

**5. Logs → API logs**
Under **Logs → API**, you can filter by path (e.g. `/auth/v1/token`) to see actual HTTP requests hitting the auth endpoints, with status codes and timing. Good for spotting slow responses on poor connections.

---

**Quick checklist for "is auth working?"**

- User appears in **Auth → Users** with a confirmed email ✓
- `last_sign_in_at` updates when they log in ✓
- Your RLS policies allow them to read/write their own rows ✓
- No 4xx errors in **Logs → API** for `/auth/v1` paths ✓

The SQL Editor approach against `auth.users` is the fastest way to cross-reference a specific user's login state with their progress data in one query.
