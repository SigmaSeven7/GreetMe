/*
  # Add email notification function

  1. Changes
    - Add function to send access code emails
    - Add trigger to automatically send emails when private greetings are created

  2. Security
    - Function runs with security definer to ensure email sending permissions
    - Only triggers for private greetings with notification emails
*/

-- Create the email sending function
CREATE OR REPLACE FUNCTION send_access_code_email()
RETURNS trigger AS $$
BEGIN
  IF NEW.access_type = 'private' AND NEW.notification_email IS NOT NULL THEN
    SELECT net.http_post(
      url := 'https://xjgepxihvkwhmcpchrxj.supabase.co/functions/v1/send-access-code',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', current_setting('request.headers')::json->>'authorization'
      ),
      body := jsonb_build_object(
        'email', NEW.notification_email,
        'access_code', NEW.access_code,
        'greeting_id', NEW.id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for sending emails
CREATE OR REPLACE TRIGGER send_access_code_email_trigger
  AFTER INSERT ON greetings
  FOR EACH ROW
  EXECUTE FUNCTION send_access_code_email();