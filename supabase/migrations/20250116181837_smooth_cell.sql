/*
  # Final RLS policy fixes and storage permissions

  1. Changes
    - Simplify RLS policies for better reliability
    - Add storage permissions for media management
    - Fix profile management

  2. Security
    - Maintain proper access control
    - Enable RLS on all tables
    - Ensure proper media storage access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view public greetings" ON greetings;
DROP POLICY IF EXISTS "Private greetings are viewable with access code" ON greetings;
DROP POLICY IF EXISTS "Authors can manage their own greetings" ON greetings;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;

-- Re-enable RLS
ALTER TABLE greetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simplified greetings policies
CREATE POLICY "Public greetings are viewable by everyone"
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
  USING (author_id = auth.uid());

-- Create simplified profile policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own profile"
  ON profiles
  FOR ALL
  TO authenticated
  USING (id = auth.uid());

-- Storage policies
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their media" ON storage.objects;

CREATE POLICY "Media is publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('images', 'videos'));

CREATE POLICY "Authenticated users can manage media"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id IN ('images', 'videos'))
  WITH CHECK (bucket_id IN ('images', 'videos'));