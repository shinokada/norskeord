import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// plan, plus the trial flags (ai-docs/implementation/free-trial.md): authStore reads them
// so the countdown and the trial button also work on prerendered pages.
export const GET: RequestHandler = async ({ locals }) => {
  return json({
    plan: locals.plan,
    trialEndsAt: locals.trialEndsAt,
    trialEligible: locals.trialEligible
  });
};
