"use client";

import { useChat } from "@ai-sdk/react";
import { createId } from "@paralleldrive/cuid2";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

export default function Chat() {
  const [input, setInput] = useState("");

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  console.log("messages", messages);

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((message) => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === "user" ? "User: " : "AI: "}

          {message.parts.map((part) => {
            if (part.type === "text") {
              return <div key={createId()}>{part.text}</div>;
            }
            return null;
          })}

          <div></div>
        </div>
      ))}

      <form
        className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl space-y-2"
        onSubmit={async (event) => {
          event.preventDefault();

          sendMessage({
            role: "user",
            parts: [{ type: "text", text: input }],
          });

          setInput("");
        }}
      >
        <input
          className="w-full p-2"
          value={input}
          placeholder="Say something..."
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setInput(event.currentTarget.value);
          }}
        />
      </form>
    </div>
  );
}
