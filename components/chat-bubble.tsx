import type { Message } from "./chat-interface";

export function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-3xl px-5 py-3 text-sm leading-relaxed shadow-sm backdrop-blur-md ${
          isUser
            ? "bg-white/15 text-white"
            : "border border-white/10 bg-black/40 text-white"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
