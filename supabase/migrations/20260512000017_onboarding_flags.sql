-- Onboarding tracking fields
-- Derived status comes from essays, these flags are for analytics/segmentation

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_essay_submitted boolean NOT NULL DEFAULT false;
