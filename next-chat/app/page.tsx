"use client"
import { useState, useRef, useEffect } from "react"
import { Sidebar } from "../components/Sidebar"
import { Header } from "../components/Header"
import { ChatInput } from "../components/ChatInput"
import { MessageItem } from "@/components/MessageItem"

interface Message {
  id: string | number
  role: "user" | "assistant"
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "assistant", content: "Hello! How can I help you today?" },
  ])
  const [input, setInput] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottom = useRef(true) // Track if user is at the bottom

  // --- 1. SMART SCROLL SENSOR ---
  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current

    // If user is within 100px of the bottom, we consider them "At Bottom"
    const distanceToBottom = scrollHeight - scrollTop - clientHeight
    isAtBottom.current = distanceToBottom < 100
  }

  // --- 2. AUTO-SCROLL LOGIC ---
  useEffect(() => {
    // ONLY scroll if the user was already at the bottom
    if (isAtBottom.current && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "auto", // Use "auto" for instant updates during typing
      })
    }
  }, [messages])

  // --- 3. SMOOTH STREAMING LOGIC ---
  const [streamingBuffer, setStreamingBuffer] = useState("")
  const [activeAssistantId, setActiveAssistantId] = useState<
    string | number | null
  >(null)

  useEffect(() => {
    if (streamingBuffer.length > 0 && activeAssistantId) {
      const timeout = setTimeout(() => {
        const charToType = streamingBuffer.charAt(0)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === activeAssistantId
              ? { ...msg, content: msg.content + charToType }
              : msg,
          ),
        )
        setStreamingBuffer((prev) => prev.substring(1))
      }, 10) // Speed up slightly for better feel

      return () => clearTimeout(timeout)
    }
  }, [streamingBuffer, activeAssistantId])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input,
    }
    const assistantId = Date.now() + 1

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", content: "" },
    ])
    setActiveAssistantId(assistantId)

    // Force scroll to bottom when user sends a new message
    isAtBottom.current = true

    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, threadId: "user-123" }),
      })

      if (!response.body) throw new Error("No response body")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n\n")

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.replace("data: ", "")

          if (data === "[DONE]") break

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === "token") {
              setStreamingBuffer((prev) => prev + parsed.content)
            }
          } catch (e) {
            console.warn("Parse error")
          }
        }
      }
    } catch (error) {
      console.error(error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (streamingBuffer.length === 0 && isLoading) {
      const t = setTimeout(() => setIsLoading(false), 500)
      return () => clearTimeout(t)
    }
  }, [streamingBuffer, isLoading])

  return (
    <div className="flex h-screen bg-[#212121] text-[#ececf1] overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Header
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setIsSidebarOpen}
        />

        {/* ON SCROLL: Detect if user is moving away from the bottom */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto pb-10 scroll-smooth"
        >
          {messages.map((msg) => (
            <MessageItem key={msg.id} msg={msg} />
          ))}

          {isLoading &&
            streamingBuffer.length === 0 &&
            messages[messages.length - 1].content === "" && (
              <div className="p-4 text-gray-500 text-sm animate-pulse max-w-3xl mx-auto flex gap-2 items-center">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                Thinking...
              </div>
            )}
        </div>

        <ChatInput
          input={input}
          setInput={setInput}
          onSend={handleSend}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}
