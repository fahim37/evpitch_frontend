
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "./messaging";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
}: MessageBubbleProps) {
  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-US", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const renderFilePreview = (file: { filename: string; url: string }) => {
    const ext = file.filename.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || ""))
      return (
        <img
          src={file.url || "/placeholder.svg"}
          alt={file.filename}
          className="max-w-[200px] sm:max-w-xs max-h-48 rounded-lg cursor-pointer hover:opacity-90"
          onClick={() => window.open(file.url, "_blank")}
        />
      );
    if (["mp4", "mov", "avi", "webm", "mkv"].includes(ext || "")) {
      return (
        <video
          src={file.url}
          controls
          className="max-w-[200px] sm:max-w-xs max-h-48 rounded-lg"
        />
      );
    }
    return (
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
      >
        <span className="font-medium truncate max-w-[150px]">
          {file.filename}
        </span>
      </a>
    );
  };

  // Derive per-message avatar for inbound bubbles
  const perMessageAvatar =
    typeof message.userId === "string"
      ? undefined
      : message.userId?.avatar?.url;

  // Check if the message contains any emoji using Unicode regex
  const containsEmoji = (text: string) => {
    return /[\p{Emoji}]/u.test(text);
  };

  // Determine if background color should be applied (exclude for messages with emojis)
  const shouldApplyBackground = !containsEmoji(message.message || "");

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex max-w-[85%] sm:max-w-xs lg:max-w-md",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}
      >
        {showAvatar && !isOwn && (
          <Avatar className="w-8 h-8 mt-1 flex-shrink-0">
            <AvatarImage
              src={
                perMessageAvatar || "/placeholder.svg?height=32&width=32&text=U"
              }
            />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        )}

        <div
          className={cn(
            "mx-2",
            showAvatar && !isOwn && "ml-2",
            showAvatar && isOwn && "mr-2"
          )}
        >
          <div className="group relative">
            <div
              className={cn(
                "px-3 py-2 md:px-4 md:py-2 rounded-2xl break-words",
                shouldApplyBackground &&
                  (isOwn ? "bg-primary text-white" : "bg-gray-200 text-gray-900")
              )}
            >
              <>
                {message.message && (
                  <p className="text-sm whitespace-pre-wrap">
                    {message.message}
                  </p>
                )}
                {message.file && message.file.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.file.map((file, index) => (
                      <div key={index}>{renderFilePreview(file)}</div>
                    ))}
                  </div>
                )}
              </>
            </div>
          </div>

          <div
            className={cn(
              "text-xs text-gray-500 mt-1",
              isOwn ? "text-right" : "text-left"
            )}
          >
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}