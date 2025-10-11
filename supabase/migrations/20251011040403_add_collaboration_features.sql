/*
  # Collaboration and Communication Features
  
  ## Overview
  This migration adds comprehensive collaboration capabilities including comments,
  notifications, and activity feeds for team communication on Six Sigma projects.
  
  ## New Tables
  
  ### 1. `comments`
  Project and entity-specific comments for team collaboration
  - `id` (uuid, primary key) - Unique comment identifier
  - `project_id` (uuid) - Links to projects
  - `entity_type` (text) - What is being commented on (project/requirement/kpi/fmea/solution)
  - `entity_id` (uuid) - Which specific entity
  - `user_id` (uuid) - Who made the comment
  - `content` (text) - Comment text
  - `parent_id` (uuid) - For threaded replies (nullable)
  - `created_at` (timestamptz) - When comment was made
  - `updated_at` (timestamptz) - Last edit timestamp
  
  ### 2. `notifications`
  User notifications for important events and updates
  - `id` (uuid, primary key) - Unique notification identifier
  - `user_id` (uuid) - Who receives the notification
  - `type` (text) - Notification type (mention/phase_change/comment_reply/approval_request)
  - `title` (text) - Notification title
  - `message` (text) - Notification message
  - `link` (text) - URL to related entity
  - `read` (boolean) - Read status
  - `project_id` (uuid) - Related project (nullable)
  - `created_at` (timestamptz) - When notification was created
  
  ### 3. `project_subscriptions`
  Track which users are subscribed to project updates
  - `id` (uuid, primary key)
  - `project_id` (uuid) - Links to projects
  - `user_id` (uuid) - Links to profiles
  - `subscribed_at` (timestamptz) - When user subscribed
  
  ### 4. `project_tags`
  Tagging system for project categorization
  - `id` (uuid, primary key)
  - `project_id` (uuid) - Links to projects
  - `tag` (text) - Tag name
  - `color` (text) - Tag color
  - `created_by` (uuid) - Who created the tag
  - `created_at` (timestamptz)
  
  ## Security
  
  - Row Level Security enabled on all new tables
  - Comments visible to organization members
  - Notifications private to recipient
  - Activity logs capture all collaboration events
  
  ## Notes
  
  - Comments support threading via parent_id
  - Notifications auto-generated for key events
  - Subscriptions enable opt-in notifications
  - Tags help organize and filter projects
*/

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('project', 'requirement', 'kpi', 'fmea', 'solution', 'general')),
  entity_id uuid,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('mention', 'phase_change', 'comment_reply', 'approval_request', 'assignment', 'quality_alert', 'gate_failure')),
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean DEFAULT false,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create project_subscriptions table
CREATE TABLE IF NOT EXISTS project_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscribed_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create project_tags table
CREATE TABLE IF NOT EXISTS project_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag text NOT NULL,
  color text DEFAULT 'blue',
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_project_id ON notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_project_subscriptions_project_id ON project_subscriptions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_subscriptions_user_id ON project_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_tags_project_id ON project_tags(project_id);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE POLICY "Users can view comments on projects in their organization"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = comments.project_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on projects they can access"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = comments.project_id
      AND om.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for project_subscriptions
CREATE POLICY "Users can view subscriptions for their projects"
  ON project_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_subscriptions.project_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own subscriptions"
  ON project_subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for project_tags
CREATE POLICY "Users can view tags for projects in their organization"
  ON project_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_tags.project_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can create tags"
  ON project_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_tags.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'manager', 'contributor')
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Tag creators can update their tags"
  ON project_tags FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Tag creators can delete their tags"
  ON project_tags FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Function to create notification for comment replies
CREATE OR REPLACE FUNCTION notify_comment_reply()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, project_id)
    SELECT 
      c.user_id,
      'comment_reply',
      'New reply to your comment',
      substring(NEW.content, 1, 100),
      '/projects/' || NEW.project_id,
      NEW.project_id
    FROM comments c
    WHERE c.id = NEW.parent_id
    AND c.user_id != NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for comment reply notifications
DROP TRIGGER IF EXISTS on_comment_reply ON comments;
CREATE TRIGGER on_comment_reply
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_reply();

-- Function to notify project subscribers of phase changes
CREATE OR REPLACE FUNCTION notify_phase_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_phase != NEW.current_phase THEN
    INSERT INTO notifications (user_id, type, title, message, link, project_id)
    SELECT 
      ps.user_id,
      'phase_change',
      'Project phase updated',
      'Project "' || NEW.name || '" moved to ' || NEW.current_phase || ' phase',
      '/projects/' || NEW.id,
      NEW.id
    FROM project_subscriptions ps
    WHERE ps.project_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for phase change notifications
DROP TRIGGER IF EXISTS on_project_phase_change ON projects;
CREATE TRIGGER on_project_phase_change
  AFTER UPDATE ON projects
  FOR EACH ROW
  WHEN (OLD.current_phase IS DISTINCT FROM NEW.current_phase)
  EXECUTE FUNCTION notify_phase_change();

-- Function to auto-subscribe project owner
CREATE OR REPLACE FUNCTION auto_subscribe_project_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_subscriptions (project_id, user_id)
  VALUES (NEW.project_id, NEW.user_id)
  ON CONFLICT (project_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-subscribe when added to project
DROP TRIGGER IF EXISTS on_project_member_added ON project_members;
CREATE TRIGGER on_project_member_added
  AFTER INSERT ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION auto_subscribe_project_owner();

-- Create trigger for updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();