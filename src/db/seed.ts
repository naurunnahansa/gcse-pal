import { config } from 'dotenv';
config({ path: '.env.local' });

const DUMMY_USER_ID = 'user_2lY9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y'; // Example Clerk ID

async function seed() {
    // Dynamic imports to ensure env vars are loaded first
    const { db } = await import('./index');
    const { courses, chapters, pages, markdownContent } = await import('./schema');

    console.log('🌱 Seeding database...');

    try {
        // 1. GCSE Mathematics
        console.log('Creating GCSE Mathematics course...');
        const [mathCourse] = await db.insert(courses).values({
            title: 'GCSE Mathematics',
            description: 'Complete coverage of the GCSE Mathematics syllabus including Algebra, Geometry, and Statistics.',
            isPublished: true,
            isFree: true,
            createdByClerkId: DUMMY_USER_ID,
        }).returning();

        const [mathChap1] = await db.insert(chapters).values({
            courseId: mathCourse.id,
            title: 'Algebra Basics',
            description: 'Introduction to algebraic expressions and equations.',
            orderIndex: 0,
            isPublished: true,
            isFree: true,
        }).returning();

        const [mathPage1] = await db.insert(pages).values({
            chapterId: mathChap1.id,
            title: 'Simplifying Expressions',
            orderIndex: 0,
            pageType: 'markdown',
        }).returning();

        await db.insert(markdownContent).values({
            pageId: mathPage1.id,
            content: '# Simplifying Expressions\n\nLearn how to simplify algebraic expressions by collecting like terms.\n\n## Example\n\nSimplify: 2x + 3y + 5x - y\n\nAnswer: 7x + 2y',
        });

        // 2. A-Level Physics
        console.log('Creating A-Level Physics course...');
        const [physicsCourse] = await db.insert(courses).values({
            title: 'A-Level Physics',
            description: 'Advanced Physics concepts for A-Level students. Mechanics, Electricity, and Particles.',
            isPublished: true,
            isFree: false,
            createdByClerkId: DUMMY_USER_ID,
        }).returning();

        const [physChap1] = await db.insert(chapters).values({
            courseId: physicsCourse.id,
            title: 'Mechanics',
            description: 'Forces, Motion, and Energy.',
            orderIndex: 0,
            isPublished: true,
            isFree: true, // Preview chapter
        }).returning();

        const [physPage1] = await db.insert(pages).values({
            chapterId: physChap1.id,
            title: 'Newton\'s Laws',
            orderIndex: 0,
            pageType: 'markdown',
        }).returning();

        await db.insert(markdownContent).values({
            pageId: physPage1.id,
            content: '# Newton\'s Laws of Motion\n\n1. **First Law**: An object remains at rest or in uniform motion unless acted upon by a force.\n2. **Second Law**: F = ma\n3. **Third Law**: Every action has an equal and opposite reaction.',
        });

        // 3. GCSE Computer Science (Draft)
        console.log('Creating GCSE Computer Science course...');
        await db.insert(courses).values({
            title: 'GCSE Computer Science',
            description: 'Learn about algorithms, programming, and computer systems.',
            isPublished: false, // Draft
            isFree: false,
            createdByClerkId: DUMMY_USER_ID,
        });

        console.log('✅ Seeding completed successfully!');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

seed();
