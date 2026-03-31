import { useState, useRef, useEffect } from "react";
import { Send, PanelLeftClose, PanelLeft, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "arthur";
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "arthur",
  content:
    "Fala! 👋 Sou o **Arthur**, seu consultor financeiro.\n\nAnalisei seus dados recentes e tenho algumas observações:\n\n- 🔴 **Delivery** ultrapassou o limite de R$ 500 — você já gastou **R$ 680**\n- 🟡 **Mercado** está em **83%** do limite (R$ 1.240 de R$ 1.500)\n- ✅ **Transporte** tranquilo, só **53%** usado\n\nSua meta de **Viagem Europa** está em 34%. Pra chegar lá até Dez/2025, precisa poupar ~**R$ 1.833/mês**.\n\nComo posso te ajudar hoje?",
  timestamp: new Date(),
};

const SAMPLE_RESPONSES: Record<string, string> = {
  default:
    "Entendi! Me passa mais detalhes pra eu fazer uma análise mais precisa. Se quiser, posso olhar seus gastos por categoria ou calcular quanto precisa poupar pra alguma meta específica.",
  gasto:
    "📊 Olhando seus gastos desse mês:\n\n| Categoria | Gasto | Limite | Status |\n|-----------|-------|--------|--------|\n| Mercado | R$ 1.240 | R$ 1.500 | 🟡 83% |\n| Delivery | R$ 680 | R$ 500 | 🔴 136% |\n| Transporte | R$ 320 | R$ 600 | ✅ 53% |\n| Cartão | R$ 2.100 | R$ 3.000 | ✅ 70% |\n\n**Total:** R$ 4.340\n\nO **Delivery** é o ponto crítico. Quer que eu sugira um plano pra reduzir?",
  viagem:
    "✈️ **Planejamento: Viagem Europa**\n\n- **Meta:** R$ 25.000\n- **Acumulado:** R$ 8.500 (34%)\n- **Falta:** R$ 16.500\n- **Prazo:** Dez/2025 (~9 meses)\n- **Poupar/mês:** ~R$ 1.833\n\nCom seu saldo atual de **R$ 4.230** e gastos fixos de ~**R$ 4.340/mês**, fica apertado. Sugiro:\n\n1. Cortar **Delivery** pra R$ 300 → economiza **R$ 380/mês**\n2. Investir a reserva em **CDB 100% CDI** → rende ~R$ 120/mês\n3. Considerar renda extra ou ajustar o prazo\n\nQuer que eu detalhe alguma dessas opções?",
  reserva:
    "🛡️ **Reserva de Emergência**\n\nSua meta é **R$ 18.000** e você tem **R$ 12.000** (67%).\n\nFaltam **R$ 6.000**. Se poupar **R$ 1.000/mês**, chega lá em **Jun/2025** — dentro do prazo!\n\n⚠️ **Prioridade:** Recomendo completar a reserva **antes** de acelerar a meta da viagem. Imprevistos acontecem e a reserva é seu colchão de segurança.\n\nDepois que completar, o valor que ia pra reserva pode ir direto pra viagem. 🎯",
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("gasto") || lower.includes("extrato") || lower.includes("categoria")) return SAMPLE_RESPONSES.gasto;
  if (lower.includes("viagem") || lower.includes("europa") || lower.includes("poupar")) return SAMPLE_RESPONSES.viagem;
  if (lower.includes("reserva") || lower.includes("emergência") || lower.includes("emergencia")) return SAMPLE_RESPONSES.reserva;
  return SAMPLE_RESPONSES.default;
}

interface ChatPanelProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function ChatPanel({ onToggleSidebar, sidebarOpen }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: "arthur",
        content: getResponse(userMsg.content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center pulse-glow">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-heading font-semibold text-foreground">Arthur</p>
            <p className="text-xs text-primary">Online</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                msg.role === "arthur" ? "bg-primary/20" : "bg-secondary"
              }`}
            >
              {msg.role === "arthur" ? (
                <Bot className="h-3.5 w-3.5 text-primary" />
              ) : (
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "arthur"
                  ? "glass-card text-foreground rounded-tl-md"
                  : "bg-primary text-primary-foreground rounded-tr-md"
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
                {msg.content}
              </ReactMarkdown>
              <p className="text-[10px] mt-2 opacity-50">
                {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 animate-fade-in">
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="glass-card rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte ao Arthur sobre seus gastos, metas..."
            className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
