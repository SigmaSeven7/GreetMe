/*
  # Add public greetings policy

  1. Changes
    - Add policy to allow anyone to view public greetings
    - This enables unauthenticated access to public greetings

  2. Security
    - Only allows reading public greetings
    - No modification of data is allowed
    - Access is restricted by the access_type column
*/

-- Enable anon access to greetings
CREATE POLICY "Anyone can view public greetings"
  ON greetings
  FOR SELECT
  TO anon
  USING (access_type = 'public');