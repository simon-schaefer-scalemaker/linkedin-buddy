-- =============================================
-- FIX ID TYPES - Change UUID to TEXT for app compatibility
-- =============================================
-- Run this in Supabase SQL Editor to fix the "invalid input syntax for type uuid" errors

-- 1. Fix content_posts table
ALTER TABLE public.content_posts 
  ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- 2. Fix templates table  
ALTER TABLE public.templates 
  ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- 3. Fix goals table
ALTER TABLE public.goals 
  ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- 4. Fix affiliate_links table
ALTER TABLE public.affiliate_links 
  ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- 5. Fix global_settings table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_settings') THEN
    ALTER TABLE public.global_settings ALTER COLUMN id TYPE TEXT USING id::TEXT;
  END IF;
END $$;

-- Verify the changes
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name = 'id'
  AND table_name IN ('content_posts', 'templates', 'goals', 'affiliate_links', 'global_settings')
ORDER BY table_name;
