import {
  clearLocalVocabularyProgress,
  loadProgressMapFromSupabaseOrNull,
  migrateLocalGrammarProgressToSupabase,
  migrateLocalProgressToSupabase
} from './progress';
import { migrateLocalClozeStatsToSupabase, migrateLocalQuizStatsToSupabase } from './quiz-stats';

/**
 * What a Plus user's login (auth/sync) does with progress left in localStorage from when
 * they were a guest or free user. Never throws, so it cannot break login.
 *
 * - Quiz stats, Sentences (cloze) stats and grammar progress are migrated first, in every
 *   case. Each removes its local keys only after a successful upsert, so a failed attempt is
 *   retried on the next login: logout parks the leftover keys per account and `adoptLiveProgress`
 *   (parked-progress.ts, called by auth/sync just before this function) restores them first, so
 *   the retry also happens after an explicit logout. migrateLocalProgressToSupabase must not clear
 *   them (it only clears `progress-` keys), and it returns early for a learner with no vocab
 *   progress.
 * - Vocab/uttrykk `progress-` keys depend on what the cloud holds:
 *   - empty cloud: a fresh upgrade, so the local progress is copied up;
 *   - progress already in the cloud: the local keys are stale and are discarded;
 *   - the read failed (`null`): the state is unknown, so nothing is copied and nothing is
 *     discarded. Treating a failed read as an empty cloud would upsert the local rows over
 *     the real ones. The local keys stay, and the next login decides again.
 */
export async function syncLocalProgressToPlus(userId: string): Promise<void> {
  const cloudVocab = await loadProgressMapFromSupabaseOrNull(userId);

  await migrateLocalQuizStatsToSupabase(userId);
  await migrateLocalClozeStatsToSupabase(userId);
  await migrateLocalGrammarProgressToSupabase(userId);

  if (cloudVocab === null) {
    console.error('syncLocalProgressToPlus: could not read card_progress; keeping local progress');
    return;
  }
  try {
    if (Object.keys(cloudVocab).length === 0) {
      await migrateLocalProgressToSupabase(userId);
    } else {
      clearLocalVocabularyProgress();
    }
  } catch (error) {
    // A throw must not stop the redirect after login; the local keys stay for the next try.
    console.error('syncLocalProgressToPlus: vocab progress step failed', error);
  }
}
