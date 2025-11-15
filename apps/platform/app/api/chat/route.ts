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
    const { messages, model, webSearch }: {
      messages: UIMessage[];
      model?: string;
      webSearch?: boolean;
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

    const systemPrompt = `You are a helpful GCSE study assistant. Help students with their learning and answer questions about various subjects including Mathematics, English, Science, History, and Geography. Be clear, accurate, and educational in your responses.`;

    const result = streamText({
      model: selectedModel,
      system: systemPrompt,
      messages: messages as any[],
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
