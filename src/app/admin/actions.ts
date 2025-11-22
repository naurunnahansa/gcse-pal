'use server'
import { db } from "@/db/index";
import { questions, answers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const getAllQuestionsWithAnswers = async () => {
  const questionsData = await db.select().from(questions).orderBy(desc(questions.timestamp));
  const res: Question[] = questionsData.map((question) => ({
    id: question.id,
    quiz: question.quiz,
    approved: question.approved,
    contributor: question.contributor,
    contributorId: question.contributorId,
    timestamp: question.timestamp?.toISOString(),
  }));
  for (const question of res) {
    const answerData = await db
      .select()
      .from(answers)
      .where(eq(answers.questionId, question.id as number))
      .orderBy(desc(answers.timestamp))
    if (!answerData) continue;
    question.answers = answerData.map((answer) => ({
      id: answer.id,
      ans: answer.ans,
      approved: answer.approved,
      contributor: answer.contributor,
      contributorId: answer.contributorId,
      questionId: answer.questionId,
      timestamp: answer.timestamp?.toISOString()
    }));
  }
  return res
}

export const approveQuestion = async (id: number) => {
  try {
    await db
      .update(questions)
      .set({ approved: true })
      .where(eq(questions.id, id));
  } catch (error) {
    console.error("Error approving question:", error);
    throw new Error("Failed to approve question");
  }
};

export const disapproveQuestion = async (id: number) => {
  try {
    await db
      .update(questions)
      .set({ approved: false })
      .where(eq(questions.id, id));
  } catch (error) {
    console.error("Error disapproving question:", error);
    throw new Error("Failed to disapprove question");
  }
};

export const approveAnswer = async (id: number) => {
  try {
    await db
      .update(answers)
      .set({ approved: true })
      .where(eq(answers.id, id));
  } catch (error) {
    console.error("Error approving answer:", error);
    throw new Error("Failed to approve answer");
  }
};

export const disapproveAnswer = async (id: number) => {
  try {
    await db
      .update(answers)
      .set({ approved: false })
      .where(eq(answers.id, id));
  } catch (error) {
    console.error("Error disapproving answer:", error);
    throw new Error("Failed to disapprove answer");
  }
};