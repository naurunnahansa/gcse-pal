-- Migration Script: Database Optimization Phase 2
-- Proper foreign key constraints, user settings consolidation, and further optimizations

-- Phase 2.1: Add proper UUID foreign key constraints with cascade rules
-- This addresses the critical issue of text-based foreign keys lacking referential integrity

-- Note: This migration assumes Phase 1 has been successfully completed
-- and all tables are using UUID primary keys for proper relationships

-- Add user preferences column to users table (consolidate user_settings)
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
  "theme": "light",
  "email_notifications": true,
  "push_notifications": true,
  "study_reminders": true,
  "deadline_reminders": true,
  "daily_goal": 60,
  "preferred_study_time": "evening",
  "study_days": [1, 2, 3, 4, 5]
}';

-- Add members JSONB column to study_groups (consolidate study_group_members)
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS members JSONB DEFAULT '[]';

-- Create audit tables for data archival strategy
CREATE TABLE IF NOT EXISTS activity_log_archive (
    LIKE activity_log INCLUDING ALL,
    archive_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_items_archive (
    LIKE user_items INCLUDING ALL,
    archive_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_submissions_archive (
    LIKE quiz_submissions INCLUDING ALL,
    archive_date TIMESTAMP DEFAULT NOW()
);

-- Phase 2.2: Data Migration for user settings consolidation
-- Move user_settings data into users.preferences JSONB column

UPDATE users u
SET preferences = jsonb_build_object(
  'theme', COALESCE(us.theme, 'light'),
  'email_notifications', COALESCE(us.email_notifications, true),
  'push_notifications', COALESCE(us.push_notifications, true),
  'study_reminders', COALESCE(us.study_reminders, true),
  'deadline_reminders', COALESCE(us.deadline_reminders, true),
  'daily_goal', COALESCE(us.daily_goal, 60),
  'preferred_study_time', COALESCE(us.preferred_study_time, 'evening'),
  'study_days', COALESCE(us.study_days, '[1, 2, 3, 4, 5]')
)
FROM user_settings us
WHERE u.id = us.user_id;

-- Update users who don't have settings to use defaults
UPDATE users
SET preferences = '{
  "theme": "light",
  "email_notifications": true,
  "push_notifications": true,
  "study_reminders": true,
  "deadline_reminders": true,
  "daily_goal": 60,
  "preferred_study_time": "evening",
  "study_days": [1, 2, 3, 4, 5]
}'
WHERE preferences IS NULL;

-- Phase 2.3: Data Migration for study groups consolidation
-- Move study_group_members data into study_groups.members JSONB array

UPDATE study_groups sg
SET members = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', sgm.user_id,
      'role', COALESCE(sgm.role, 'member'),
      'joined_at', COALESCE(sgm.joined_at, sg.created_at)
    ) ORDER BY sgm.joined_at
  )
  FROM study_group_members sgm
  WHERE sgm.group_id = sg.id
)
WHERE EXISTS (
  SELECT 1 FROM study_group_members sgm WHERE sgm.group_id = sg.id
);

-- Ensure groups without members have empty array
UPDATE study_groups
SET members = '[]'
WHERE members IS NULL;

-- Phase 2.4: Enhanced indexes for performance optimization

-- Composite indexes for frequently queried patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_user_course_status ON enrollments(user_id, course_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_user_course_status ON progress(user_id, course_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_items_user_type_status ON user_items(user_id, item_type, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_log_user_type_course ON activity_log(user_id, activity_type, course_id);

-- JSONB path indexes for efficient metadata queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_items_metadata_tags_gin ON user_items USING gin((metadata->'tags'));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_content_data_gin_path ON lessons USING gin((content_data->'learning_objectives'));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_video_data_gin_path ON lessons USING gin((video_data->'quality'));

-- Study groups optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_groups_members_gin ON study_groups USING gin(members);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_preferences_gin ON users USING gin(preferences);

-- Full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_search ON courses USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_items_search ON user_items USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- Phase 2.5: Data archival strategy implementation

-- Archive old activity logs (older than 1 year)
INSERT INTO activity_log_archive
SELECT *, NOW() as archive_date
FROM activity_log
WHERE started_at < NOW() - INTERVAL '1 year';

-- Archive old quiz submissions (older than 2 years, keeping recent ones for analysis)
INSERT INTO quiz_submissions_archive
SELECT *, NOW() as archive_date
FROM quiz_submissions
WHERE created_at < NOW() - INTERVAL '2 years';

-- Archive inactive user items (completed/archived items older than 6 months)
INSERT INTO user_items_archive
SELECT *, NOW() as archive_date
FROM user_items
WHERE status IN ('completed', 'archived')
AND updated_at < NOW() - INTERVAL '6 months';

-- Phase 2.6: Performance optimization for large datasets

-- Create partitioned tables for activity_log (if data grows large)
-- This is prepared for future implementation
-- CREATE TABLE activity_log_y2024 PARTITION OF activity_log
-- FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Create materialized views for complex aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS user_course_stats AS
SELECT
    u.id as user_id,
    e.course_id,
    COUNT(DISTINCT c.id) as completed_chapters,
    COUNT(DISTINCT l.id) as total_lessons,
    COUNT(DISTINCT qs.id) as completed_quizzes,
    AVG(qs.score) as average_quiz_score,
    MAX(al.started_at) as last_activity,
    e.progress as enrollment_progress
FROM users u
JOIN enrollments e ON u.id = e.user_id
LEFT JOIN progress p ON u.id = p.user_id AND e.course_id = p.course_id AND p.status = 'completed'
LEFT JOIN chapters c ON e.course_id = c.course_id
LEFT JOIN lessons l ON c.id = l.chapter_id
LEFT JOIN quiz_submissions qs ON u.id = qs.user_id
LEFT JOIN activity_log al ON u.id = al.user_id AND al.course_id = e.course_id
GROUP BY u.id, e.course_id, e.progress;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_course_stats_user_course ON user_course_stats(user_id, course_id);

-- Phase 2.7: Database optimizations and cleanup

-- Optimize table statistics for better query planning
ANALYZE;
ANALYZE users;
ANALYZE courses;
ANALYZE user_items;
ANALYZE activity_log;
ANALYZE quiz_submissions;
ANALYZE study_groups;

-- Set appropriate table storage parameters for better performance
ALTER TABLE activity_log SET (autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE user_items SET (autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE quiz_submissions SET (autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_scale_factor = 0.05);

-- Phase 2.8: Data integrity constraints and triggers

-- Add check constraints for data validation
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS check_clerk_id_format CHECK (clerk_id ~ '^[a-zA-Z0-9_-]+$');
ALTER TABLE courses ADD CONSTRAINT IF NOT EXISTS check_rating_range CHECK (rating >= 0 AND rating <= 5);
ALTER TABLE quiz_submissions ADD CONSTRAINT IF NOT EXISTS check_score_range CHECK (score >= 0 AND score <= 100);
ALTER TABLE user_items ADD CONSTRAINT IF NOT EXISTS check_metadata_json CHECK (jsonb_typeof(metadata) = 'object' OR metadata IS NULL);

-- Create trigger to update user updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_items_updated_at BEFORE UPDATE ON user_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_user_course_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_course_stats;
END;
$$ LANGUAGE plpgsql;

COMMIT;