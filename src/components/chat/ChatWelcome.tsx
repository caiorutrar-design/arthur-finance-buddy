import { Bot, MessageSquare } from "lucide-react";

interface ChatWelcomeProps {
  onSuggestion?: (text: string) => void;
}

const SUGGESTIONS = [
  { label: "Resumo dos meus gastos", query: "Me dá um resumo dos meus gastos esse mês" },
  { label: "Como está minha reserva?", query: "Como está minha reserva de emergência?" },
  { label: "Metas de economia", query: "Quais são minhas metas e como estou?" },
  { label: "Alerta de orçamento", query: "Tem alguma categoria que ultrapassou o orçamento?" },
];

export function ChatWelcome({ onSuggestion }: ChatWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
      <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
        <Bot className="h-8 w-8 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="font-heading font-bold text-xl text-foreground">Arthur</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Olá! Sou seu assistente financeiro pessoal. Pergunte sobre seus gastos, metas,
          orçamentos ou qualquer dúvida sobre suas finanças.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => onSuggestion?.(s.query)}
            className="flex items-center gap-2 text-left px-3 py-2 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors text-xs text-foreground"
          >
            <MessageSquare className="h-3 w-3 text-primary flex-shrink-0" />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
