/*
  # Fix greeting save functionality

  1. Changes
    - Update RLS policies for greetings table
    - Fix author_id handling
    - Improve access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public greetings are viewable by everyone" ON greetings;
DROP POLICY IF EXISTS "Private greetings are viewable with access code" ON greetings;
DROP POLICY IF EXISTS "Authors can manage their own greetings" ON greetings;

-- Create new policies
CREATE POLICY "Anyone can view public greetings"
  ON greetings
  FOR SELECT
  USING (
    access_type = 'public'
    OR (
      access_type = 'private'
      AND access_code = current_setting('request.headers')::json->>'access-code'
    )
  );

CREATE POLICY "Authors can manage their own greetings"
  ON greetings
  FOR ALL
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE greetings ENABLE ROW LEVEL SECURITY;