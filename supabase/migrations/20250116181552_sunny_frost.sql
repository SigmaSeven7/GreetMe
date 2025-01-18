/*
  # Fix RLS policies for greetings and profiles

  1. Changes
    - Drop and recreate all RLS policies with proper permissions
    - Ensure authenticated users can create and manage their data
    - Fix profile management policies

  2. Security
    - Maintain proper access control
    - Enable RLS on all tables
    - Ensure authenticated users can manage their own data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public greetings are viewable by everyone" ON greetings;
DROP POLICY IF EXISTS "Private greetings are viewable with access code" ON greetings;
DROP POLICY IF EXISTS "Authors can view their own greetings" ON greetings;
DROP POLICY IF EXISTS "Authenticated users can create greetings" ON greetings;
DROP POLICY IF EXISTS "Authors can update their greetings" ON greetings;
DROP POLICY IF EXISTS "Authors can delete their greetings" ON greetings;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;

-- Re-enable RLS
ALTER TABLE greetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create greetings policies
CREATE POLICY "Anyone can view public greetings"
  ON greetings
  FOR SELECT
  USING (access_type = 'public');

CREATE POLICY "Private greetings are viewable with access code"
  ON greetings
  FOR SELECT
  USING (
    access_type = 'private' 
    AND access_code = current_setting('request.headers')::json->>'access-code'
  );

CREATE POLICY "Authors can manage their own greetings"
  ON greetings
  FOR ALL
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Create profile policies
CREATE POLICY "Anyone can view profiles"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own profile"
  ON profiles
  FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;