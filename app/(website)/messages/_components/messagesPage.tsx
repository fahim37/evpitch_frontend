"use client";

import { useState, useEffect } from "react";
import { MessageSidebar } from "@/components/messaging/message-sidebar";
import { ChatArea } from "@/components/messaging/chat-area";
import { useSocket } from "@/hooks/use-socket";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

const queryClient = new QueryClient();

export default function MessagingPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <MessagingContent />
    </QueryClientProvider>
  );
}

function MessagingContent() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomAvatarUrl, setRoomAvatarUrl] = useState<string | undefined>();
  const { data: session } = useSession();
  const socket = useSocket();

  const searchParams = useSearchParams();
  const router = useRouter();

  const MyId = session?.user.id;
  const MyRole = session?.user.role;

  // Honor ?roomId=... on load / change
  useEffect(() => {
    const qRoomId = searchParams.get("roomId");
    if (qRoomId && qRoomId !== selectedRoomId) {
      setSelectedRoomId(qRoomId);
    }
    if (!qRoomId && selectedRoomId) {
      setSelectedRoomId(null);
      setRoomName("");
      setRoomAvatarUrl(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Join personal notification room for socket notifications
  useEffect(() => {
    if (socket && MyId) {
      socket.emit("joinNotification", MyId);
    }
  }, [socket, MyId]);

  // Mobile check
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleRoomSelect = (roomId: string, name: string, avatarUrl?: string) => {
    setSelectedRoomId(roomId);
    setRoomName(name || "");
    setRoomAvatarUrl(avatarUrl);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("roomId", roomId);
    router.replace(`?${params.toString()}`);
  };

  const handleBackToList = () => {
    setSelectedRoomId(null);
    setRoomName("");
    setRoomAvatarUrl(undefined);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.delete("roomId");
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="flex h-screen bg-gray-50 container">
      {/* Sidebar */}
      <div
        className={`${
          isMobileView ? (selectedRoomId ? "hidden" : "w-full") : "w-52 lg:w-80 border-r"
        } bg-white`}
      >
        <MessageSidebar
          selectedRoomId={selectedRoomId}
          onRoomSelect={handleRoomSelect} // (roomId, roomName, avatarUrl?)
          userId={MyId}
          roomName={roomName}
          userRole={MyRole}
        />
      </div>

      {/* Chat */}
      <div className={`${isMobileView ? (selectedRoomId ? "w-full" : "hidden") : "flex-1"}`}>
        {selectedRoomId ? (
          <ChatArea
            roomId={selectedRoomId}
            userRole={MyRole}
            userId={MyId}
            socket={socket ?? undefined}
            onBackToList={isMobileView ? handleBackToList : undefined}
            roomName={roomName}
            // roomUserId ={_id}
            roomAvatarUrl={roomAvatarUrl} // header avatar
          />
        ) : (
          !isMobileView && (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a conversation to start messaging
            </div>
          )
        )}
      </div>
    </div>
  );
}
