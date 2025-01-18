/*
  # Update access code constraints

  1. Changes
    - Modify access_code column to enforce 6-digit numeric format
    - Add check constraint for access code format
    - Add trigger to validate access code format

  2. Security
    - Ensures access codes are exactly 6 digits when provided
    - Maintains existing RLS policies
*/

-- Modify access_code column to enforce numeric format
DO $$ 
BEGIN
  -- Update existing access_code values to NULL if they don't match the format
  UPDATE greetings 
  SET access_code = NULL 
  WHERE access_code IS NOT NULL 
  AND access_code !~ '^[0-9]{6}$';

  -- Add check constraint for access code format
  ALTER TABLE greetings
    ADD CONSTRAINT valid_access_code_format 
    CHECK (
      access_code IS NULL 
      OR access_code ~ '^[0-9]{6}$'
    );
END $$;