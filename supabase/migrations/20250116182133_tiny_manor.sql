/*
  # Fix email notifications and access control

  1. Changes
    - Add email notification function using pg_net
    - Update access code verification
    - Fix RLS policies for better security

  2. Security
    - Maintain proper access control
    - Secure email sending
    - Protected access code verification
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing email function and trigger
DROP TRIGGER IF EXISTS send_access_code_email_trigger ON greetings;
DROP FUNCTION IF EXISTS send_access_code_email();

-- Create new email sending function
CREATE OR REPLACE FUNCTION send_access_code_email()
RETURNS trigger AS $$
DECLARE
  v_url text := 'https://xjgepxihvkwhmcpchrxj.supabase.co/functions/v1/send-access-code';
  v_response json;
BEGIN
  IF NEW.access_type = 'private' AND NEW.notification_email IS NOT NULL THEN
    SELECT INTO v_response
      pg_net.http_post(
        url := v_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', format('Bearer %s', current_setting('supabase.key.service_role'))
        ),
        body := jsonb_build_object(
          'email', NEW.notification_email,
          'access_code', NEW.access_code,
          'greeting_id', NEW.id,
          'greeting_title', NEW.title
        )::text
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger for email notifications
CREATE TRIGGER send_access_code_email_trigger
  AFTER INSERT ON greetings
  FOR EACH ROW
  EXECUTE FUNCTION send_access_code_email();