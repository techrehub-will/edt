-- Create user profiles table
CREATE TABLE
IF NOT EXISTS user_profiles
(
  id UUID DEFAULT gen_random_uuid
() PRIMARY KEY,
  user_id UUID REFERENCES auth.users
(id) ON
DELETE CASCADE UNIQUE,
  email TEXT
NOT NULL,
  full_name TEXT,
  bio TEXT,
  title TEXT,
  company TEXT,
  location TEXT,
  experience_level TEXT CHECK
(experience_level IN
('entry', 'mid', 'senior', 'lead', 'executive')),
  specializations TEXT[] DEFAULT '{}',
  linkedin_url TEXT,
  github_url TEXT,
  phone TEXT,
  timezone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
  updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR
SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR
INSERT WITH CHECK (auth.uid() =
user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR
UPDATE USING (auth.uid()
= user_id);

-- Create indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_company ON user_profiles(company);
CREATE INDEX idx_user_profiles_location ON user_profiles(location);
CREATE INDEX idx_user_profiles_experience_level ON user_profiles(experience_level);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at
()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW
();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE
UPDATE ON user_profiles
  FOR EACH ROW
EXECUTE FUNCTION update_user_profiles_updated_at
();

-- Create user settings table
CREATE TABLE
IF NOT EXISTS user_settings
(
  id UUID DEFAULT gen_random_uuid
() PRIMARY KEY,
  user_id UUID REFERENCES auth.users
(id) ON
DELETE CASCADE UNIQUE,
  notifications_enabled BOOLEAN
DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  language TEXT DEFAULT 'en',
  weekly_digest BOOLEAN DEFAULT true,
  ai_insights_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
  updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR
SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR
INSERT WITH CHECK (auth.uid() =
user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR
UPDATE USING (auth.uid()
= user_id);

-- Create indexes
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_user_settings_updated_at
()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW
();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_user_settings_updated_at
  BEFORE
UPDATE ON user_settings
  FOR EACH ROW
EXECUTE FUNCTION update_user_settings_updated_at
();
