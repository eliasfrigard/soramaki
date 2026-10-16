-- 1. Add description column to existing tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS description text;

-- 2. Create the comments table
CREATE TABLE comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    -- We will tie this to auth.users in Milestone 3, leaving as standard uuid for now
    user_id uuid,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_task_created ON comments (task_id, created_at);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Temporary permissive policies until Google SSO is added in Milestone 3
CREATE POLICY "Allow public read access on comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on comments"
  ON comments FOR INSERT
  WITH CHECK (true);

GRANT SELECT, INSERT ON comments TO anon, authenticated;