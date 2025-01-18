/*
  # Fix RLS policies for greetings and profiles

  1. Changes
    - Drop and recreate all RLS policies
    - Simplify access checks
    - Fix profile and greeting creation policies

  2. Security
    - Maintain proper access control
    - Enable RLS on all tables
    - Ensure authenticated users can manage their data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view public greetings" ON greetings;
DROP POLICY IF EXISTS "Authenticated users can view all their own greetings" ON greetings;
DROP POLICY IF EXISTS "Authenticated users can create greetings" ON greetings;
DROP POLICY IF EXISTS "Authenticated users can update their own greetings" ON greetings;
DROP POLICY IF EXISTS "Authenticated users can delete their own greetings" ON greetings;

-- Re-enable RLS
ALTER TABLE greetings ENABLE ROW LEVEL SECURITY;

-- Create simplified policies for greetings
CREATE POLICY "Public greetings are viewable by everyone"
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

CREATE POLICY "Authors can view their own greetings"
  ON greetings
  FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Authenticated users can create greetings"
  ON greetings
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their greetings"
  ON greetings
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their greetings"
  ON greetings
  FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Drop existing profile policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Re-enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simplified policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
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
  SET full_name = EXCLUDED.full_name,
      updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;