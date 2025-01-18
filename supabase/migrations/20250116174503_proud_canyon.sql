/*
  # Create storage buckets for media uploads

  1. Changes
    - Create public storage buckets for images and videos
    - Set up appropriate security policies for authenticated users

  2. Security
    - Only authenticated users can upload files
    - Anyone can view uploaded files
    - Files are publicly accessible via URL
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('images', 'images', true),
  ('videos', 'videos', true);

-- Set up security policies for images bucket
CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'images' AND
    auth.role() = 'authenticated'
  );

-- Set up security policies for videos bucket
CREATE POLICY "Anyone can view videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'videos' AND
    auth.role() = 'authenticated'
  );