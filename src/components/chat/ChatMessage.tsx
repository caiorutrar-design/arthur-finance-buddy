import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatMessageItemProps {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export function ChatMessageItem({ role, content, timestamp, id }: ChatMessageItemProps) {
  const isUser = role === "user";
  const isArthur = role === "assistant";

  return (
    <div
      key={id}
      className={`flex gap-3 animate-fade-in ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
          isArthur ? "bg-primary/20" : "bg-secondary"
        }`}
      >
        {isArthur ? (
          <Bot className="h-3.5 w-3.5 text-primary" />
        ) : (
          <User className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-md"
            : "glass-card text-foreground rounded-tl-md"
        }`}
      >
        <ReactMarkdown
          components={{
            table: ({ children }) => (
              <table className="w-full text-xs my-2 border-collapse">{children}</table>
            ),
            th: ({ children }) => (
              <th className="text-left py-1 px-2 border-b border-border text-muted-foreground font-medium">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="py-1 px-2 border-b border-border/50">{children}</td>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold">{children}</strong>
            ),
            p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
          }}
        >
          {content}
        </ReactMarkdown>
        <p className="text-[10px] mt-2 opacity-50">
          {format(new Date(timestamp), "HH:mm", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}
