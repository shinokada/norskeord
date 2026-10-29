// The mock now lives in paged-select.ts (it also serves the card_progress and grammar_progress
// loaders); this alias keeps the quiz tests' imports unchanged.
export { mockPagedSelect as mockQuizSelect } from './paged-select';
