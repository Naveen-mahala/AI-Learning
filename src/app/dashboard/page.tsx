"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  Layers, 
  UploadCloud, 
  Play,
  ArrowRight,
  Clock,
  BarChart2
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

interface RecentTopic {
  id: string;
  title: string;
  category: string;
  progress: number;
  timeSpent: string;
  gradient: string;
}

export default function DashboardPage() {
  const recentTopics: RecentTopic[] = [
    {
      id: "python-fundamentals",
      title: "Python Fundamentals",
      category: "Programming",
      progress: 65,
      timeSpent: "2h 40m",
      gradient: "from-violet-500/20 to-indigo-500/20",
    },
    {
      id: "sql-joins",
      title: "SQL Joins & Subqueries",
      category: "Databases",
      progress: 40,
      timeSpent: "1h 15m",
      gradient: "from-blue-500/20 to-teal-500/20",
    },
    {
      id: "machine-learning-basics",
      title: "Machine Learning Basics",
      category: "Artificial Intelligence",
      progress: 90,
      timeSpent: "4h 20m",
      gradient: "from-emerald-500/20 to-teal-500/20",
    },
  ];

  const quickActions = [
    {
      title: "Learn a Topic",
      description: "Generate a custom AI-guided lesson module tailored to your time schedule.",
      icon: BookOpen,
      href: "/learn",
      color: "violet",
      badge: "AI Powered",
    },
    {
      title: "Generate Quiz",
      description: "Create diagnostic quizzes from topics or upload nodes to test accuracy.",
      icon: HelpCircle,
      href: "/quiz",
      color: "indigo",
      badge: "Instant",
    },
    {
      title: "Create Flashcards",
      description: "Auto-generate spaced repetition flashcards from your study materials.",
      icon: Layers,
      href: "/flashcards",
      color: "emerald",
      badge: "Retain",
    },
    {
      title: "Upload Content",
      description: "Drag and drop lectures, notes, or slides to extract summaries instantly.",
      icon: UploadCloud,
      href: "/upload",
      color: "rose",
      badge: "Extract",
    },
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col md:flex-row">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar activeItem="dashboard" />

      {/* DASHBOARD CONTENT AREA */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 space-y-8 overflow-y-auto max-h-screen">
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="text-zinc-500 text-xs sm:text-sm">Manage your accelerated learning progress.</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            AI Core: Online
          </div>
        </div>

        {/* WELCOME BANNER */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl border border-violet-500/20 p-6 sm:p-8 bg-gradient-to-r from-violet-950/20 via-indigo-950/20 to-zinc-950 shadow-[0_0_50px_-15px_rgba(139,92,246,0.15)] group"
        >
          {/* Animated meshes */}
          <div className="absolute top-[-50%] right-[-10%] w-72 h-72 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none animate-pulse-slow group-hover:scale-105 transition-transform duration-1000" />
          <div className="absolute bottom-[-30%] left-[30%] w-60 h-60 bg-emerald-600/5 rounded-full blur-[80px] pointer-events-none animate-pulse-slow" />
          
          <div className="relative z-10 space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-violet-400/20 bg-violet-400/5 text-violet-400 text-[10px] uppercase font-bold tracking-wider">
              <Sparkles size={10} className="animate-pulse" />
              Welcome Back
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Good Evening, Naveen
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {"You've"} completed <span className="text-violet-400 font-semibold">12 lessons</span> {"this week. Let's learn something new today and keep the streak alive."}
              </p>
            </div>
            <div className="pt-2">
              <Link href="/learn">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />}>
                  Resume SQL Joins
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* QUICK ACTIONS SECTION */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-zinc-500" />
            <h3 className="text-sm uppercase tracking-wider font-bold text-zinc-400">Quick Actions</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href}>
                  <Card 
                    hoverGlow={action.color as "indigo" | "violet" | "emerald" | "none"}
                    className="h-full flex flex-col justify-between group cursor-pointer border-white/5 hover:border-white/10"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center border transition-all duration-300 ${
                          action.color === "violet" ? "bg-violet-500/10 border-violet-500/20 text-violet-400 group-hover:scale-105" :
                          action.color === "indigo" ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 group-hover:scale-105" :
                          action.color === "emerald" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:scale-105" :
                          "bg-rose-500/10 border-rose-500/20 text-rose-400 group-hover:scale-105"
                        }`}>
                          <Icon size={18} />
                        </div>
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{action.badge}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors">{action.title}</h4>
                      <p className="text-zinc-400 text-xs leading-relaxed">{action.description}</p>
                    </div>
                    <div className="pt-4 flex items-center gap-1 text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                      Execute action <ArrowRight size={10} />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* RECENT LEARNING SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-zinc-500" />
              <h3 className="text-sm uppercase tracking-wider font-bold text-zinc-400">Recent Learning</h3>
            </div>
            <Link href="/learn" className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-0.5">
              View All <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-4">
            {recentTopics.map((topic) => (
              <div 
                key={topic.id}
                className="glass-panel border border-white/5 hover:border-white/10 rounded-xl p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 transition-all duration-300 hover:shadow-lg"
              >
                {/* Topic Info */}
                <div className="flex items-center gap-4">
                  <div className={`h-11 w-11 rounded-lg bg-gradient-to-tr ${topic.gradient} border border-white/5 flex items-center justify-center shrink-0`}>
                    <BookOpen size={18} className="text-zinc-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-white">{topic.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5 text-[10px] text-zinc-400">{topic.category}</span>
                      <span className="flex items-center gap-1"><Clock size={11} /> {topic.timeSpent} spent</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex-1 max-w-md space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-zinc-400">
                    <span>Progress</span>
                    <span className="text-white">{topic.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                    />
                  </div>
                </div>

                {/* CTA Action */}
                <div className="shrink-0 flex items-center">
                  <Link href="/learn" className="w-full md:w-auto">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="w-full md:w-auto text-xs px-4 border border-zinc-800 hover:border-zinc-700/50" 
                      rightIcon={<Play size={12} fill="currentColor" />}
                    >
                      Continue
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
