"use client"

import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { useSocket } from "@/hooks/use-socket"

interface Notification {
  _id: string
  message: string
  createdAt?: string
  isViewed: boolean
  type?: string
  to?: string
  id?: string
}

interface ApiResponse {
  success: boolean
  message: string
  data: Notification[]
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const queryClient = useQueryClient()
  const socket = useSocket()
  const [liveUnreadCount, setLiveUnreadCount] = useState<number | null>(null)

  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
  } = useQuery<Notification[], Error>({
    queryKey: ["notifications", userId],
    queryFn: async (): Promise<Notification[]> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/notifications/${userId}`,
        {
          headers: { "Content-Type": "application/json" },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse = await response.json()
      if (result.success) {
        return result.data
      } else {
        throw new Error(result.message || "Failed to fetch notifications.")
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const unreadCountFromData = useMemo(
    () => notifications.filter((n) => !n.isViewed).length,
    [notifications]
  )
  const unreadCount = liveUnreadCount ?? unreadCountFromData

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket || !userId) return

    socket.emit("joinNotification", userId)

    const handleNewNotification = (payload: any) => {
      const incoming =
        payload?.notification || payload?.n || payload?.notificationDoc || payload

      if (!incoming?._id && !incoming?.id && !incoming?._id) return

      const normalizedId = incoming._id || incoming.id
      const normalized: Notification = {
        _id: normalizedId,
        message: incoming.message ?? "",
        isViewed: Boolean(incoming.isViewed === true),
        createdAt: incoming.createdAt,
        type: incoming.type,
        to: incoming.to,
        id: incoming.id,
      }

      setLiveUnreadCount((prev) => {
        if (typeof payload?.count === "number") return payload.count
        if (typeof prev === "number") return prev + (normalized.isViewed ? 0 : 1)
        return null
      })

      queryClient.setQueryData<Notification[]>(["notifications", userId], (old = []) => {
        const alreadyExists = old.some((n) => n._id === normalized._id)
        if (alreadyExists) return old
        return [normalized, ...old]
      })
    }

    const handleCountUpdate = (payload: any) => {
      if (typeof payload?.count === "number") {
        setLiveUnreadCount(payload.count)
      }
    }

    socket.on("newNotification", handleNewNotification)
    socket.on("notificationCountUpdated", handleCountUpdate)

    return () => {
      socket.off("newNotification", handleNewNotification)
      socket.off("notificationCountUpdated", handleCountUpdate)
    }
  }, [socket, userId, queryClient])

  const markAllAsReadMutation = useMutation<
    { unreadCount: number },
    Error,
    void,
    { previousNotifications?: Notification[] }
  >({
    mutationFn: async () => {
      if (!userId) throw new Error("User not found")

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/notifications/read/${userId}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" } }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse & { unreadCount?: number } = await response.json()
      if (!result.success) {
        throw new Error(result.message || "Failed to mark notifications as read.")
      }

      return { unreadCount: result.unreadCount ?? 0 }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications", userId] })
      const previousNotifications = queryClient.getQueryData<Notification[]>(["notifications", userId])
      queryClient.setQueryData<Notification[]>(["notifications", userId], (old = []) =>
        old.map((n) => ({ ...n, isViewed: true }))
      )
      setLiveUnreadCount(0)
      return { previousNotifications }
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(["notifications", userId], context?.previousNotifications)
      setLiveUnreadCount(unreadCountFromData)
    },
    onSuccess: (data) => {
      setLiveUnreadCount(data.unreadCount ?? 0)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] })
    },
  })

  const markSingleAsRead = useMutation<
    { unreadCount?: number },
    Error,
    string,
    { previousNotifications?: Notification[] }
  >({
    mutationFn: async (notificationId: string) => {
      if (!userId) throw new Error("User not found")

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/notifications/${userId}/read/${notificationId}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" } }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse & { unreadCount?: number } = await response.json()
      if (!result.success) {
        throw new Error(result.message || "Failed to mark notification as read.")
      }

      return { unreadCount: result.unreadCount }
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", userId] })
      const previousNotifications = queryClient.getQueryData<Notification[]>(["notifications", userId])
      queryClient.setQueryData<Notification[]>(["notifications", userId], (old = []) =>
        old.map((n) => (n._id === notificationId ? { ...n, isViewed: true } : n))
      )
      setLiveUnreadCount((prev) => (typeof prev === "number" ? Math.max(prev - 1, 0) : prev))
      return { previousNotifications }
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(["notifications", userId], context?.previousNotifications)
      setLiveUnreadCount(unreadCountFromData)
    },
    onSuccess: (data) => {
      if (typeof data.unreadCount === "number") {
        setLiveUnreadCount(data.unreadCount)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] })
    },
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const renderMessage = (message: string) => {
    const parts = message.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      ) : (
        part
      )
    )
  }

  return (
    <div className="container mx-auto py-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          Notification
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {unreadCount}
          </span>
        </h1>
        <button
          className={cn(
            "text-sm text-gray-500 hover:text-gray-700",
            markAllAsReadMutation.isPending && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => markAllAsReadMutation.mutate()}
          disabled={markAllAsReadMutation.isPending || unreadCount === 0}
        >
          {markAllAsReadMutation.isPending ? "Marking..." : "Mark As Read"}
        </button>
      </div>

      {isLoading && <div className="text-center text-gray-500">Loading notifications...</div>}
      {isError && <div className="text-center text-red-500">Error: {error?.message}</div>}
      {markAllAsReadMutation.isError && (
        <div className="text-center text-red-500">
          Error marking notifications: {markAllAsReadMutation.error?.message}
        </div>
      )}
      {!isLoading && notifications.length === 0 && !isError && (
        <div className="text-center text-gray-500">No notifications found.</div>
      )}

      <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
        {notifications.map((notification) => (
          <motion.div
            key={notification._id}
            className={cn(
              "flex items-center gap-4 p-3 rounded-lg shadow-sm transition-colors duration-200",
              notification.isViewed ? "bg-white" : "bg-blue-50"
            )}
            variants={itemVariants}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-user"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="flex-grow">
              <p className="text-sm text-gray-800 leading-snug">{renderMessage(notification.message)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {notification.createdAt
                  ? new Date(notification.createdAt).toLocaleString()
                  : "Just now"}
              </p>
            </div>
            {!notification.isViewed && (
              <div className="flex items-center gap-2 ml-auto">
                <button
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                  disabled={markSingleAsRead.isPending}
                  onClick={() => markSingleAsRead.mutate(notification._id)}
                >
                  {markSingleAsRead.isPending ? "Marking..." : "Mark as read"}
                </button>
                <span
                  className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full"
                  aria-label="Unread notification"
                />
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
