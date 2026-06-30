When you want to test new login system, OTP, remove `.skip` from login.test.ts. This will create mock users on Supabase. To remove them use the following the terminal command.

```
npx tsx --env-file=.env scripts/cleanup-e2e-users.ts
npx tsx --env-file=.env scripts/cleanup-e2e-users.ts --delete
```
