"use client";

import React, { useState, useEffect } from "react";
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
  BarChart2,
  Network,
  AlertCircle
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DashboardPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/documents`);
        if (res.ok) {
          const data = await res.json();
          // Sort by updated_at or created_at descending (most recent first)
          data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setDocuments(data);
        }
      } catch (err) {
        console.error("Failed to fetch documents for dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const completedCount = documents.filter(d => d.processing_status === "completed").length;
  const recentDoc = documents[0];

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
      title: "Mind Maps",
      description: "Convert learning topics into interactive, animated visual knowledge graphs.",
      icon: Network,
      href: "/mindmap",
      color: "violet",
      badge: "Visual Graph",
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
                {getGreeting()}, Naveen
              </h2>
              {loading ? (
                <p className="text-zinc-500 text-sm animate-pulse">Loading library analytics...</p>
              ) : documents.length > 0 ? (
                <p className="text-zinc-400 text-sm leading-relaxed">
                  You have <span className="text-violet-400 font-bold font-mono">{documents.length}</span> {documents.length === 1 ? "document" : "documents"} in your library, with <span className="text-violet-400 font-bold font-mono">{completedCount}</span> completed learning {completedCount === 1 ? "module" : "modules"}. Keep the momentum going!
                </p>
              ) : (
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Welcome to your AI Learning Accelerator. Get started by uploading lecture notes, slides, or study textbooks.
                </p>
              )}
            </div>
            <div className="pt-2">
              {loading ? (
                <div className="h-9 w-36 bg-zinc-900 rounded-lg animate-pulse border border-white/5" />
              ) : recentDoc ? (
                <Link href={recentDoc.processing_status === "completed" ? `/documents/${recentDoc.id}/summary` : `/documents/${recentDoc.id}`}>
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />}>
                    {recentDoc.processing_status === "completed" ? `Study ${recentDoc.title}` : `Track ${recentDoc.title}`}
                  </Button>
                </Link>
              ) : (
                <Link href="/upload">
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />}>
                    Upload your first PDF
                  </Button>
                </Link>
              )}
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
            <Link href="/upload" className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-0.5">
              View Document Library <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              // Loading Skeleton State
              Array.from({ length: 3 }).map((_, idx) => (
                <div 
                  key={idx}
                  className="glass-panel border border-white/5 rounded-xl p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-lg bg-zinc-900 border border-white/5 shrink-0" />
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-zinc-900 rounded" />
                      <div className="h-3 w-28 bg-zinc-900 rounded" />
                    </div>
                  </div>
                  <div className="flex-1 max-w-md space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 w-16 bg-zinc-900 rounded" />
                      <div className="h-3 w-8 bg-zinc-900 rounded" />
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full" />
                  </div>
                  <div className="h-9 w-24 bg-zinc-900 rounded-lg" />
                </div>
              ))
            ) : documents.length === 0 ? (
              // Empty State
              <Card className="border-dashed border-white/5 bg-zinc-950/20 p-8 flex flex-col items-center justify-center text-center gap-4">
                <UploadCloud size={32} className="text-zinc-600" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">No documents uploaded yet</h4>
                  <p className="text-xs text-zinc-500 max-w-sm">
                    Upload a lecture note, textbook, or PDF to generate smart learning modules and quizzes.
                  </p>
                </div>
                <Link href="/upload">
                  <Button size="sm" variant="secondary" className="border-zinc-800">
                    Upload Content
                  </Button>
                </Link>
              </Card>
            ) : (
              // Display actual documents (top 3)
              documents.slice(0, 3).map((doc, idx) => {
                const gradients = [
                  "from-violet-500/20 to-indigo-500/20",
                  "from-blue-500/20 to-teal-500/20",
                  "from-emerald-500/20 to-teal-500/20",
                ];
                const gradient = gradients[idx % gradients.length];
                
                // Determine progress and styles based on status
                let progress = 10;
                let progressColor = "from-zinc-500 to-zinc-600";
                let statusLabel = "Idle";
                let routeUrl = `/documents/${doc.id}`;

                if (doc.processing_status === "completed") {
                  progress = 100;
                  progressColor = "from-emerald-500 to-teal-500";
                  statusLabel = "Completed";
                  routeUrl = `/documents/${doc.id}/summary`;
                } else if (doc.processing_status === "processing") {
                  progress = 50;
                  progressColor = "from-violet-500 to-indigo-500 animate-pulse";
                  statusLabel = "Processing";
                } else if (doc.processing_status === "failed") {
                  progress = 0;
                  progressColor = "from-red-500 to-rose-500";
                  statusLabel = "Failed";
                } else if (doc.processing_status === "uploading") {
                  progress = 25;
                  progressColor = "from-indigo-500 to-blue-500 animate-pulse";
                  statusLabel = "Uploading";
                }

                return (
                  <div 
                    key={doc.id}
                    className="glass-panel border border-white/5 hover:border-white/10 rounded-xl p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 transition-all duration-300 hover:shadow-lg"
                  >
                    {/* Topic Info */}
                    <div className="flex items-center gap-4">
                      <div className={`h-11 w-11 rounded-lg bg-gradient-to-tr ${gradient} border border-white/5 flex items-center justify-center shrink-0`}>
                        <BookOpen size={18} className="text-zinc-300" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-white">{doc.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5 text-[10px] text-zinc-400">PDF Ingestion</span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> 
                            {doc.page_count ? `${doc.page_count} pages • ` : ""}
                            {doc.estimated_reading_time || 0} min read
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex-1 max-w-md space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-zinc-400">
                        <span>{statusLabel}</span>
                        <span className="text-white">{progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full bg-gradient-to-r ${progressColor} rounded-full`}
                        />
                      </div>
                    </div>

                    {/* CTA Action */}
                    <div className="shrink-0 flex items-center">
                      <Link href={routeUrl} className="w-full md:w-auto">
                        <Button 
                          variant={doc.processing_status === "completed" ? "primary" : "secondary"} 
                          size="sm" 
                          className="w-full md:w-auto text-xs px-4 border border-zinc-800 hover:border-zinc-700/50" 
                          rightIcon={doc.processing_status === "completed" ? <Play size={12} fill="currentColor" /> : <AlertCircle size={12} />}
                        >
                          {doc.processing_status === "completed" ? "Study" : "Track"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
