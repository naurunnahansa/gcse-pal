import { anthropic } from "@ai-sdk/anthropic";
import {
  streamText,
  type UIMessage,
} from "ai";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  // Verify user is authenticated
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: anthropic("claude-3-haiku-20240307"),
      system: `You are a helpful GCSE study assistant. Help students with their learning and answer questions about various subjects including Mathematics, English, Science, History, and Geography.`,
      messages: messages as any[],
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
