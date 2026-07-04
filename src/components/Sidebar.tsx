"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  LayoutDashboard, 
  BookOpen, 
  UploadCloud, 
  HelpCircle, 
  Layers, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeItem: "dashboard" | "learn" | "upload" | "flashcards" | "quizzes" | "settings";
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { id: "learn", label: "Learn Topic", href: "/learn", icon: BookOpen },
    { id: "upload", label: "Upload Content", href: "/upload", icon: UploadCloud },
    { id: "flashcards", label: "Flashcards", href: "/dashboard", icon: Layers }, // Route to dashboard for MVP focus
    { id: "quizzes", label: "Quizzes", href: "/dashboard", icon: HelpCircle },
    { id: "settings", label: "Settings", href: "/dashboard", icon: Settings },
  ];

  return (
    <>
      {/* MOBILE TRIGGER HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 bg-zinc-950 border-b border-white/5 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">AI Accelerator</span>
        </Link>
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1.5 rounded-lg border border-white/5 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            {/* Menu container */}
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-64 bg-zinc-950 border-r border-white/5 z-50 p-6 flex flex-col justify-between md:hidden"
            >
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <Link href="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center">
                      <Sparkles className="h-4.5 w-4.5 text-white" />
                    </div>
                    <span className="font-bold text-sm tracking-tight text-white">AI Accelerator</span>
                  </Link>
                  <button 
                    onClick={() => setIsMobileOpen(false)}
                    className="p-1.5 rounded-lg border border-white/5 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <nav className="space-y-1.5">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === activeItem;
                    return (
                      <Link 
                        key={item.id} 
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer select-none",
                          isActive 
                            ? "bg-white/10 text-white border border-white/5" 
                            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                        )}
                      >
                        <Icon size={18} className={isActive ? "text-violet-400" : "text-zinc-500"} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile User Block */}
              <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center font-bold text-white text-xs">
                    N
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Naveen</div>
                    <div className="text-[10px] text-zinc-500">Premium Account</div>
                  </div>
                </div>
                <Link href="/" className="text-zinc-500 hover:text-zinc-300">
                  <LogOut size={16} />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-zinc-950 border-r border-white/5 h-screen sticky top-0 p-6 shrink-0 z-30">
        <div className="space-y-8">
          {/* Header logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.3)] group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">AI Learning</span>
              <span className="text-[10px] text-violet-400 font-medium block -mt-0.5">ACCELERATOR</span>
            </div>
          </Link>

          {/* Navigation Menu */}
          <nav className="space-y-1 relative">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeItem;
              return (
                <Link 
                  key={item.id} 
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer relative select-none",
                    isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {/* Sliding active indicator layout background */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute inset-0 bg-white/5 rounded-lg border border-white/5 shadow-inner"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <Icon 
                      size={18} 
                      className={cn(
                        "transition-colors duration-200", 
                        isActive ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-300"
                      )} 
                    />
                    <span>{item.label}</span>
                  </div>

                  {isActive && (
                    <ChevronRight size={14} className="text-violet-400 relative z-10" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile footer block */}
        <div className="border-t border-white/5 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
              N
            </div>
            <div>
              <div className="text-xs font-bold text-white">Naveen</div>
              <div className="text-[10px] text-zinc-500">Premium Account</div>
            </div>
          </div>
          <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <LogOut size={16} />
          </Link>
        </div>
      </aside>
    </>
  );
};
