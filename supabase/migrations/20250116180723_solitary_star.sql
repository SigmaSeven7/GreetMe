/*
  # Fix email function to use PERFORM

  1. Changes
    - Replace SELECT with PERFORM for proper function execution
    - Maintain the same functionality but with correct syntax

  2. Security
    - Function maintains security definer setting
    - Only triggers for private greetings with notification emails
*/

-- Drop the old function and trigger
DROP TRIGGER IF EXISTS send_access_code_email_trigger ON greetings;
DROP FUNCTION IF EXISTS send_access_code_email();

-- Create the new email sending function with PERFORM
CREATE OR REPLACE FUNCTION send_access_code_email()
RETURNS trigger AS $$
BEGIN
  IF NEW.access_type = 'private' AND NEW.notification_email IS NOT NULL THEN
    PERFORM auth.email()
    FROM auth.users
    WHERE email = NEW.notification_email
    AND EXISTS (
      SELECT 1
      FROM auth.users
      WHERE email = NEW.notification_email
    )
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the new trigger
CREATE TRIGGER send_access_code_email_trigger
  AFTER INSERT ON greetings
  FOR EACH ROW
  EXECUTE FUNCTION send_access_code_email();