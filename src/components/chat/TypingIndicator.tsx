export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="3" />
        </svg>
      </div>
      <div className="glass-card rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
