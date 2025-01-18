/*
  # Update greetings policies

  1. Changes
    - Remove email trigger and function
    - Update RLS policies to handle both public and private greetings
    - Ensure proper author management
*/

-- Drop existing email function and trigger
DROP TRIGGER IF EXISTS send_access_code_email_trigger ON greetings;
DROP FUNCTION IF EXISTS send_access_code_email();

-- Drop all existing policies for greetings
DO $$ 
BEGIN
  -- Drop all policies on greetings table
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON greetings;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'greetings'
  );
END $$;

-- Create new policies with unique names
CREATE POLICY "greetings_public_view_20250116183922"
  ON greetings
  FOR SELECT
  USING (
    access_type = 'public'
    OR (
      access_type = 'private'
      AND access_code = current_setting('request.headers')::json->>'access-code'
    )
  );

CREATE POLICY "greetings_author_manage_20250116183922"
  ON greetings
  FOR ALL
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE greetings ENABLE ROW LEVEL SECURITY;