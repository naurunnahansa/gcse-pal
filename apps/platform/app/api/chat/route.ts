import { anthropic } from "@ai-sdk/anthropic";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  convertToModelMessages,
  experimental_createMCPClient,
  stepCountIs,
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

    // Connect to our MCP server using Streamable HTTP transport
    const transport = new StreamableHTTPClientTransport(
      new URL(process.env.MCP_SERVER_URL || "http://localhost:3001/mcp")
    );

    const mcpClient = await experimental_createMCPClient({ 
      transport
    });

    // Get tools from MCP server
    const mcpTools = await mcpClient.tools();

    const result = streamText({
      model: anthropic("claude-sonnet-4-5"),
      system: `You are a helpful customer service agent. You have access to company information, customers, and conversations.`,
      messages: convertToModelMessages(messages),
      tools:mcpTools,
      // allow one follow-up step after tool results
      stopWhen: stepCountIs(2),
      // Close MCP client when streaming is finished
      onFinish: async () => {
        await mcpClient.close();
      },
      // Close MCP client on error
      onError: async () => {
        await mcpClient.close();
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("MCP client error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
