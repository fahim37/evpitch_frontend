"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, MessageCircle, X } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  id: string
  text: string
  sender: "bot" | "user"
  timestamp: Date
}

const PRIMARY_COLOR = "#2A80CF"

// ---------- Helpers ----------
const normaliseBaseUrl = (raw?: string | undefined) => {
  if (!raw) return ""
  return raw.replace(/\/+$/, "")
}

const buildChatEndpoint = () => {
  const base =
    normaliseBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL) ||
    normaliseBaseUrl(process.env.NEXT_PUBLIC_BASE_URL)

  if (!base) return "/api/v1/chatbot/chat"
  const hasApiSegment = /\/api\/v\d+/i.test(base)
  return hasApiSegment ? `${base}/chatbot/chat` : `${base}/api/v1/chatbot/chat`
}

// Mobile detection (tailwind sm breakpoint ~640px)
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639.98px)")
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener?.("change", update)
    return () => mq.removeEventListener?.("change", update)
  }, [])
  return isMobile
}

// ---------- Component ----------
export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      text: "Hi there! Ask me anything about Elevator Video Pitch© and I'll guide you.",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const chatEndpoint = useMemo(buildChatEndpoint, [])
  const isMobile = useIsMobile()

  // Auto scroll to bottom on new messages / open
  useEffect(() => {
    if (!isOpen) return
    const container = chatContainerRef.current
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
    }
  }, [messages, isOpen])

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `${Date.now()}`,
      text: input.trim(),
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(chatEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage.text }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const apiMessage =
          typeof payload?.message === "string" ? payload.message : `API error: ${response.status}`
        throw new Error(apiMessage)
      }

      const botResponseText =
        payload?.data?.answer ??
        payload?.message ??
        "I'm not sure about that yet, but I'm learning more every day!"

      const botMessage: Message = {
        id: `${Date.now()}-bot`,
        text: botResponseText,
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send message"
      console.error("[chatbot] API Error:", errorMessage)
      setError(errorMessage)
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          text: "Sorry, I'm having trouble connecting right now. Please try again shortly.",
          sender: "bot",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
      if (isMobile) {
        setTimeout(() => inputRef.current?.scrollIntoView({ block: "nearest" }), 50)
      }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 16 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 24 },
    },
    exit: { opacity: 0, scale: 0.9, y: 16, transition: { duration: 0.18 } },
  }

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  }

  const markdownComponents = useMemo(
    () => ({
      p: ({ children }: { children: React.ReactNode }) => (
        <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
      ),
      strong: ({ children }: { children: React.ReactNode }) => (
        <strong className="font-semibold">{children}</strong>
      ),
      em: ({ children }: { children: React.ReactNode }) => <em className="italic">{children}</em>,
      ul: ({ children }: { children: React.ReactNode }) => (
        <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
      ),
      ol: ({ children }: { children: React.ReactNode }) => (
        <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
      ),
      li: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
      a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline"
          style={{ color: PRIMARY_COLOR }}
        >
          {children}
        </a>
      ),
      br: () => <br />,
    }),
    []
  )

  // Simple size caps
  const PANEL_STYLE: React.CSSProperties = {
    width: "min(24rem, 92vw)",
    height: "min(32rem, 85vh)",
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0.6, rotate: -120 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.6, rotate: 120 }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
            onClick={() => setIsOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-200 hover:shadow-2xl"
            style={{ backgroundColor: PRIMARY_COLOR, color: "white" }}
            aria-label="Open chat"
          >
            <MessageCircle size={22} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Backdrop: click anywhere outside to close */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/20"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
            className="absolute bottom-0 right-0 z-50 flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]"
            style={PANEL_STYLE}
          >
            <div
              className="flex items-center justify-between px-5 py-4 text-white"
              style={{ background: `linear-gradient(135deg, ${PRIMARY_COLOR}, #1f5f9e)` }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                  <MessageCircle size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-wide">Elevator Video Pitch© Assistant</h3>
                  <p className="text-xs text-white/70">Quick answers, Ask your questions.</p>
                </div>
              </div>
              <motion.button
                whileHover={{ rotate: 90, scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-white transition-colors hover:text-white/80"
                aria-label="Close chat"
              >
                <X size={20} />
              </motion.button>
            </div>

            {error && <div className="bg-red-50 px-5 py-2 text-xs text-red-500">{error}</div>}

            <div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      message.sender === "user"
                        ? "rounded-br-md text-white"
                        : "rounded-bl-md text-slate-800"
                    }`}
                    style={
                      message.sender === "user"
                        ? { backgroundColor: PRIMARY_COLOR }
                        : { backgroundColor: "#F1F5F9" }
                    }
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {message.text}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex justify-start"
                >
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-[#F1F5F9] px-4 py-3 text-slate-700 shadow-sm">
                    {[0, 1, 2].map((delay) => (
                      <motion.span
                        key={delay}
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                          duration: 0.7,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: delay * 0.12,
                          ease: "easeInOut",
                        }}
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50/90 px-5 py-4">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your question..."
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#2A80CF]/60 disabled:cursor-not-allowed disabled:bg-slate-100"
                  disabled={isLoading}
                  inputMode="text"
                />
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                  aria-label="Send message"
                >
                  <Send size={18} />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
