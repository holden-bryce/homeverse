-- Add preferences column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Create index on preferences for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_preferences ON profiles USING GIN (preferences);

-- Update existing profiles with default preferences
UPDATE profiles 
SET preferences = '{
  "notifications": {
    "email_new_applications": true,
    "email_status_updates": true,
    "email_weekly_report": false,
    "sms_urgent_updates": false
  },
  "privacy": {
    "show_profile": true,
    "allow_messages": true
  },
  "display": {
    "theme": "light",
    "language": "en",
    "timezone": "UTC"
  }
}'::jsonb
WHERE preferences IS NULL OR preferences = '{}'::jsonb;