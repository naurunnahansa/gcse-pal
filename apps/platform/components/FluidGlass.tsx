"use client";

import { useState, useRef, useEffect } from 'react';
import { Mic, Send, X, Minimize2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'pal';
  timestamp: Date;
}

const FluidGlass = () => {
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey! I'm Pal, your AI study assistant. How can I help you ace your GCSEs today? 🎯",
      sender: 'pal',
      timestamp: new Date()
    }
  ]);
  const [isPalTyping, setIsPalTyping] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) / window.innerWidth;
        const deltaY = (e.clientY - centerY) / window.innerHeight;

        setMousePosition({
          x: deltaX * 20,
          y: deltaY * 20
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (scrollContainerRef.current && isExpanded) {
        e.preventDefault();
        const delta = e.deltaY * 0.5;
        setScrollOffset(prev => {
          const maxScroll = Math.max(0, (messages.length - 6) * 55);
          return Math.max(0, Math.min(maxScroll, prev + delta));
        });
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [isExpanded, messages.length]);

  const scrollToBottom = () => {
    setScrollOffset(0);
  };

  const sendMessage = () => {
    if (message.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: message,
        sender: 'user',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setMessage("");
      setIsTyping(false);
      setIsPalTyping(true);

      // Simulate Pal response
      setTimeout(() => {
        const palResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: getPalResponse(message),
          sender: 'pal',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, palResponse]);
        setIsPalTyping(false);
      }, 1500);
    }
  };

  const getPalResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('math') || lowerMessage.includes('maths')) {
      return "I'd be happy to help with maths! Are you working on algebra, geometry, statistics, or another topic? I can break down complex concepts and provide practice problems.";
    } else if (lowerMessage.includes('science')) {
      return "Science is fascinating! Which area are you studying - biology, chemistry, or physics? I can explain difficult concepts and help with exam preparation.";
    } else if (lowerMessage.includes('english')) {
      return "Let's tackle English together! Do you need help with literature analysis, creative writing, grammar, or exam techniques for your English GCSE?";
    } else if (lowerMessage.includes('help') || lowerMessage.includes('stuck')) {
      return "I'm here to help! What specific topic or problem are you struggling with? The more details you give me, the better I can assist you.";
    } else {
      return "That's a great question! To give you the best help, could you tell me which subject and specific topic you're working on? I can provide explanations, examples, and practice materials.";
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
    setIsMinimized(false);
  };

  const handleBlur = () => {
    if (!isTyping && message.length === 0) {
      setIsExpanded(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized && message.length === 0 && !isTyping) {
      setIsExpanded(false);
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setIsMinimized(false);
    setMessage("");
    setIsTyping(false);
    setScrollOffset(0);
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999]">
      <div
        ref={containerRef}
        className={`relative transition-all duration-700 ease-out ${
          isExpanded ? 'w-[25vw] max-w-[500px] min-w-[350px]' : 'w-12 h-12'
        } ${isMinimized ? 'w-16 h-12' : ''}`}
        style={{
          transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`,
        }}
      >
        {/* Chat Messages - Elegant floating bubbles */}
        {isExpanded && (
          <div
            ref={scrollContainerRef}
            className="absolute bottom-full mb-2 w-full h-[400px] pointer-events-auto overflow-hidden"
          >
            <div
              className="relative h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateY(${scrollOffset}px)` }}
            >
              {messages.map((msg, index) => {
                const age = messages.length - index - 1;
                const maxAge = 6;
                const ageRatio = Math.min(age / maxAge, 1);

                // Calculate opacity and scale based on age
                const opacity = Math.max(0.1, 1 - (ageRatio * 0.7));
                const scale = Math.max(0.85, 1 - (ageRatio * 0.15));

                // Position bubbles in a flowing pattern
                const baseY = 40 + (index * 55);
                const flowOffset = Math.sin(index * 0.8) * 15;
                const yOffset = baseY + flowOffset;

                // Calculate fade-out effect
                const fadeStart = 250;
                const fadeDistance = Math.max(0, yOffset - fadeStart);
                const fadeOpacity = Math.max(0, 1 - (fadeDistance / 100));

                return (
                  <div
                    key={msg.id}
                    className={`absolute transition-all duration-1000 ease-out ${
                      msg.sender === 'user' ? 'right-4' : 'left-4'
                    }`}
                    style={{
                      bottom: `${yOffset}px`,
                      opacity: opacity * fadeOpacity,
                      transform: `scale(${scale}) translateY(${fadeDistance * 2}px)`,
                      filter: `blur(${Math.max(0, fadeDistance * 0.008)}px)`,
                    }}
                  >
                    <div
                      className="relative inline-block max-w-[320px] px-5 py-3 text-sm leading-relaxed font-medium"
                    >
                      {/* Glass bubble background */}
                      <div
                        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/25 via-white/20 to-white/15 backdrop-blur-xl border border-white/40"
                        style={{
                          backdropFilter: 'blur(20px) saturate(150%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                        }}
                      />

                      {/* Enhanced frosted shimmer effect */}
                      <div
                        className="absolute inset-0 rounded-3xl opacity-40"
                        style={{
                          background: 'linear-gradient(135deg, transparent 10%, rgba(255, 255, 255, 0.4) 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                          backgroundSize: '300% 300%',
                          animation: `shimmer ${3 + index * 0.2}s ease-in-out infinite`,
                        }}
                      />

                      {/* Multiple inner glow layers for depth */}
                      <div
                        className="absolute inset-0 rounded-3xl opacity-60"
                        style={{
                          background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6), transparent 50%)',
                        }}
                      />
                      <div
                        className="absolute inset-0 rounded-3xl opacity-30"
                        style={{
                          background: 'radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.3), transparent 60%)',
                        }}
                      />

                      {/* Frosted texture overlay */}
                      <div
                        className="absolute inset-0 rounded-3xl opacity-20"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width="40" height="40" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence baseFrequency="0.9" /%3E%3CfeColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.1 0"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" /%3E%3C/svg%3E")`,
                          backgroundSize: '40px 40px',
                        }}
                      />

                      <span className="relative z-10 text-foreground font-medium">{msg.text}</span>
                    </div>
                  </div>
                );
              })}

              {/* Scroll indicators */}
              {messages.length > 6 && (
                <>
                  <div className="absolute top-2 right-2 z-20">
                    <div className="w-8 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/60 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (1 - scrollOffset / Math.max(1, (messages.length - 6) * 55)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-20">
                    <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                    <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                    <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                  </div>
                </>
              )}

              {/* Typing indicator */}
              {isPalTyping && (
                <div
                  className="absolute left-4 transition-all duration-500 ease-out"
                  style={{
                    bottom: `${40 + (messages.length * 55)}px`,
                    opacity: 0.95,
                    transform: 'scale(1)',
                  }}
                >
                  <div
                    className="relative inline-block px-5 py-3 rounded-3xl rounded-bl-2xl"
                  >
                    {/* Frosted glass bubble background */}
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/20 to-white/15 backdrop-blur-xl border border-white/40"
                      style={{
                        backdropFilter: 'blur(20px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      }}
                    />

                    {/* Enhanced frosted shimmer effect */}
                    <div
                      className="absolute inset-0 rounded-3xl opacity-40"
                      style={{
                        background: 'linear-gradient(135deg, transparent 10%, rgba(255, 255, 255, 0.4) 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                        backgroundSize: '300% 300%',
                        animation: 'shimmer 3s ease-in-out infinite',
                      }}
                    />

                    {/* Multiple inner glow layers for depth */}
                    <div
                      className="absolute inset-0 rounded-3xl opacity-60"
                      style={{
                        background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6), transparent 50%)',
                      }}
                    />
                    <div
                      className="absolute inset-0 rounded-3xl opacity-30"
                      style={{
                        background: 'radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.3), transparent 60%)',
                      }}
                    />

                    {/* Frosted texture overlay */}
                    <div
                      className="absolute inset-0 rounded-3xl opacity-20"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width="40" height="40" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence baseFrequency="0.9" /%3E%3CfeColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.1 0"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" /%3E%3C/svg%3E")`,
                        backgroundSize: '40px 40px',
                      }}
                    />

                    <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 bg-foreground/80 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2.5 h-2.5 bg-foreground/80 rounded-full animate-bounce" style={{ animationDelay: '160ms' }}></div>
                      <div className="w-2.5 h-2.5 bg-foreground/80 rounded-full animate-bounce" style={{ animationDelay: '320ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Controls - Elegant floating buttons */}
        {isExpanded && (
          <div className="absolute bottom-full mb-4 right-2 flex gap-2">
            <Button
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-foreground/70 hover:text-foreground p-2.5 h-7 w-7 rounded-full border border-white/25 backdrop-blur-sm transform hover:scale-110 transition-all duration-300 shadow-lg"
              onClick={toggleMinimize}
              style={{
                backdropFilter: 'blur(8px) saturate(150%)',
                WebkitBackdropFilter: 'blur(8px) saturate(150%)',
              }}
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-foreground/70 hover:text-foreground p-2.5 h-7 w-7 rounded-full border border-white/25 backdrop-blur-sm transform hover:scale-110 transition-all duration-300 shadow-lg"
              onClick={handleClose}
              style={{
                backdropFilter: 'blur(8px) saturate(150%)',
                WebkitBackdropFilter: 'blur(8px) saturate(150%)',
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Input Bar */}
        <div
          className={`relative flex items-center gap-2 transition-all duration-700 ease-out ${
            isExpanded ? 'px-4 py-3' : isMinimized ? 'px-3 py-3 justify-center' : 'px-3 py-3 justify-center'
          }`}
        >
          {/* Liquid glass background */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-700 ease-out ${
              isExpanded
                ? 'bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20'
                : 'bg-gradient-to-br from-blue-400/15 via-purple-400/15 to-pink-400/15'
            }`}
            style={{
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              background: isExpanded
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.08) 50%, rgba(236, 72, 153, 0.08) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: isExpanded
                ? '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                : '0 4px 16px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              transform: `perspective(1000px) rotateX(${mousePosition.y * 0.5}deg) rotateY(${mousePosition.x * 0.5}deg)`,
            }}
          >
            {/* Animated shimmer effect */}
            <div
              className="absolute inset-0 rounded-full opacity-60"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.3) 50%, transparent 60%)',
                backgroundSize: '200% 200%',
                animation: 'shimmer 3s ease-in-out infinite',
              }}
            />
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <>
              {/* Input field */}
              <input
                type="text"
                value={message}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Ask me anything about your GCSEs..."
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-foreground/40 text-foreground/90 relative z-10"
              />
            </>
          )}

          {/* Action button */}
          <Button
            size="sm"
            className={`relative z-10 transition-all duration-300 ${
              isTyping
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white p-2 h-8 w-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-white/10 hover:bg-white/20 text-foreground/80 hover:text-foreground p-2 h-8 w-8 rounded-full border border-white/20 backdrop-blur-sm transform hover:scale-105'
            }`}
            onClick={isTyping ? sendMessage : handleFocus}
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            {isTyping ? (
              <Send className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Unread indicator */}
        {!isExpanded && messages.length > 1 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
        )}
      </div>

      {/* Add custom styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default FluidGlass;