/*
  # Fix email notification system

  1. Changes
    - Remove previous email function that used non-existent net schema
    - Add proper email handling using pg_net extension
    - Update trigger to use the new function

  2. Security
    - Function runs with security definer to ensure proper permissions
    - Only triggers for private greetings with notification emails
*/

-- Enable the pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop the old function and trigger
DROP TRIGGER IF EXISTS send_access_code_email_trigger ON greetings;
DROP FUNCTION IF EXISTS send_access_code_email();

-- Create the new email sending function
CREATE OR REPLACE FUNCTION send_access_code_email()
RETURNS trigger AS $$
BEGIN
  IF NEW.access_type = 'private' AND NEW.notification_email IS NOT NULL THEN
    PERFORM
      pg_net.http_post(
        url := 'https://xjgepxihvkwhmcpchrxj.supabase.co/functions/v1/send-access-code',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', current_setting('request.headers')::json->>'authorization'
        ),
        body := jsonb_build_object(
          'email', NEW.notification_email,
          'access_code', NEW.access_code,
          'greeting_id', NEW.id
        )::text
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the new trigger
CREATE TRIGGER send_access_code_email_trigger
  AFTER INSERT ON greetings
  FOR EACH ROW
  EXECUTE FUNCTION send_access_code_email();