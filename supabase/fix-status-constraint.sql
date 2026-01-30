-- =============================================
-- FIX STATUS CONSTRAINT - Allow all app status values
-- =============================================
-- Run this in Supabase SQL Editor

-- Drop the old constraint
ALTER TABLE public.content_posts 
  DROP CONSTRAINT IF EXISTS content_posts_status_check;

-- Add new constraint with all app status values
ALTER TABLE public.content_posts 
  ADD CONSTRAINT content_posts_status_check 
  CHECK (status IN ('backlog', 'idea', 'draft', 'review', 'in_review', 'scheduled', 'published', 'archived'));

-- Verify
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.content_posts'::regclass 
  AND contype = 'c';
