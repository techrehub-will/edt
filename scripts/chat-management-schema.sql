-- Chat Management Schema for AI Copilot
-- Add these tables to support persistent chat sessions

-- Chat sessions table
CREATE TABLE
IF NOT EXISTS chat_sessions
(
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
  user_id UUID NOT NULL,
  title VARCHAR
(255) NOT NULL DEFAULT 'New Chat',
  description TEXT,
  last_message_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
  updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- Chat messages table
CREATE TABLE
IF NOT EXISTS chat_messages
(
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
  session_id UUID NOT NULL REFERENCES chat_sessions
(id) ON
DELETE CASCADE,
  user_id UUID
NOT NULL,
  message_type VARCHAR
(20) NOT NULL CHECK
(message_type IN
('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- Store data references, context used, etc.
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- Create indexes for better performance
CREATE INDEX
IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions
(user_id);
CREATE INDEX
IF NOT EXISTS idx_chat_sessions_last_message_at ON chat_sessions
(user_id, last_message_at DESC);
CREATE INDEX
IF NOT EXISTS idx_chat_messages_session_id ON chat_messages
(session_id);
CREATE INDEX
IF NOT EXISTS idx_chat_messages_created_at ON chat_messages
(session_id, created_at ASC);

-- Enable RLS (Row Level Security)
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY chat_sessions_user_policy ON chat_sessions
  USING
(user_id = auth.uid
())
  WITH CHECK
(user_id = auth.uid
());

CREATE POLICY chat_messages_user_policy ON chat_messages
  USING
(user_id = auth.uid
())
  WITH CHECK
(user_id = auth.uid
());

-- Trigger to update last_message_at when messages are added
CREATE OR REPLACE FUNCTION update_chat_session_last_message
()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions 
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_session_last_message_trigger
  AFTER
INSERT ON
chat_messages
FOR
EACH
ROW
EXECUTE FUNCTION update_chat_session_last_message
();

-- Trigger to auto-generate chat titles based on first user message
CREATE OR REPLACE FUNCTION auto_generate_chat_title
()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update title if it's still the default and this is a user message
    IF NEW.message_type = 'user' THEN
    UPDATE chat_sessions 
    SET title = CASE 
      WHEN title = 'New Chat' THEN 
        LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END
      ELSE title
    END,
    updated_at = NEW.created_at
    WHERE id = NEW.session_id;
END
IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_chat_title_trigger
  AFTER
INSERT ON
chat_messages
FOR
EACH
ROW
EXECUTE FUNCTION auto_generate_chat_title
();
