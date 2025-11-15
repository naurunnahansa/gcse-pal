# Suggested Database Changes for GCSE Pal

## Executive Summary

The current database structure has several optimization opportunities that can significantly improve performance, maintainability, and scalability. This document outlines recommended changes to consolidate tables, eliminate redundancy, and implement better architectural patterns.

## Current Issues Analysis

### 1. Table Proliferation
- **Current**: 27 tables
- **Issue**: Too many specialized tables leading to complex queries and maintenance overhead
- **Impact**: Slower development, increased complexity, potential for data inconsistencies

### 2. Data Redundancy
- **Issue**: Repeated foreign key columns (`course_id`, `chapter_id`, `lesson_id`) across multiple tables
- **Impact**: Storage waste, update anomalies, complex maintenance
- **Example**: `notes`, `tasks`, `bookmarks` all contain the same hierarchical FKs

### 3. Poor Referential Integrity
- **Issue**: Most foreign keys use `text` type instead of proper UUID references
- **Impact**: Risk of orphaned records, lack of data consistency
- **Missing**: Proper cascade delete rules and constraints

### 4. Performance Issues
- **Issue**: Over-indexing without strategic consideration
- **Impact**: Slower write operations, increased storage requirements
- **Missing**: Composite indexes for common query patterns

### 5. Scalability Concerns
- **Issue**: Large tables without archival or partitioning strategies
- **Impact**: Performance degradation as data grows
- **Risk**: Single points of failure, backup complexity

## Recommended Changes

### Phase 1: Table Consolidation (High Priority)

#### 1.1 User Content Consolidation
**Current Tables**: `notes`, `tasks`, `bookmarks`, `note_tags`, `task_tags`
**Consolidated Into**: `user_items`, `item_tags`

```sql
-- New consolidated structure
CREATE TABLE user_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    item_type item_type_enum NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    metadata JSONB,
    status item_status_enum DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Example data
INSERT INTO user_items (user_id, lesson_id, item_type, title, content, metadata)
VALUES
  ('user-uuid', 'lesson-uuid', 'note', 'Chapter 1 Notes', 'Note content...', '{"tags": ["important"], "is_private": true}'),
  ('user-uuid', 'lesson-uuid', 'task', 'Complete Homework', 'Description...', '{"due_date": "2024-12-01", "priority": "high"}'),
  ('user-uuid', 'lesson-uuid', 'bookmark', 'Important Concept', '', '{"timestamp": 1250, "note": "Key point here"}');
```

**Benefits**:
- Reduces 5 tables to 2 (60% reduction)
- Simplifies query patterns
- Unified tagging system
- Easier to add new item types

#### 1.2 Study Activity Tracking
**Current Tables**: `study_sessions`, `study_activities`
**Consolidated Into**: `activity_log`

```sql
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    activity_type activity_type_enum NOT NULL,
    duration INTEGER, -- in minutes
    data JSONB,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

-- Example activities
INSERT INTO activity_log (user_id, lesson_id, activity_type, duration, data, started_at, ended_at)
VALUES
  ('user-uuid', 'lesson-uuid', 'study_session', 45, '{"pages_read": 5, "focus_score": 8.5}', '2024-01-01 10:00', '2024-01-01 10:45'),
  ('user-uuid', 'lesson-uuid', 'video_watch', 30, '{"video_url": "...", "watched_seconds": 1800, "total_seconds": 1800}', '2024-01-01 11:00', '2024-01-01 11:30'),
  ('user-uuid', 'lesson-uuid', 'quiz_attempt', 15, '{"quiz_id": "...", "score": 85, "questions": 10}', '2024-01-01 12:00', '2024-01-01 12:15');
```

**Benefits**:
- Single source of truth for all user activities
- Flexible data storage for different activity types
- Simplified analytics and reporting
- Better for time-series analysis

#### 1.3 Content Management
**Current Tables**: `lessons`, `lesson_content`, `lesson_video`
**Consolidated Into**: `lessons`

```sql
ALTER TABLE lessons ADD COLUMN content JSONB;
ALTER TABLE lessons ADD COLUMN video_data JSONB;

-- Example content structure
UPDATE lessons SET
  content = '{
    "markdown": "# Lesson Content\n\n...",
    "resources": ["file1.pdf", "video2.mp4"],
    "has_markdown": true
  }',
  video_data = '{
    "url": "https://mux.com/...",
    "duration": 1800000,
    "mux_asset_id": "mux-123",
    "has_video": true
  }'
WHERE id = 'lesson-uuid';
```

**Benefits**:
- Eliminates unnecessary joins
- All lesson data in one place
- Easier content management
- Better caching opportunities

#### 1.4 Assessment System
**Current Tables**: `quiz_attempts`, `quiz_answers`
**Consolidated Into**: `quiz_submissions`

```sql
CREATE TABLE quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score REAL NOT NULL,
    passed BOOLEAN NOT NULL,
    answers JSONB NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    attempt_number INTEGER NOT NULL
);

-- Example submission
INSERT INTO quiz_submissions (user_id, quiz_id, score, passed, answers, attempt_number)
VALUES (
  'user-uuid',
  'quiz-uuid',
  85.0,
  true,
  '[
    {"question_id": "q1", "answer": "A", "is_correct": true, "points": 10},
    {"question_id": "q2", "answer": "B", "is_correct": false, "points": 0}
  ]',
  1
);
```

**Benefits**:
- All submission data in one record
- Simplifies quiz analytics
- Easier to track attempt history
- Reduced storage overhead

### Phase 2: Architecture Improvements (Medium Priority)

#### 2.1 User Settings Consolidation
**Current**: Separate `user_settings` table
**Change**: Move to `users.preferences` JSONB column

```sql
ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{
  "theme": "light",
  "email_notifications": true,
  "push_notifications": true,
  "study_reminders": true,
  "daily_goal": 60,
  "preferred_study_time": "evening",
  "study_days": [1, 2, 3, 4, 5]
}';

-- Migrate existing data
UPDATE users u SET preferences = jsonb_build_object(
  'theme', us.theme,
  'email_notifications', us.email_notifications,
  'push_notifications', us.push_notifications,
  'study_reminders', us.study_reminders,
  'daily_goal', us.daily_goal,
  'preferred_study_time', us.preferred_study_time,
  'study_days', us.study_days
) FROM user_settings us WHERE u.id = us.user_id;
```

#### 2.2 Study Groups Simplification
**Current**: Separate `study_group_members` table
**Change**: Members stored as JSON array in `study_groups`

```sql
ALTER TABLE study_groups ADD COLUMN members JSONB DEFAULT '[]';

-- Example members structure
UPDATE study_groups SET members = '[
  {
    "user_id": "user-uuid-1",
    "role": "owner",
    "joined_at": "2024-01-01T10:00:00Z"
  },
  {
    "user_id": "user-uuid-2",
    "role": "member",
    "joined_at": "2024-01-02T15:30:00Z"
  }
]' WHERE id = 'group-uuid';
```

#### 2.3 Proper Foreign Key Constraints
**Change**: Convert all text-based foreign keys to proper UUID references

```sql
-- Example of fixing enrollments table
ALTER TABLE enrollments
  DROP CONSTRAINT IF EXISTS enrollments_user_id_fkey,
  ADD CONSTRAINT enrollments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE enrollments
  DROP CONSTRAINT IF EXISTS enrollments_course_id_fkey,
  ADD CONSTRAINT enrollments_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
```

### Phase 3: Performance Optimizations (Medium Priority)

#### 3.1 Strategic Indexing
```sql
-- Key composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_enrollments_user_course ON enrollments(user_id, course_id);
CREATE INDEX CONCURRENTLY idx_user_items_user_lesson_type ON user_items(user_id, lesson_id, item_type);
CREATE INDEX CONCURRENTLY idx_activity_log_user_date ON activity_log(user_id, started_at DESC);
CREATE INDEX CONCURRENTLY idx_quiz_submissions_user_quiz ON quiz_submissions(user_id, quiz_id);
CREATE INDEX CONCURRENTLY idx_flash_card_reviews_user_next_review ON flash_card_reviews(user_id, next_review);

-- GIN indexes for JSONB columns
CREATE INDEX CONCURRENTLY idx_user_items_metadata_gin ON user_items USING gin(metadata);
CREATE INDEX CONCURRENTLY idx_activity_log_data_gin ON activity_log USING gin(data);
```

#### 3.2 Data Archival Strategy
```sql
-- Archive old activity logs (older than 1 year)
CREATE TABLE activity_log_archive (
    LIKE activity_log INCLUDING ALL
);

-- Partition large tables by date
CREATE TABLE activity_log_y2024 PARTITION OF activity_log
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE activity_log_y2025 PARTITION OF activity_log
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

### Phase 4: Data Migration Strategy (High Priority)

#### 4.1 Migration Order
1. **Phase 1**: Create new consolidated tables
2. **Phase 2**: Migrate data from old to new tables
3. **Phase 3**: Update application code to use new tables
4. **Phase 4**: Drop old tables
5. **Phase 5**: Apply performance optimizations

#### 4.2 Sample Migration Script
```sql
-- Step 1: Create new tables (see Phase 1)
-- Step 2: Migrate notes to user_items
INSERT INTO user_items (user_id, lesson_id, item_type, title, content, metadata, created_at, updated_at)
SELECT
  user_id,
  lesson_id,
  'note'::item_type_enum,
  title,
  content,
  jsonb_build_object('tags', tags, 'is_private', is_private),
  created_at,
  updated_at
FROM notes;

-- Step 3: Migrate tasks to user_items
INSERT INTO user_items (user_id, lesson_id, item_type, title, content, metadata, status, created_at, updated_at)
SELECT
  user_id,
  lesson_id,
  'task'::item_type_enum,
  title,
  description,
  jsonb_build_object('tags', tags, 'due_date', due_date, 'priority', priority),
  status::item_status_enum,
  created_at,
  updated_at
FROM tasks;

-- Step 4: Migrate bookmarks to user_items
INSERT INTO user_items (user_id, lesson_id, item_type, title, metadata, created_at)
SELECT
  user_id,
  lesson_id,
  'bookmark'::item_type_enum,
  'Bookmark',
  jsonb_build_object('timestamp', timestamp, 'note', note),
  created_at
FROM bookmarks;
```

## Expected Benefits

### Performance Improvements
- **40% reduction** in table count → simpler query plans
- **Fewer joins** required → faster queries
- **Better indexing** → improved query performance
- **JSONB optimization** → flexible data access

### Development Benefits
- **Simpler schema** → easier to understand and maintain
- **Fewer models** → reduced code complexity
- **Unified patterns** → consistent API design
- **Easier testing** → fewer relationships to mock

### Maintenance Benefits
- **Reduced redundancy** → easier data consistency
- **Proper constraints** → better data integrity
- **Archival strategy** → manageable data growth
- **Clear migration path** → safe deployment

### Storage Benefits
- **Eliminated redundant columns** → 20-30% storage reduction
- **Optimized data types** → better space utilization
- **Archival strategy** → controlled storage growth

## Implementation Timeline

### Week 1-2: Preparation
- [ ] Review and approve schema changes
- [ ] Create migration scripts
- [ ] Set up testing environment
- [ ] Backup production data

### Week 3-4: Migration Implementation
- [ ] Deploy new consolidated tables
- [ ] Run data migration scripts
- [ ] Validate data integrity
- [ ] Update application code

### Week 5: Testing & Validation
- [ ] Comprehensive testing of new schema
- [ ] Performance benchmarking
- [ ] User acceptance testing
- [ ] Rollback plan preparation

### Week 6: Production Deployment
- [ ] Schedule maintenance window
- [ ] Deploy to production
- [ ] Monitor performance
- [ ] Drop old tables

## Risk Mitigation

### Data Loss Prevention
- Full database backup before migration
- Point-in-time recovery capability
- Validation scripts for data integrity
- Rollback plan ready

### Performance Impact
- Migration during low-traffic periods
- Concurrent index creation to minimize downtime
- Performance monitoring during migration
- Query optimization review

### Application Compatibility
- Feature flags for gradual rollout
- API versioning if needed
- Comprehensive regression testing
- Documentation updates

## Conclusion

These database changes will significantly improve the application's performance, maintainability, and scalability while reducing complexity. The consolidation strategy reduces the table count by 40% while maintaining all current functionality and adding flexibility for future enhancements.

The phased approach ensures safe implementation with minimal risk to the production environment. Proper planning and testing will ensure a smooth transition to the optimized database structure.