# Database Migration: Complex → Simplified Schema

## Overview

This migration transforms our complex 25+ table database into a clean, focused 13-table schema centered on **courses and quizzes**.

### Key Improvements

- **50% fewer tables**: 25+ → 13 tables
- **Proper normalization**: Answers separated from questions
- **No JSONB complexity**: Simple, readable columns
- **Focus on core features**: Courses and quizzes only
- **Better performance**: Faster queries, easier maintenance

---

## New Schema Structure

### Core Tables (13 total)

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User management | Clean user data, no JSONB preferences |
| `courses` | Course catalog | Subject, level, instructor info |
| `chapters` | Course organization | Ordered content within courses |
| `lessons` | Lesson content | Video and/or markdown content |
| `quizzes` | Assessments | Flexible quiz configuration |
| `questions` | Quiz questions | Multiple question types |
| `answers` | Question options | **Properly normalized!** |
| `enrollments` | User enrollments | Course enrollment tracking |
| `course_progress` | High-level progress | Course completion status |
| `lesson_progress` | Detailed tracking | Individual lesson progress |
| `quiz_attempts` | Quiz tracking | Score, attempts, timing |
| `user_answers` | Individual answers | Per-question answer tracking |

### Removed Features

- ❌ Notes, tasks, bookmarks
- ❌ Flashcards with spaced repetition
- ❌ Study groups and messaging
- ❌ Complex activity logging
- ❌ User settings/preferences JSONB
- ❌ Materialized views and archive tables

---

## Migration Process

### Phase 1: Setup New Schema

```bash
# 1. Create new schema files (already done)
ls -la apps/platform/lib/db/schema-new.ts
ls -la schema-new.sql

# 2. Generate Drizzle migration
npm run generate-migration

# 3. Apply new schema to database
npm run db:migrate
```

### Phase 2: Data Migration

```bash
# Run the migration script
npx tsx migrate-to-new-schema.ts
```

### Phase 3: Update Application Code

```bash
# Replace schema imports
# FROM: import * as schema from './lib/db/schema'
# TO:   import * as schema from './lib/db/schema-new'

# Update all API routes and components
# (See detailed steps below)
```

---

## Code Updates Required

### 1. Update Database Schema Import

**Files to change:**
- `apps/platform/lib/db/index.ts`
- All API route files
- Any components using database types

```typescript
// OLD
import * as schema from './lib/db/schema';

// NEW
import * as schema from './lib/db/schema-new';
```

### 2. Update API Routes

**Key API routes requiring updates:**

#### Courses API (`/api/courses`)
- Remove enrollmentCount/rating calculations (can be computed)
- Simplify query logic

#### Lessons API (`/api/lessons/[lessonId]`)
- Remove `contentData` and `videoData` JSONB fields
- Use simple `content` and `videoUrl` fields

#### Progress API (`/api/progress/track`)
- Update to use both `course_progress` and `lesson_progress`
- Simplify progress tracking logic

#### Quizzes API (`/api/quizzes`)
- Update to use normalized `answers` table
- Remove JSON parsing for options

### 3. Update Frontend Components

**Components requiring updates:**

#### Learning Dashboard
- Remove features: notes, tasks, bookmarks
- Focus on course progress and quiz performance

#### Course Content
- Simplify lesson content rendering
- Remove complex activity logging

#### Quiz Components
- Update answer handling to work with normalized `answers` table
- Remove JSON parsing for question options

---

## Data Mapping Reference

### Old → New Field Mappings

#### Users
```typescript
// OLD (complex)
{
  preferences: jsonb, // Complex JSON object
  // ... other fields
}

// NEW (simple)
{
  // preferences removed
  // ... other fields unchanged
}
```

#### Questions → Questions + Answers
```typescript
// OLD (denormalized)
{
  question: "What is 2+2?",
  options: ["3", "4", "5", "6"], // JSON array
  correctAnswer: "4", // String
  // ... other fields
}

// NEW (normalized)
// Questions table
{
  question: "What is 2+2?",
  // options removed
  // correctAnswer removed
  // ... other fields
}

// Answers table (NEW)
[
  { answerText: "3", isCorrect: false, order: 0 },
  { answerText: "4", isCorrect: true, order: 1 },
  { answerText: "5", isCorrect: false, order: 2 },
  { answerText: "6", isCorrect: false, order: 3 }
]
```

#### Progress Split
```typescript
// OLD (single table)
{
  courseId: "course-123",
  chapterId: "chapter-456",
  lessonId: "lesson-789", // Optional
  // ... progress fields
}

// NEW (split into two tables)
// Course progress
{
  courseId: "course-123",
  // chapterId removed
  // lessonId removed
  // ... progress fields
}

// Lesson progress
{
  courseId: "course-123",
  lessonId: "lesson-789",
  // ... progress fields
}
```

---

## Benefits of New Schema

### 1. **Simplified Development**
- 50% fewer tables to manage
- No complex JSONB queries
- Clear, predictable data structure

### 2. **Better Performance**
- Faster queries with proper indexing
- No JSON parsing overhead
- Smaller database footprint

### 3. **Easier Maintenance**
- Clear relationships between tables
- Proper normalization prevents data anomalies
- Simpler backup and restore

### 4. **Future Extensibility**
- Easy to add new features incrementally
- Clean foundation for future enhancements
- Better data integrity constraints

---

## Migration Commands

```bash
# 1. Install dependencies (if needed)
npm install drizzle-orm postgres

# 2. Set database URL
export DATABASE_URL="postgresql://user:password@localhost:5432/gcse_pal"

# 3. Generate migration files
npm run generate-migration

# 4. Apply schema changes
npm run db:migrate

# 5. Run data migration
npx tsx migrate-to-new-schema.ts

# 6. Update application code
# (Manual process - see sections above)

# 7. Test thoroughly
npm run test
npm run build
```

---

## Rollback Plan

If issues arise during migration:

```bash
# 1. Stop application
npm run stop

# 2. Restore database from backup
psql -d gcse_pal < backup-before-migration.sql

# 3. Revert code changes
git checkout HEAD~1 -- apps/platform/lib/db/schema.ts

# 4. Restart application
npm run dev
```

---

## Testing Checklist

- [ ] All existing courses load correctly
- [ ] User enrollment still works
- [ ] Lesson content displays properly
- [ ] Quiz functionality works end-to-end
- [ ] Progress tracking is accurate
- [ ] Admin features still functional
- [ ] Performance is improved
- [ ] No data loss during migration

---

## Support

For questions about this migration:

1. Check this document first
2. Review the migration script comments
3. Test on a staging environment first
4. Create database backup before production migration

**Remember**: This migration removes complex features in favor of simplicity. Ensure your team understands what's being removed before proceeding.