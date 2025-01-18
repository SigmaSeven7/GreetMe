/*
  # Add notification email for private greetings

  1. Changes
    - Add notification_email column to greetings table for storing recipient email addresses
    - This field will be used to send access codes for private greetings

  2. Notes
    - The field is nullable since it's only required for private greetings
    - No default value is set as it should be explicitly provided when needed
*/

ALTER TABLE greetings ADD COLUMN IF NOT EXISTS notification_email text;