"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "../ui/button";
import { useSocket } from "@/hooks/use-socket";

interface SideUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: { url?: string };
}

interface MessageRoom {
  _id: string;
  userId: SideUser;
  recruiterId?: SideUser;
  companyId?: SideUser;
  messageAccepted: boolean;
  lastMessage: string;
  lastMessageSender?: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageSidebarProps {
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string, roomName: string, avatarUrl?: string) => void;
  userId?: string;
  userRole?: string;
  roomName?: string;
}

export function MessageSidebar({
  selectedRoomId,
  roomName,
  onRoomSelect,
  userId,
  userRole,
}: MessageSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data: rooms = [], isLoading } = useQuery<MessageRoom[]>({
    queryKey: ["message-rooms", userId, userRole],
    queryFn: async () => {
      if (!userId || !userRole) return [];
      try {
        const response = await fetch(
          `/api/message-room/get-message-rooms?type=${userRole}&userId=${userId}`
        );
        if (!response.ok) throw new Error("Failed to fetch rooms");
        const data = await response.json();
        return data.success ? (data.data as MessageRoom[]) : [];
      } catch (error) {
        console.error("Error fetching rooms:", error);
        return [];
      }
    },
    enabled: !!userId && !!userRole,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!selectedRoomId || roomName) return;
    const room = rooms.find((r) => r._id === selectedRoomId);
    if (room && userId) {
      const otherUser =
        room.userId._id === userId
          ? room.recruiterId || room.companyId
          : room.userId;
      if (otherUser) {
        onRoomSelect(selectedRoomId, otherUser.name, otherUser?.avatar?.url);
      }
    }
  }, [rooms, selectedRoomId, roomName, userId, onRoomSelect]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg: {
      roomId: string;
      message?: string;
      file?: any[];
    }) => {
      queryClient.setQueryData(
        ["message-rooms", userId, userRole],
        (old: MessageRoom[] | undefined) => {
          if (!old) return old;
          const idx = old.findIndex((r) => r._id === msg.roomId);
          if (idx === -1) return old;
          const updated = [...old];
          const lastMessage =
            msg.message && msg.message.trim().length > 0
              ? msg.message
              : "📎 Attachment";
          updated[idx] = {
            ...updated[idx],
            lastMessage,
            updatedAt: new Date().toISOString(),
          };
          const [room] = updated.splice(idx, 1);
          updated.unshift(room);
          return updated;
        }
      );
    };
    socket.on("newMessage", handleNewMessage);
    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, queryClient, userId, userRole]);

  const filteredRooms =
    rooms?.filter((room: MessageRoom) => {
      const otherUser =
        room?.userId?._id === userId
          ? room.recruiterId || room.companyId
          : room.userId;
      return otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }) || [];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (filteredRooms.length === 0) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">Messaging</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-gray-500">No messages found</p>
          <div>
            <Link href="/alljobs">
              <Button className="bg-[#007bff] hover:bg-[#0069d9] text-white px-6 py-3 rounded-md text-base">
                Return To Jobs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-xl font-semibold mb-4">Messaging</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredRooms.map((room: MessageRoom) => {
          const otherUser =
            room.userId._id === userId
              ? room.recruiterId || room.companyId || ({} as SideUser)
              : room.userId;
          const isSelected = selectedRoomId === room._id;

          return (
            <div
              key={room._id}
              onClick={() =>
                otherUser.name &&
                onRoomSelect(room._id, otherUser.name, otherUser?.avatar?.url)
              }
              className={cn(
                "flex items-center p-4 cursor-pointer border-b transition-colors active:bg-gray-100",
                "hover:bg-gray-50",
                isSelected && "bg-blue-50 md:border-r-2 md:border-r-blue-500"
              )}
            >
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage
                    src={
                      otherUser?.avatar?.url ||
                      `/placeholder.svg?height=48&width=48&text=${
                        otherUser.name?.charAt(0) || "U"
                      }`
                    }
                  />
                </Avatar>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>

              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 truncate">
                    {otherUser.name || "Unknown User"}
                  </h3>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatTime(room.updatedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-600 truncate pr-2">
                    {room.lastMessage || "No messages yet"}
                  </p>
                  {(otherUser.role === "recruiter" ||
                    otherUser.role === "company") && (
                    <Badge
                      variant="secondary"
                      className="text-xs flex-shrink-0"
                    >
                      {otherUser.role.charAt(0).toUpperCase() + otherUser.role.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
