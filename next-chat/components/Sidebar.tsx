"use client"
import { Plus, MessageSquare, User, X } from "lucide-react"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  return (
    <>
      {/* Mobile Backdrop - Closes on click */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity md:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 md:relative md:z-auto
          bg-[#171717] transition-all duration-300 ease-in-out border-r border-white/10
          flex flex-col overflow-hidden
          ${isOpen ? "w-[260px] translate-x-0" : "w-0 -translate-x-full md:translate-x-0"}
        `}
      >
        <div className="w-[260px] h-full flex flex-col p-3">
          {/* MOBILE ONLY: Header with Close Button */}
          <div className="flex items-center justify-between mb-2 md:hidden">
            <span className="text-xs font-bold text-gray-500 px-2 uppercase tracking-widest">
              Menu
            </span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* New Chat Button */}
          <button className="flex items-center gap-3 w-full border border-white/20 rounded-lg p-3 hover:bg-white/5 transition text-sm mb-4">
            <Plus size={16} /> <span className="font-medium">New Chat</span>
          </button>

          {/* Chat History List */}
          <div className="flex-1 overflow-y-auto space-y-1">
            <div className="text-[11px] font-semibold text-gray-500 px-2 py-2 uppercase tracking-wider">
              Recent
            </div>
            {["Project Ideas", "Code Refactor", "Trip Planning"].map(
              (item, i) => (
                <button
                  key={i}
                  className="flex items-center gap-3 w-full p-3 text-sm hover:bg-[#2f2f2f] rounded-lg transition text-left group"
                >
                  <MessageSquare size={16} className="text-gray-400" />
                  <span className="truncate flex-1">{item}</span>
                </button>
              ),
            )}
          </div>

          {/* User Profile / Settings */}
          <div className="pt-2 border-t border-white/10">
            <button className="flex items-center gap-3 w-full p-3 text-sm hover:bg-[#2f2f2f] rounded-lg transition">
              <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold">
                JD
              </div>
              <span className="font-medium">John Doe</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
