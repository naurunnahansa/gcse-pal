"use client";

import { useState } from "react";
import { Mic, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const FloatingChat = () => {
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = () => {
    if (message.trim()) {
      // Handle message sending logic here
      console.log("Message sent:", message);
      setMessage("");
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);
    setIsTyping(value.length > 0);
    if (value.length > 0 && !isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleBlur = () => {
    if (!isTyping && message.length === 0) {
      setIsExpanded(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999]">
      <div
        className={`bg-background/30 backdrop-blur-xl supports-[backdrop-filter]:bg-background/20 border border-border/10 rounded-full shadow-none transition-all duration-500 ease-out flex items-center gap-2 ${
          isExpanded ? 'px-4 py-3 w-[20vw] max-w-[400px] min-w-[300px] bg-background/40 border-border/20 shadow-lg' : 'px-3 py-3 w-12 h-12 bg-background/20'
        }`}
      >
        {/* Expanded content */}
        {isExpanded && (
          <>
            {/* Online indicator and label */}
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500/60 rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground/70 whitespace-nowrap">Ask Pal</span>
            </div>

            {/* Input field */}
            <input
              type="text"
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Type your question..."
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 text-foreground/80"
            />
          </>
        )}

        {/* Action button */}
        <Button
          size="sm"
          className={`transition-all duration-300 ${
            isTyping
              ? 'bg-primary/80 hover:bg-primary text-primary-foreground p-2 h-8 w-8 rounded-full opacity-90'
              : 'bg-transparent hover:bg-background/30 text-muted-foreground/60 hover:text-foreground/80 p-2 h-8 w-8 rounded-full border border-border/10'
          }`}
          onClick={isTyping ? sendMessage : undefined}
        >
          {isTyping ? (
            <Send className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default FloatingChat;