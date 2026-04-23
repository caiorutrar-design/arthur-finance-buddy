import { useAuth } from "@/hooks/useAuth";
import { ChatContainer } from "@/components/chat/ChatContainer";

const Chat = () => {
  const { profile } = useAuth();

  if (!profile?.id) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <ChatContainer
        userId={profile.id}
        onToggleSidebar={() => {}}
        sidebarOpen={true}
      />
    </div>
  );
};

export default Chat;
