/*
  # Fix RLS policies for greetings table

  1. Changes
    - Drop existing policies
    - Create new comprehensive RLS policies for greetings table
    - Add policies for media management
  
  2. Security
    - Enable RLS
    - Add policies for CRUD operations
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view public greetings" ON greetings;
DROP POLICY IF EXISTS "Anyone can view public greetings" ON greetings;
DROP POLICY IF EXISTS "Users can create greetings" ON greetings;
DROP POLICY IF EXISTS "Users can update their own greetings" ON greetings;

-- Create new policies
CREATE POLICY "Anyone can view public greetings"
  ON greetings
  FOR SELECT
  USING (
    access_type = 'public'
    OR
    (access_type = 'private' AND access_code IS NOT NULL)
  );

CREATE POLICY "Authenticated users can view their own greetings"
  ON greetings
  FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Authenticated users can create greetings"
  ON greetings
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

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

-- Storage policies for media cleanup
CREATE POLICY "Authenticated users can delete their media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('images', 'videos')
    AND auth.role() = 'authenticated'
  );