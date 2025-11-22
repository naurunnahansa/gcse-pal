'use server'
import { db } from "@/db/index";
import { questions, answers } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { currentUser } from '@clerk/nextjs/server'

// Fetches all questions, available to authenticated and anonymous users
export async function getAllQuestions(): Promise<Question[]> {
  const data = await db.select()
    .from(questions)
    .where(eq(questions.approved, true))
    .orderBy(desc(questions.timestamp));
  const res: Question[] = data.map((question) => ({
    id: question.id,
    quiz: question.quiz,
    approved: question.approved,
    contributor: question.contributor,
    contributorId: question.contributorId,
    timestamp: question.timestamp?.toISOString()
  }));
  for (const question of res) {
    const answerData = await db
      .select()
      .from(answers)
      .where(and(
        eq(answers.questionId, question.id as number),
        eq(answers.approved, true)
      ))
      .orderBy(desc(answers.timestamp))
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
};

// Creates a new question, available only to authenticated users
export const createQuestion = async (quiz: string) => {
  const user = await currentUser()
  if (!user) {
    throw new Error("Unauthorized");
  }

  await db.insert(questions).values({
    quiz: quiz,
    contributor: user.fullName as string,
    contributorId: user.id,
  });
};

// Creates a new answer, available only to authenticated users
export const createAnswer = async (answer: string, questionId: number) => {
  const user = await currentUser()
  if (!user) {
    throw new Error("Unauthorized");
  }

  await db.insert(answers).values({
    ans: answer,
    contributor: user.fullName as string,
    contributorId: user.id,
    questionId: questionId,
  });
};

// Deletes a question, available only to the question's contributor
export const deleteQuestion = async (id: number) => {
  const user = await currentUser()
  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const result = await db
      .delete(questions)
      .where(and(
        eq(questions.id, id),
        eq(questions.contributorId, user.id)
      ));
    return result;
  } catch (error) {
    console.error("Error deleting question:", error);
    throw new Error("Failed to delete question");
  }
};

// Deletes an answer, available only to the answer's contributor
export const deleteAnswer = async (id: number) => {
  const user = await currentUser()
  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    await db
      .delete(answers)
      .where(and(
        eq(answers.id, id),
        eq(answers.contributorId, user.id)
      ));
  } catch (error) {
    console.error("Error deleting answer:", error);
    throw new Error("Failed to delete answer");
  }
};

// Updates a question, available only to the question's contributor
export const updateQuestion = async (id: number, newText: string) => {
  const user = await currentUser()
  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    await db
      .update(questions)
      .set({ quiz: newText })
      .where(and(
        eq(questions.contributorId, user.id),
        eq(questions.id, id)
      ));
  } catch (error) {
    console.error("Error updating question:", error);
    throw new Error("Failed to update question");
  }
};

// Updates an answer, available only to the answer's contributor
export const updateAnswer = async (id: number, newText: string) => {
  const user = await currentUser()
  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    await db
      .update(answers)
      .set({ ans: newText })
      .where(and(
        eq(answers.contributorId, user.id),
        eq(answers.id, id)
      ));
  } catch (error) {
    console.error("Error updating answer:", error);
    throw new Error("Failed to update answer");
  }
};