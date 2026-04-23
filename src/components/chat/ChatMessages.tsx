import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessageItem } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { ChatWelcome } from "./ChatWelcome";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  onSuggestion?: (text: string) => void;
}

export function ChatMessages({ messages, isTyping, onSuggestion }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex">
        <ChatWelcome onSuggestion={onSuggestion} />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4 pb-4">
        {messages.map((msg) => (
          <ChatMessageItem
            key={msg.id}
            id={msg.id}
            role={msg.role as "user" | "assistant" | "system"}
            content={msg.content}
            timestamp={msg.created_at}
          />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
