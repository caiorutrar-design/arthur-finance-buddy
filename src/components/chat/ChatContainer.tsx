import { useState } from "react";
import { PanelLeftClose, PanelLeft, Bot, Plus, Trash2, MessageSquare } from "lucide-react";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { useConversations, useChatMessages, useSendMessage, useCreateConversation, useDeleteConversation } from "@/hooks/useChat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatContainerProps {
  userId: string;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function ChatContainer({ userId, onToggleSidebar, sidebarOpen }: ChatContainerProps) {
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();

  const { data: conversations = [], isLoading: loadingConvs } = useConversations(userId);
  const { data: messages = [], isLoading: loadingMsgs } = useChatMessages(activeConversationId);
  const sendMessage = useSendMessage();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();

  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (message: string) => {
    setIsTyping(true);
    try {
      const result = await sendMessage.mutateAsync({
        userId,
        message,
        conversationId: activeConversationId,
      });

      if (!activeConversationId && result.conversation_id) {
        setActiveConversationId(result.conversation_id);
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const conv = await createConversation.mutateAsync({ userId });
      setActiveConversationId(conv.id);
    } catch (err) {
      console.error("Erro ao criar conversa:", err);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation.mutateAsync(id);
    if (activeConversationId === id) {
      setActiveConversationId(undefined);
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar - Conversation List */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 overflow-hidden border-r border-border flex-shrink-0 flex flex-col`}
      >
        <div className="w-64 flex flex-col h-full">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversas</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleNewConversation}
              title="Nova conversa"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    activeConversationId === conv.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0" onClick={() => setActiveConversationId(conv.id)}>
                    <p className="text-xs font-medium truncate">{conv.title || "Nova conversa"}</p>
                    <p className="text-[10px] opacity-60">
                      {format(new Date(conv.updated_at), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              ))}

              {conversations.length === 0 && !loadingConvs && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma conversa ainda.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-heading font-semibold text-foreground">Arthur</p>
              <p className="text-xs text-primary">Online</p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <ChatMessages
          messages={messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
            created_at: m.created_at,
          }))}
          isTyping={isTyping}
          onSuggestion={handleSend}
        />

        {/* Input */}
        <div className="p-4 border-t border-border">
          <ChatInput onSend={handleSend} disabled={isTyping} />
        </div>
      </div>
    </div>
  );
}
