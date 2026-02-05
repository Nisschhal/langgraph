"use client"
import { PanelLeftOpen, PanelLeftClose, Menu } from "lucide-react"

interface HeaderProps {
  isSidebarOpen: boolean
  setSidebarOpen: (val: boolean) => void
}

export const Header = ({ isSidebarOpen, setSidebarOpen }: HeaderProps) => {
  return (
    <header className="h-14 flex items-center px-4 justify-between border-b border-white/5 bg-[#212121]/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-2">
        {/* Desktop Toggle */}
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="hidden md:flex p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white"
        >
          {isSidebarOpen ? (
            <PanelLeftClose size={20} />
          ) : (
            <PanelLeftOpen size={20} />
          )}
        </button>

        {/* Mobile Menu */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden p-2 hover:bg-white/10 rounded-lg transition"
        >
          <Menu size={20} />
        </button>
      </div>
      <div className="text-sm font-medium opacity-80">MyGPT 1.0</div>
      <div className="w-10" /> {/* Spacer */}
    </header>
  )
}
