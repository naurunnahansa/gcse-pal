# GCSE Pal Documentation

This directory contains all documentation for the GCSE Pal application.

## Database Documentation

### Schema Documentation
- **[database-diagram.md](./database-diagram.md)** - Complete ERD of the current database structure
- **[optimized-database-schema.md](./optimized-database-schema.md)** - First optimization pass with proper relationships
- **[streamlined-database-schema.md](./streamlined-database-schema.md)** - Final streamlined schema (16 tables, 40% reduction)
- **[suggested-database-changes.md](./suggested-database-changes.md)** - Complete migration plan and implementation strategy

### Database Schema Evolution
1. **Current Structure** → Analyzed issues (redundancy, performance, scalability)
2. **Optimized Structure** → Fixed relationships, added constraints, improved performance
3. **Streamlined Structure** → Consolidated tables, reduced complexity, improved maintainability
4. **Migration Plan** → Safe implementation strategy with minimal risk

## Deployment Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide and infrastructure setup

## Content Documentation

Course content is located in `/apps/platform/public/content/` and organized by subject:
- Mathematics content in `/math/`
- English content in `/eng/`

## Development Documentation

- **[../README.md](../README.md)** - Project overview and setup instructions
- **[../apps/platform/README.md](../apps/platform/README.md)** - Platform-specific documentation
- **[../apps/xmcp/README.md](../apps/xmcp/README.md)** - XMCP service documentation

## Quick Database Reference

### Current Structure (27 tables)
- Users, settings, enrollments
- Courses, chapters, lessons
- Progress tracking
- Quiz system
- Notes, tasks, bookmarks
- Study sessions and activities
- Social features (study groups)
- Flash cards and reviews
- Analytics and evaluation

### Optimized Structure (16 tables)
- **User Content**: `user_items` (notes/tasks/bookmarks unified)
- **Study Tracking**: `activity_log` (sessions/activities unified)
- **Content Management**: Single `lessons` table with JSONB content
- **Assessment**: `quiz_submissions` (attempts/answers unified)
- **Social**: Simplified `study_groups` with JSONB members
- **Architecture**: Proper UUID foreign keys, strategic indexing

### Key Improvements
- ✅ 40% reduction in table count
- ✅ Eliminated redundant foreign keys
- ✅ Proper referential integrity
- ✅ Strategic performance indexing
- ✅ Flexible JSONB data storage
- ✅ Safe migration strategy