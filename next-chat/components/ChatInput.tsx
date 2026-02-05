"use client"
import { Send, ArrowUp } from "lucide-react"

interface ChatInputProps {
  input: string
  setInput: (val: string) => void
  onSend: () => void
  disabled: boolean
}

export const ChatInput = ({
  input,
  setInput,
  onSend,
  disabled,
}: ChatInputProps) => {
  return (
    <div className="w-full bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pt-4 pb-6 px-4">
      <div className="max-w-3xl mx-auto relative group">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !e.shiftKey && (e.preventDefault(), onSend())
          }
          placeholder="Message ChatGPT..."
          className="w-full bg-[#2f2f2f] text-white rounded-2xl py-4 pl-4 pr-14 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none shadow-2xl transition-all"
        />
        <button
          onClick={onSend}
          disabled={disabled}
          className={`absolute right-3 top-2 p-2 rounded-xl transition-all ${
            input.trim()
              ? "bg-white text-black scale-100"
              : "bg-white/10 text-gray-500 scale-90"
          }`}
        >
          <ArrowUp size={20} strokeWidth={3} />
        </button>
      </div>
      <p className="text-center text-[11px] text-gray-500 mt-3">
        MyGPT can make mistakes. Check important info.
      </p>
    </div>
  )
}
