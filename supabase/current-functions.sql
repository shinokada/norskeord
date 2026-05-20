
-- NOTE: Functions are not exported by Supabase's schema dump tool.
-- From supabase upsert_study_day function

INSERT INTO study_days (user_id, day, cards)
VALUES (p_user_id, p_day, 1)
ON CONFLICT (user_id, day)
DO UPDATE SET cards = study_days.cards + 1;
