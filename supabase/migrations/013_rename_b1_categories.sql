-- Migration 013: Rename B1 category slugs in card_progress
-- Renames verbose/compound B1 category slugs to cleaner names.
-- Affects only rows where level = 'B1'.

UPDATE public.card_progress SET category = 'expressing-opinions' WHERE level = 'B1' AND category = 'opinion-adjectives';
UPDATE public.card_progress SET category = 'cooking'             WHERE level = 'B1' AND category = 'food-cooking-advanced';
UPDATE public.card_progress SET category = 'accommodation'       WHERE level = 'B1' AND category = 'housing-renting';
UPDATE public.card_progress SET category = 'health'              WHERE level = 'B1' AND category = 'health-body-intermediate';
UPDATE public.card_progress SET category = 'finance'             WHERE level = 'B1' AND category = 'finance-banking';
UPDATE public.card_progress SET category = 'reasoning'           WHERE level = 'B1' AND category = 'opinions-arguments';
UPDATE public.card_progress SET category = 'society'             WHERE level = 'B1' AND category = 'norwegian-society';
UPDATE public.card_progress SET category = 'urban-life'          WHERE level = 'B1' AND category = 'housing-urban-life';
UPDATE public.card_progress SET category = 'fitness'             WHERE level = 'B1' AND category = 'sports-fitness';
UPDATE public.card_progress SET category = 'economics'           WHERE level = 'B1' AND category = 'economics-personal-finance';
UPDATE public.card_progress SET category = 'sustainability'      WHERE level = 'B1' AND category = 'environment-b1';
UPDATE public.card_progress SET category = 'journalism'          WHERE level = 'B1' AND category = 'media-journalism-b1';
UPDATE public.card_progress SET category = 'family'              WHERE level = 'B1' AND category = 'relationships-family';
UPDATE public.card_progress SET category = 'politics'            WHERE level = 'B1' AND category = 'politics-civics';
UPDATE public.card_progress SET category = 'healthcare'          WHERE level = 'B1' AND category = 'health-system';
