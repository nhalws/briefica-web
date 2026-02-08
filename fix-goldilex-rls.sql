-- Fix RLS policy for goldilex_access table
-- This allows users to read their own goldilex_access records

-- Enable RLS on the table (if not already enabled)
ALTER TABLE goldilex_access ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (in case we're re-running this)
DROP POLICY IF EXISTS "Users can read their own goldilex access" ON goldilex_access;

-- Create policy: Users can read their own goldilex_access record
CREATE POLICY "Users can read their own goldilex access"
ON goldilex_access
FOR SELECT
USING (auth.uid() = user_id);

-- Optional: Allow users to view all goldilex_access records (if you want public leaderboard, etc.)
-- DROP POLICY IF EXISTS "Anyone can view goldilex access" ON goldilex_access;
-- CREATE POLICY "Anyone can view goldilex access"
-- ON goldilex_access
-- FOR SELECT
-- USING (true);
