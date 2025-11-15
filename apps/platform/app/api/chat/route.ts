import { anthropic } from "@ai-sdk/anthropic";
import {
  streamText,
  type UIMessage,
  convertToModelMessages,
} from "ai";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  // Verify user is authenticated
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { messages, model, webSearch, courseContext }: {
      messages: UIMessage[];
      model?: string;
      webSearch?: boolean;
      courseContext?: string;
    } = await req.json();

    // Select the appropriate Claude model
    let selectedModel;
    switch (model) {
      case 'anthropic/claude-3-sonnet-20240229':
        selectedModel = anthropic("claude-3-sonnet-20240229");
        break;
      case 'anthropic/claude-3-haiku-20240307':
      default:
        selectedModel = anthropic("claude-3-haiku-20240307");
        break;
    }

      // Build context-aware system prompt
    const contextInfo = courseContext || 'You are helping with a general learning course.';
    const systemPrompt = `You are a helpful GCSE study assistant specializing in this course. ${contextInfo}

Your role is to:
- Help students understand course concepts and topics
- Answer questions about the course material
- Provide clear, accurate, and educational responses
- Adapt explanations to the GCSE level and course difficulty
- Support students' learning journey with relevant guidance

Always maintain a helpful, encouraging tone and focus on educational value.`;

    const result = streamText({
      model: selectedModel,
      system: systemPrompt,
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
