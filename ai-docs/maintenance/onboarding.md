# How to test onboarding

Set `onboarding_done` to `false` and `onboarding_snoozed_at` to `NULL`.

The logic in `+layout.svelte` is:

```ts
const showOnboardingSlides = $derived(
  !!data.user && !data.onboardingDone && data.onboardingSnoozedAt === null
);
```

Both conditions must be true for the overlay to appear — `onboarding_done = false` AND `onboarding_snoozed_at = NULL`.
