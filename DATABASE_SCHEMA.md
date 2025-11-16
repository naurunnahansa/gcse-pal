# GCSE Pal Database Schema Documentation

## Overview

This document provides a comprehensive overview of the GCSE Pal database schema, covering both the Drizzle ORM implementation in the codebase and the actual PostgreSQL database structure. The database has undergone two major optimization phases to improve performance and maintainability.

## Architecture

- **ORM**: Drizzle ORM with PostgreSQL
- **Database**: PostgreSQL
- **Schema Location**: `apps/platform/lib/db/schema.ts`
- **Migrations**: Located in `apps/platform/lib/db/migrations/`
- **Database Connection**: Managed via `apps/platform/lib/db/index.ts`

## Data Model Evolution

The database has evolved through several phases:

1. **Initial Schema**: Basic tables for courses, users, progress
2. **Phase 1 Optimization** (`001_database_optimization_phase1.sql`): Consolidated multiple tables into unified structures
3. **Phase 2 Optimization** (`002_database_optimization_phase2.sql`): Added advanced features, performance optimizations, and data archival strategies

## Database Schema

### 1. Core Tables

#### `users`
Stores user account information and preferences.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `clerkId` | text | Clerk authentication ID (unique) |
| `email` | text | User email (unique) |
| `name` | text | User display name |
| `avatar` | text | Profile picture URL |
| `role` | user_role_enum | User role (student/admin/teacher) |
| `preferences` | jsonb | User settings and preferences (consolidated from user_settings) |
| `createdAt` | timestamp | Account creation time |
| `updatedAt` | timestamp | Last update time |

**Indexes:**
- `users_clerk_id_idx` (btree on clerkId)
- `users_email_idx` (btree on email)
- `users_preferences_gin_idx` (GIN on preferences)

---

#### `courses`
Main course catalog.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `title` | text | Course title |
| `description` | text | Course description |
| `subject` | subject_enum | Academic subject |
| `level` | level_enum | Course level (gcse/igcse/a_level) |
| `thumbnail` | text | Course thumbnail URL |
| `instructor` | text | Instructor name |
| `instructorId` | text | Instructor ID |
| `duration` | integer | Course duration in minutes |
| `difficulty` | difficulty_enum | Difficulty level |
| `topics` | text[] | Array of course topics |
| `status` | course_status_enum | Publication status |
| `enrollmentCount` | integer | Number of enrolled students |
| `rating` | real | Course rating (0-5) |
| `price` | real | Course price |
| `createdAt` | timestamp | Creation time |
| `updatedAt` | timestamp | Last update time |

**Indexes:**
- `courses_title_idx` (btree on title)
- `courses_subject_idx` (btree on subject)
- `courses_status_idx` (btree on status)
- `courses_instructor_id_idx` (btree on instructorId)
- `courses_search` (GIN full-text search on title + description)

---

#### `chapters`
Course organization structure.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `courseId` | text | Reference to courses.id |
| `title` | text | Chapter title |
| `description` | text | Chapter description |
| `order` | integer | Order within course |
| `duration` | integer | Chapter duration in minutes |
| `isPublished` | boolean | Publication status |
| `createdAt` | timestamp | Creation time |
| `updatedAt` | timestamp | Last update time |

**Indexes:**
- `chapters_course_id_idx` (btree on courseId)
- `chapters_course_order_idx` (unique on courseId + order)

---

#### `lessons`
Individual learning materials within chapters.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `chapterId` | text | Reference to chapters.id |
| `title` | text | Lesson title |
| `description` | text | Lesson description |
| `content` | text | Legacy content field |
| `contentData` | jsonb | Enhanced content structure (Phase 2) |
| `videoData` | jsonb | Video metadata and streaming info (Phase 2) |
| `videoUrl` | text | Legacy video URL |
| `videoDuration` | integer | Video duration in milliseconds |
| `markdownPath` | text | Path to markdown content |
| `hasVideo` | boolean | Whether lesson has video |
| `hasMarkdown` | boolean | Whether lesson has markdown |
| `order` | integer | Order within chapter |
| `duration` | integer | Lesson duration in minutes |
| `isPublished` | boolean | Publication status |
| `muxAssetId` | text | Mux video platform asset ID |
| `muxUploadId` | text | Mux upload ID |
| `muxStatus` | text | Mux processing status |
| `createdAt` | timestamp | Creation time |
| `updatedAt` | timestamp | Last update time |

**Indexes:**
- `lessons_chapter_id_idx` (btree on chapterId)
- `lessons_chapter_order_idx` (unique on chapterId + order)
- `lessons_content_data_gin_idx` (GIN on contentData)
- `lessons_video_data_gin_idx` (GIN on videoData)

---

### 2. Consolidated Tables (Phase 1+ Optimizations)

#### `user_items` 🆕
Consolidates notes, tasks, and bookmarks into a single table for better performance.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `userId` | text | Reference to users.id |
| `lessonId` | text | Reference to lessons.id |
| `itemType` | item_type_enum | Type: note/task/bookmark |
| `title` | text | Item title |
| `content` | text | Item content |
| `metadata` | jsonb | Item-specific metadata (tags, due dates, etc.) |
| `status` | item_status_enum | Status: active/completed/archived |
| `createdAt` | timestamp | Creation time |
| `updatedAt` | timestamp | Last update time |

**Replaces:** `notes`, `tasks`, `bookmarks` tables

**Indexes:**
- `user_items_user_id_idx` (btree on userId)
- `user_items_lesson_id_idx` (btree on lessonId)
- `user_items_item_type_idx` (btree on itemType)
- `user_items_user_lesson_type_idx` (composite on userId + lessonId + itemType)
- `user_items_metadata_gin_idx` (GIN on metadata)
- `user_items_search` (GIN full-text search on title + content)

---

#### `item_tags` 🆕
Unified tagging system for user items.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `itemId` | text | Reference to user_items.id |
| `tag` | text | Tag name |
| `createdAt` | timestamp | Creation time |

**Indexes:**
- `item_tags_item_id_idx` (btree on itemId)
- `item_tags_tag_idx` (btree on tag)
- `item_tags_item_tag_idx` (unique on itemId + tag)

---

#### `activity_log` 🆕
Consolidates study sessions and activities into a unified activity tracking system.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `userId` | text | Reference to users.id |
| `lessonId` | text | Reference to lessons.id |
| `courseId` | text | Reference to courses.id |
| `activityType` | activity_type_new_enum | Type: study_session/video_watch/quiz_attempt/lesson_view |
| `duration` | integer | Duration in minutes |
| `data` | jsonb | Activity-specific data |
| `startedAt` | timestamp | Activity start time |
| `endedAt` | timestamp | Activity end time |
| `createdAt` | timestamp | Creation time |

**Replaces:** `study_sessions`, `study_activities` tables

**Indexes:**
- `activity_log_user_id_idx` (btree on userId)
- `activity_log_lesson_id_idx` (btree on lessonId)
- `activity_log_course_id_idx` (btree on courseId)
- `activity_log_activity_type_idx` (btree on activityType)
- `activity_log_user_date_idx` (composite on userId + startedAt DESC)
- `activity_log_data_gin_idx` (GIN on data)

---

#### `quiz_submissions` 🆕
Consolidates quiz attempts and answers into a single submission record.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `userId` | text | Reference to users.id |
| `quizId` | text | Reference to quizzes.id |
| `score` | real | Quiz score (0-100) |
| `passed` | boolean | Whether quiz was passed |
| `answers` | jsonb | Array of question answers and metadata |
| `startedAt` | timestamp | Quiz start time |
| `completedAt` | timestamp | Quiz completion time |
| `attemptNumber` | integer | Attempt number for this user/quiz |
| `timeSpent` | integer | Time spent in seconds |
| `createdAt` | timestamp | Creation time |

**Replaces:** `quiz_attempts`, `quiz_answers` tables

**Indexes:**
- `quiz_submissions_user_id_idx` (btree on userId)
- `quiz_submissions_quiz_id_idx` (btree on quizId)
- `quiz_submissions_user_quiz_idx` (composite on userId + quizId)
- `quiz_submissions_user_quiz_attempt_idx` (unique on userId + quizId + attemptNumber)

---

### 3. Enrollment and Progress

#### `enrollments`
User course enrollments.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `userId` | text | Reference to users.id |
| `courseId` | text | Reference to courses.id |
| `enrolledAt` | timestamp | Enrollment time |
| `completedAt` | timestamp | Course completion time |
| `lastActivityAt` | timestamp | Last activity time |
| `progress` | real | Progress percentage (0-100) |
| `status` | enrollment_status_enum | Enrollment status |

**Indexes:**
- `enrollments_user_id_idx` (btree on userId)
- `enrollments_course_id_idx` (btree on courseId)
- `enrollments_user_course_idx` (unique on userId + courseId)
- `enrollments_user_course_status_idx` (composite on userId + courseId + status)

---

#### `progress`
Detailed progress tracking for courses, chapters, and lessons.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `userId` | text | Reference to users.id |
| `courseId` | text | Reference to courses.id |
| `chapterId` | text | Reference to chapters.id |
| `lessonId` | text | Reference to lessons.id |
| `status` | progress_status_enum | Progress status |
| `startedAt` | timestamp | Start time |
| `completedAt` | timestamp | Completion time |
| `timeSpent` | integer | Time spent in minutes |
| `score` | real | Score if applicable |
| `lastAccessed` | timestamp | Last access time |

**Indexes:**
- `progress_user_id_idx` (btree on userId)
- `progress_course_id_idx` (btree on courseId)
- `progress_user_course_unique_idx` (unique on userId + courseId + chapterId + lessonId)
- `progress_user_course_status_idx` (composite on userId + courseId + status)

---

### 4. Assessment System

#### `quizzes`
Quiz definitions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `lessonId` | text | Reference to lessons.id |
| `chapterId` | text | Reference to chapters.id |
| `courseId` | text | Reference to courses.id |
| `title` | text | Quiz title |
| `description` | text | Quiz description |
| `timeLimit` | integer | Time limit in minutes |
| `passingScore` | real | Passing score percentage |
| `maxAttempts` | integer | Maximum allowed attempts |
| `isPublished` | boolean | Publication status |
| `createdAt` | timestamp | Creation time |
| `updatedAt` | timestamp | Last update time |

**Indexes:**
- `quizzes_lesson_id_idx` (btree on lessonId)
- `quizzes_chapter_id_idx` (btree on chapterId)
- `quizzes_course_id_idx` (btree on courseId)

---

#### `questions`
Individual quiz questions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `quizId` | text | Reference to quizzes.id |
| `question` | text | Question text |
| `type` | question_type_enum | Question type |
| `options` | text | JSON string of options for multiple choice |
| `correctAnswer` | text | Correct answer |
| `explanation` | text | Answer explanation |
| `points` | integer | Question points |
| `order` | integer | Question order |

**Indexes:**
- `questions_quiz_id_idx` (btree on quizId)

---

### 5. Flashcard System

#### `flash_cards`
Spaced repetition flashcards.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `courseId` | text | Reference to courses.id |
| `chapterId` | text | Reference to chapters.id |
| `front` | text | Question/prompt side |
| `back` | text | Answer/explanation side |
| `category` | text | Topic category |
| `difficulty` | difficulty_enum | Difficulty level |
| `tags` | text[] | Array of tags |
| `isPublished` | boolean | Publication status |
| `createdAt` | timestamp | Creation time |
| `updatedAt` | timestamp | Last update time |

**Indexes:**
- `flash_cards_course_id_idx` (btree on courseId)
- `flash_cards_chapter_id_idx` (btree on chapterId)
- `flash_cards_category_idx` (btree on category)

---

#### `flash_card_reviews`
Spaced repetition review tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `userId` | text | Reference to users.id |
| `flashCardId` | text | Reference to flash_cards.id |
| `quality` | review_quality_enum | SM-2 algorithm quality rating |
| `easeFactor` | real | SM-2 ease factor |
| `interval` | integer | Days until next review |
| `repetitions` | integer | Number of repetitions |
| `reviewedAt` | timestamp | Review time |
| `nextReview` | timestamp | Next review due time |

**Indexes:**
- `flash_card_reviews_user_flash_card_idx` (unique on userId + flashCardId)
- `flash_card_reviews_user_id_idx` (btree on userId)
- `flash_card_reviews_next_review_idx` (btree on nextReview)

---

### 6. Social Features

#### `study_groups`
Collaborative study groups.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Group name |
| `description` | text | Group description |
| `courseId` | text | Reference to courses.id |
| `creatorId` | text | Reference to users.id |
| `isPrivate` | boolean | Privacy setting |
| `memberCount` | integer | Number of members |
| `members` | jsonb | Array of member objects (Phase 2 consolidation) |
| `createdAt` | timestamp | Creation time |
| `updatedAt` | timestamp | Last update time |

**Indexes:**
- `study_groups_course_id_idx` (btree on courseId)
- `study_groups_creator_id_idx` (btree on creatorId)
- `study_groups_members_gin_idx` (GIN on members)

---

#### `study_group_messages`
Group chat messages.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `groupId` | text | Reference to study_groups.id |
| `userId` | text | Reference to users.id |
| `content` | text | Message content |
| `type` | message_type_enum | Message type |
| `attachments` | jsonb | Array of attachment URLs |
| `createdAt` | timestamp | Creation time |
| `updatedAt` | timestamp | Last update time |

**Indexes:**
- `study_group_messages_group_id_idx` (btree on groupId)
- `study_group_messages_user_id_idx` (btree on userId)

---

### 7. Supporting Tables

#### `course_tags`
Course tagging system.

| Column | Type | Description |
|--------|------|-------------|
| `courseId` | text | Reference to courses.id |
| `tag` | text | Tag name |

**Indexes:**
- `course_tags_course_id_tag_idx` (unique on courseId + tag)

---

#### `user_favorites`
User favorited courses.

| Column | Type | Description |
|--------|------|-------------|
| `userId` | text | Reference to users.id |
| `courseId` | text | Reference to courses.id |
| `createdAt` | timestamp | Creation time |

**Indexes:**
- `user_favorites_user_course_idx` (unique on userId + courseId)

---

#### `evaluation_stats`
User performance analytics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `userId` | text | Reference to users.id |
| `courseId` | text | Reference to courses.id |
| `chapterId` | text | Reference to chapters.id |
| `totalQuestions` | integer | Total questions attempted |
| `correctAnswers` | integer | Correct answers count |
| `totalTimeSpent` | integer | Total time in minutes |
| `averageScore` | real | Average score |
| `bestScore` | real | Best score achieved |
| `lastStudiedAt` | timestamp | Last study session |
| `streakDays` | integer | Current study streak |
| `createdAt` | timestamp | Creation time |
| `updatedAt` | timestamp | Last update time |

**Indexes:**
- `evaluation_stats_user_id_idx` (btree on userId)
- `evaluation_stats_course_id_idx` (btree on courseId)
- `evaluation_stats_user_course_chapter_idx` (unique on userId + courseId + chapterId)

---

## Enums

### User and Role Enums
- `user_role_enum`: student, admin, teacher
- `group_role_enum`: owner, moderator, member

### Academic Enums
- `subject_enum`: mathematics, english, science, history, geography, other
- `level_enum`: gcse, igcse, a_level
- `difficulty_enum`: beginner, intermediate, advanced

### Content Enums
- `course_status_enum`: draft, published, archived
- `question_type_enum`: multiple_choice, true_false, short_answer, essay

### Progress and Status Enums
- `enrollment_status_enum`: active, completed, paused, dropped
- `progress_status_enum`: not_started, in_progress, completed
- `task_status_enum`: pending, in_progress, completed, cancelled
- `task_priority_enum`: low, medium, high

### Activity Enums
- `activity_type_enum`: watch_video, read_markdown, take_quiz, take_notes, practice_exercise
- `activity_type_new_enum`: study_session, video_watch, quiz_attempt, lesson_view

### System Enums
- `theme_enum`: light, dark, system
- `study_time_enum`: morning, afternoon, evening
- `message_type_enum`: text, file, link
- `review_quality_enum`: again, hard, good, easy

### Consolidated Table Enums (Phase 1+)
- `item_type_enum`: note, task, bookmark
- `item_status_enum`: active, completed, archived

---

## Performance Optimizations (Phase 2)

### 1. Materialized Views

#### `user_course_stats`
Pre-computed user course statistics for analytics.

```sql
CREATE MATERIALIZED VIEW user_course_stats AS
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
-- ... additional joins
GROUP BY u.id, e.course_id, e.progress;
```

### 2. Advanced Indexing Strategy

- **Composite Indexes**: Optimized for common query patterns
- **JSONB Path Indexes**: Efficient metadata queries
- **Full-Text Search**: GIN indexes for content search
- **GIN Indexes**: For JSONB and array columns

### 3. Data Archival Strategy

#### Archive Tables
- `activity_log_archive`: Old activity logs (>1 year)
- `user_items_archive`: Inactive items (>6 months)
- `quiz_submissions_archive`: Old submissions (>2 years)

#### Automated Archival
- Regular archival jobs move old data to archive tables
- Reduces main table size for better performance
- Maintains data availability for analytics

---

## Code-Side Implementation

### Drizzle Schema Structure

The schema is defined in `apps/platform/lib/db/schema.ts` using Drizzle ORM's PostgreSQL dialect:

```typescript
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
```

### Type Inference

Drizzle provides automatic TypeScript type inference:

```typescript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Database Connection

```typescript
// apps/platform/lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { max: 20 });
export const db = drizzle(client, { schema });
```

---

## Migration History

### 0000_tiny_leopardon.sql
- Initial schema creation
- Basic tables for courses, users, progress, quizzes, etc.
- Standard indexes and constraints

### 001_database_optimization_phase1.sql
- Created consolidated tables (`user_items`, `activity_log`, `quiz_submissions`)
- Data migration from legacy tables
- Enhanced content management with JSONB columns
- Strategic indexing for performance

### 002_database_optimization_phase2.sql
- User settings consolidation into `users.preferences`
- Study groups member consolidation into `study_groups.members`
- Advanced indexing strategies
- Materialized views for analytics
- Data archival tables and strategies
- Database optimization parameters

---

## Usage Patterns

### 1. Common Queries

#### Get User Progress
```sql
-- Optimized query using consolidated tables
SELECT u.id, u.name, e.progress, COUNT(DISTINCT ui.id) as user_items
FROM users u
JOIN enrollments e ON u.id = e.user_id
LEFT JOIN user_items ui ON u.id = ui.user_id AND ui.status = 'active'
WHERE u.id = $1
GROUP BY u.id, e.progress;
```

#### Get Course Analytics
```sql
-- Using materialized view for performance
SELECT * FROM user_course_stats
WHERE user_id = $1 AND course_id = $2;
```

### 2. Write Patterns

#### Create User Item (Note/Task/Bookmark)
```sql
INSERT INTO user_items (user_id, lesson_id, item_type, title, content, metadata)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;
```

#### Log Activity
```sql
INSERT INTO activity_log (user_id, lesson_id, course_id, activity_type, duration, data, started_at, ended_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;
```

---

## Best Practices

### 1. Performance
- Use materialized views for complex analytics queries
- Leverage JSONB columns for flexible metadata storage
- Monitor index usage and optimize query patterns
- Regular maintenance with `ANALYZE` commands

### 2. Data Consistency
- Use foreign key constraints where possible
- Implement proper transaction handling
- Regular data integrity checks
- Automated archival for old data

### 3. Development
- Use TypeScript types from Drizzle ORM
- Follow the migration process for schema changes
- Test migrations on staging environments
- Use the consolidated tables for new features

### 4. Monitoring
- Track materialized view refresh schedules
- Monitor archival job performance
- Set up alerts for database performance metrics
- Regular backup and recovery testing

---

## Future Considerations

### Potential Enhancements
1. **Table Partitioning**: For large tables like `activity_log`
2. **Read Replicas**: For analytics queries
3. **Connection Pooling**: Optimize database connections
4. **Caching Layer**: Redis for frequently accessed data
5. **Event Streaming**: For real-time activity tracking

### Scalability Planning
- Database sharding strategies for horizontal scaling
- Geographic distribution for global users
- Query optimization for larger datasets
- Archive and purging strategies for data lifecycle management

---

## API References

- **Drizzle ORM**: [https://orm.drizzle.team](https://orm.drizzle.team)
- **PostgreSQL Documentation**: [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
- **JSONB Functions**: [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)

---

*Last Updated: November 2025*
*Schema Version: Phase 2 Optimization*