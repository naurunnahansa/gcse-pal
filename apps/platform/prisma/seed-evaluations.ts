import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function seedEvaluations() {
  console.log('🌱 Seeding evaluation data...');

  try {
    // Get the first course and user
    const course = await prisma.course.findFirst();
    const user = await prisma.user.findFirst();

    if (!course || !user) {
      console.log('❌ No course or user found. Please run the main seed first.');
      return;
    }

    console.log(`📚 Using course: ${course.title}`);
    console.log(`👤 Using user: ${user.name}`);

    // Get chapters for the course
    const chapters = await prisma.chapter.findMany({
      where: { courseId: course.id }
    });

    if (chapters.length === 0) {
      console.log('❌ No chapters found for this course.');
      return;
    }

    // Create quizzes for each chapter
    for (const chapter of chapters) {
      console.log(`📝 Creating quiz for chapter: ${chapter.title}`);

      // Create quiz
      const quiz = await prisma.quiz.create({
        data: {
          chapterId: chapter.id,
          title: `${chapter.title} Quiz`,
          description: `Test your knowledge of ${chapter.title}`,
          timeLimit: 10, // 10 minutes
          passingScore: 70,
          maxAttempts: 3,
          isPublished: true
        }
      });

      // Create questions for the quiz
      const questions = [
        {
          question: `What is the main concept covered in ${chapter.title}?`,
          type: 'multiple_choice',
          options: JSON.stringify([
            'Concept A',
            'Concept B',
            'Concept C',
            'Concept D'
          ]),
          correctAnswer: 0,
          explanation: 'Concept A is the main concept covered in this chapter.',
          points: 1,
          order: 1
        },
        {
          question: `True or False: The principles in ${chapter.title} are fundamental to understanding the subject.`,
          type: 'true_false',
          correctAnswer: 'true',
          explanation: 'The principles covered in this chapter are indeed fundamental to the subject.',
          points: 1,
          order: 2
        },
        {
          question: `Briefly explain one key takeaway from ${chapter.title}.`,
          type: 'short_answer',
          correctAnswer: 'Students should provide a reasonable explanation based on chapter content.',
          explanation: 'This answer should demonstrate understanding of the key concepts.',
          points: 2,
          order: 3
        }
      ];

      for (const q of questions) {
        await prisma.question.create({
          data: {
            quizId: quiz.id,
            ...q
          }
        });
      }
    }

    // Create flash cards
    console.log('🎴 Creating flash cards...');

    const flashCards = [
      {
        chapterId: chapters[0]?.id,
        front: 'What is the primary function of mitochondria in cells?',
        back: 'Mitochondria are the powerhouses of the cell, responsible for generating ATP through cellular respiration.',
        category: 'Cell Biology',
        difficulty: 'medium',
        tags: ['mitochondria', 'cellular respiration', 'ATP']
      },
      {
        chapterId: chapters[0]?.id,
        front: 'Define photosynthesis',
        back: 'Photosynthesis is the process by which plants, algae, and some bacteria convert light energy into chemical energy stored in glucose.',
        category: 'Plant Biology',
        difficulty: 'easy',
        tags: ['photosynthesis', 'plants', 'energy conversion']
      },
      {
        chapterId: chapters[0]?.id,
        front: 'What is the difference between DNA and RNA?',
        back: 'DNA contains deoxyribose sugar and uses thymine, while RNA contains ribose sugar and uses uracil instead of thymine. DNA is typically double-stranded, RNA is single-stranded.',
        category: 'Genetics',
        difficulty: 'medium',
        tags: ['DNA', 'RNA', 'nucleic acids']
      },
      {
        chapterId: chapters[1]?.id,
        front: 'Explain the process of mitosis',
        back: 'Mitosis is cell division that produces two identical daughter cells. It consists of prophase, metaphase, anaphase, and telophase.',
        category: 'Cell Biology',
        difficulty: 'hard',
        tags: ['mitosis', 'cell division', 'prophase']
      },
      {
        chapterId: chapters[1]?.id,
        front: 'What is an ecosystem?',
        back: 'An ecosystem is a community of living organisms interacting with each other and their non-living environment in a specific area.',
        category: 'Ecology',
        difficulty: 'easy',
        tags: ['ecosystem', 'environment', 'organisms']
      }
    ];

    for (const card of flashCards) {
      if (card.chapterId) {
        await prisma.flashCard.create({
          data: {
            ...card,
            isPublished: true
          }
        });
      }
    }

    // Create a course-level quiz
    console.log('🎯 Creating course-level quiz...');
    const courseQuiz = await prisma.quiz.create({
      data: {
        courseId: course.id,
        title: 'Course Final Assessment',
        description: 'Comprehensive assessment covering all course material',
        timeLimit: 30,
        passingScore: 75,
        maxAttempts: 3,
        isPublished: true
      }
    });

    // Create comprehensive questions for course quiz
    const courseQuestions = [
      {
        question: 'Which of the following best describes the relationship between cells and organisms?',
        type: 'multiple_choice',
        options: JSON.stringify([
          'Cells are the basic building blocks of all organisms',
          'Organisms are the basic building blocks of cells',
          'Cells and organisms are unrelated',
          'Only plants have cells'
        ]),
        correctAnswer: 0,
        explanation: 'Cells are indeed the fundamental units of life and the basic building blocks of all living organisms.',
        points: 2,
        order: 1
      },
      {
        question: 'All living organisms require energy to survive.',
        type: 'true_false',
        correctAnswer: 'true',
        explanation: 'Energy is essential for all life processes including growth, reproduction, and maintenance.',
        points: 1,
        order: 2
      }
    ];

    for (const q of courseQuestions) {
      await prisma.question.create({
        data: {
          quizId: courseQuiz.id,
          ...q
        }
      });
    }

    // Initialize evaluation stats for the user
    console.log('📊 Initializing evaluation stats...');
    await prisma.evaluationStats.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        courseId: course.id
      }
    });

    console.log('✅ Evaluation data seeded successfully!');
    console.log(`📝 Created ${chapters.length} chapter quizzes`);
    console.log(`🎴 Created ${flashCards.length} flash cards`);
    console.log(`🎯 Created 1 course quiz`);
    console.log(`📊 Initialized evaluation stats for user`);

  } catch (error) {
    console.error('❌ Error seeding evaluation data:', error);
    throw error;
  }
}

async function main() {
  await seedEvaluations();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });