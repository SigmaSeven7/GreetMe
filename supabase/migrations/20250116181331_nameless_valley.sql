/*
  # Fix RLS policies for greetings table

  1. Changes
    - Drop existing policies to ensure clean slate
    - Create comprehensive RLS policies for greetings table
    - Add policies for all CRUD operations
    - Ensure proper access control for public and private greetings

  2. Security
    - Enable RLS on greetings table
    - Add policies for authenticated users
    - Add policies for public access
    - Add policies for private access with code verification
*/

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Anyone can view public greetings" ON greetings;
DROP POLICY IF EXISTS "Authenticated users can view their own greetings" ON greetings;
DROP POLICY IF EXISTS "Authenticated users can create greetings" ON greetings;
DROP POLICY IF EXISTS "Authenticated users can update their own greetings" ON greetings;
DROP POLICY IF EXISTS "Authenticated users can delete their own greetings" ON greetings;

-- Re-enable RLS to ensure it's active
ALTER TABLE greetings ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies

-- Public access policy
CREATE POLICY "Anyone can view public greetings"
  ON greetings
  FOR SELECT
  USING (
    access_type = 'public'
    OR (
      access_type = 'private'
      AND access_code IS NOT NULL
      AND access_code = current_setting('request.headers')::json->>'access-code'
    )
  );

-- Authenticated user policies
CREATE POLICY "Authenticated users can view all their own greetings"
  ON greetings
  FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Authenticated users can create greetings"
  ON greetings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      access_type = 'public'
      OR (
        access_type = 'private'
        AND access_code IS NOT NULL
        AND notification_email IS NOT NULL
      )
    )
  );

CREATE POLICY "Authenticated users can update their own greetings"
  ON greetings
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authenticated users can delete their own greetings"
  ON greetings
  FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());