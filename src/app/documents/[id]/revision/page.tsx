"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft,
  Sparkles,
  Copy,
  Download,
  Printer,
  Check,
  AlertCircle,
  BookOpen,
  HelpCircle,
  Zap,
  AlertTriangle,
  Lightbulb,
  FileText,
  Loader2
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CoreConcept {
  concept: string;
  importance: "Critical" | "Important" | "Nice to Know";
  explanation: string;
}

interface MustRemember {
  point: string;
  importance: "Critical" | "Important" | "Nice to Know";
}

interface ImportantDefinition {
  term: string;
  definition: string;
  importance: "Critical" | "Important" | "Nice to Know";
}

interface CommonMistake {
  mistake: string;
  correction: string;
  importance: "Critical" | "Important" | "Nice to Know";
}

interface ImportantQuestion {
  question: string;
  importance: "Critical" | "Important" | "Nice to Know";
}

interface InterviewQuickAnswer {
  question: string;
  answer: string;
  importance: "Critical" | "Important" | "Nice to Know";
}

interface RevisionJSON {
  title: string;
  estimated_revision_time: "5 mins" | "10 mins" | "20 mins";
  core_concepts: CoreConcept[];
  must_remember: MustRemember[];
  important_definitions: ImportantDefinition[];
  common_mistakes: CommonMistake[];
  important_questions: ImportantQuestion[];
  interview_quick_answers: InterviewQuickAnswer[];
  final_revision_sheet: string;
}

interface RevisionData {
  id: number;
  document_id: string;
  revision_type: string;
  revision_json: RevisionJSON;
  generated_by_model: string;
  created_at: string;
}

interface DocumentDetail {
  id: string;
  title: string;
  filename: string;
  page_count: number | null;
  word_count: number;
  character_count: number;
}

export default function RevisionNotesPage() {
  const params = useParams();
  const id = params.id as string;

  // Active time mode: "5 mins" | "10 mins" | "20 mins"
  const [activeMode, setActiveMode] = useState<"5 mins" | "10 mins" | "20 mins">("10 mins");
  const [revision, setRevision] = useState<RevisionJSON | null>(null);
  const [docDetail, setDocDetail] = useState<DocumentDetail | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive UI states
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("big-picture");

  const generationSteps = [
    "Reading Content",
    "Identifying High-Yield Concepts",
    "Creating Revision Notes",
    "Finding Important Questions",
    "Building Revision Sheet",
    "Completed"
  ];

  const fetchRevisionData = useCallback(async (mode: "5 mins" | "10 mins" | "20 mins") => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`${API_URL}/api/document/${id}/revision?revision_type=${encodeURIComponent(mode)}`);
      
      if (res.ok) {
        const data: RevisionData = await res.json();
        setRevision(data.revision_json);
      } else {
        // Revision doesn't exist for this mode yet
        setRevision(null);
      }

      // Fetch document detail if not already loaded
      if (!docDetail) {
        const docRes = await fetch(`${API_URL}/api/document/${id}`);
        if (docRes.ok) {
          const docData = await docRes.json();
          setDocDetail(docData);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch revision data.");
    } finally {
      setLoading(false);
    }
  }, [id, docDetail]);

  useEffect(() => {
    if (id) {
      fetchRevisionData(activeMode);
    }
  }, [id, activeMode, fetchRevisionData]);

  // Intersection Observer for scroll synchronization
  useEffect(() => {
    if (!revision) return;

    const observerOptions = {
      root: null, // viewport
      rootMargin: "-25% 0px -55% 0px", // focus area in the top-middle of the screen
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const sections = [
      "big-picture",
      "core-concepts",
      "must-remember",
      "definitions",
      "mistakes",
      "questions",
      "quick-answers",
      "revision-sheet"
    ];

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, [revision]);

  // Handle generation pipeline trigger
  const handleGenerateRevision = async () => {
    setGenerating(true);
    setError(null);
    setGenerationStep(0);

    // Simulate stepping through progress logs locally
    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev < 4) return prev + 1;
        return prev;
      });
    }, 2500);

    try {
      const res = await fetch(`${API_URL}/api/document/${id}/generate-revision?revision_type=${encodeURIComponent(activeMode)}`, {
        method: "POST"
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to generate revision notes.");
      }

      const data: RevisionData = await res.json();
      setGenerationStep(5); // Completed!
      
      setTimeout(() => {
        setRevision(data.revision_json);
        setGenerating(false);
      }, 1000);

    } catch (err: any) {
      clearInterval(stepInterval);
      console.error(err);
      setError(err.message || "An unexpected error occurred during AI generation.");
      setGenerating(false);
    }
  };

  // Clipboard copy helper
  const handleCopy = () => {
    if (!revision) return;
    const textToCopy = `Title: ${revision.title}\n` +
      `Revision Time: ${revision.estimated_revision_time}\n\n` +
      `--- REVISION SHEET ---\n\n` +
      `${revision.final_revision_sheet}`;
      
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Markdown download helper
  const handleDownloadMarkdown = () => {
    if (!revision) return;
    const element = document.createElement("a");
    const file = new Blob([revision.final_revision_sheet], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${revision.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_revision.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Trigger print view (configured via media queries for printing)
  const handlePrint = () => {
    window.print();
  };

  // Render markdown parser function
  const renderMarkdown = (text: string) => {
    if (!text) return "";
    let html = text;
    
    // Convert headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-violet-300 mt-4 mb-2 font-sans">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-indigo-300 mt-5 mb-2 border-b border-white/5 pb-1 font-sans">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-white mt-6 mb-3 font-sans">$1</h1>');
    
    // Convert bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white font-sans">$1</strong>');
    
    // Convert lists
    html = html.replace(/^\* (.*$)/gim, '<li class="list-disc ml-5 my-1 text-zinc-300 text-xs font-sans leading-relaxed">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="list-disc ml-5 my-1 text-zinc-300 text-xs font-sans leading-relaxed">$1</li>');
    
    return <div className="space-y-1 text-zinc-300 text-xs font-sans" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const getImportanceBadge = (importance: string) => {
    const styles = {
      Critical: "bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
      Important: "bg-violet-500/10 border-violet-500/20 text-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.1)]",
      "Nice to Know": "bg-zinc-800/40 border-zinc-700/30 text-zinc-400"
    };
    return (
      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider font-mono ${styles[importance as keyof typeof styles] || styles["Nice to Know"]}`}>
        {importance}
      </span>
    );
  };

  // Quick jumps
  const sidebarItems = [
    { id: "big-picture", label: "Big Picture" },
    { id: "core-concepts", label: "Core Concepts" },
    { id: "must-remember", label: "Must Remember" },
    { id: "definitions", label: "Definitions" },
    { id: "mistakes", label: "Common Mistakes" },
    { id: "questions", label: "Important Questions" },
    { id: "quick-answers", label: "Quick Answers" },
    { id: "revision-sheet", label: "1-Page Sheet" }
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col md:flex-row font-sans relative overflow-x-hidden">
      {/* Print custom stylesheet override directly embedded */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide sidebar and headers on print */
          aside, header, nav, button, .no-print, main > div:first-child, .sticky-sidebar {
            display: none !important;
          }
          /* Expand print container to full screen */
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .print-area {
            background: white !important;
            color: black !important;
            padding: 24px !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .print-title {
            color: black !important;
            font-size: 24px !important;
            border-bottom: 2px solid #e4e4e7 !important;
            padding-bottom: 8px !important;
            margin-bottom: 20px !important;
          }
          .print-card {
            background: white !important;
            border: 1px solid #e4e4e7 !important;
            color: black !important;
            box-shadow: none !important;
            margin-bottom: 16px !important;
            padding: 16px !important;
            break-inside: avoid;
          }
          .print-card h3, .print-card h2, .print-card p, .print-card li, .print-card strong, .print-card span {
            color: black !important;
          }
          .print-badge {
            border: 1px solid #71717a !important;
            color: black !important;
            background: transparent !important;
          }
        }
      ` }} />

      {/* SIDEBAR */}
      <div className="no-print flex shrink-0 md:h-screen sticky top-0 z-30">
        <Sidebar activeItem="learn" />
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 space-y-8 overflow-y-auto max-h-screen relative">
        {/* BACK ACTION & HEADER */}
        <div className="no-print space-y-4">
          <Link 
            href={`/documents/${id}`} 
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider font-mono cursor-pointer"
          >
            <ArrowLeft size={14} />
            Back to Document Index
          </Link>

          {docDetail && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5 pb-5">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-violet-500/20 bg-violet-950/20 text-[10px] font-bold text-violet-400 uppercase tracking-wider font-mono">
                  <Zap size={10} className="animate-pulse" />
                  AI Revision Notes
                </span>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  {docDetail.title}
                </h1>
                <p className="text-zinc-500 text-xs font-mono">{docDetail.filename}</p>
              </div>

              {/* ESTIMATED REVISION TIME SELECTOR */}
              <div className="flex items-center gap-3 bg-zinc-950/60 p-1.5 rounded-xl border border-white/5">
                <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono px-2">Mode:</span>
                {(["5 mins", "10 mins", "20 mins"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setActiveMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-tight transition-all duration-300 cursor-pointer ${
                      activeMode === mode
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg border border-violet-500/20"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {mode === "5 mins" ? "5 Min" : mode === "10 mins" ? "10 Min" : "20 Min"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* LOADING INDICATOR */}
        {loading && !generating && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500 no-print">
            <Loader2 className="animate-spin text-violet-500" size={32} />
            <p className="text-sm font-semibold font-mono">Fetching saved revision sheet...</p>
          </div>
        )}

        {/* ERROR DISPLAY */}
        {error && (
          <Card className="border-red-500/20 bg-red-950/10 p-6 flex flex-col items-center text-center gap-4 no-print">
            <AlertCircle size={32} className="text-red-400" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Revision Engine Alert</h3>
              <p className="text-xs text-red-300 max-w-md">{error}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => fetchRevisionData(activeMode)} className="border-zinc-800">
              Try Again
            </Button>
          </Card>
        )}

        {/* NO REVISION FOUND - GENERATION CALL-TO-ACTION */}
        {!loading && !revision && !generating && !error && (
          <Card className="border-white/5 bg-zinc-950/30 p-10 max-w-xl mx-auto flex flex-col items-center text-center gap-6 no-print shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="mx-auto h-14 w-14 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-md">
              <Zap size={24} className="animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Generate Revision Notes ({activeMode} Mode)</h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Compress the entire 3-hour content of this document into a high-density, 1-page revision sheet customized for <strong>{activeMode}</strong> study.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Button variant="gradient" size="md" onClick={handleGenerateRevision} className="font-semibold gap-2">
                <Sparkles size={14} />
                Generate Sheet
              </Button>
              <div className="text-[10px] text-zinc-500 font-mono">Generates core concepts, definitions, interview Q&As & mistakes</div>
            </div>
          </Card>
        )}

        {/* REVISION CONTENT GRID */}
        {!loading && revision && !generating && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* STICKY SIDEBAR NAVIGATION */}
            <div className="no-print lg:col-span-1 hidden lg:block">
              <div className="sticky top-28 bg-zinc-950/30 p-4 border border-white/5 rounded-2xl space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono px-2">Sections</h3>
                <nav className="space-y-1">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        const el = document.getElementById(item.id);
                        el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium font-sans tracking-tight transition-all duration-200 cursor-pointer ${
                        activeSection === item.id
                          ? "bg-white/5 text-white font-semibold border-l-2 border-violet-500 pl-4"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/2"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>

                <div className="border-t border-white/5 pt-4 space-y-2">
                  <button 
                    onClick={handlePrint}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer font-sans"
                  >
                    <Printer size={13} className="text-zinc-500" />
                    Print/Export PDF
                  </button>
                  <button 
                    onClick={handleCopy}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer font-sans"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-zinc-500" />}
                    {copied ? "Copied!" : "Copy Raw Notes"}
                  </button>
                  <button 
                    onClick={handleDownloadMarkdown}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer font-sans"
                  >
                    <Download size={13} className="text-zinc-500" />
                    Download Markdown
                  </button>
                </div>
              </div>
            </div>

            {/* REVISION NOTES DETAIL VIEWS */}
            <div className="lg:col-span-3 space-y-8 print-area">
              
              {/* PRINT ONLY HEADER */}
              <div className="hidden print:block print-title">
                <h1 className="text-2xl font-bold font-sans">{revision.title}</h1>
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-600 mt-2">
                  <span>Revision Time: {revision.estimated_revision_time}</span>
                  <span>Generated Date: {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* ACTION BAR FOR MOBILE/TABLET */}
              <div className="no-print lg:hidden flex flex-wrap gap-2 p-3 bg-zinc-950/40 border border-white/5 rounded-xl">
                <button 
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-zinc-800 text-zinc-300 hover:bg-white/5 cursor-pointer font-sans"
                >
                  <Printer size={13} />
                  Print
                </button>
                <button 
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-zinc-800 text-zinc-300 hover:bg-white/5 cursor-pointer font-sans"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  Copy
                </button>
                <button 
                  onClick={handleDownloadMarkdown}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-zinc-800 text-zinc-300 hover:bg-white/5 cursor-pointer font-sans"
                >
                  <Download size={13} />
                  Markdown
                </button>
              </div>

              {/* SECTION 1: Big Picture */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                id="big-picture"
                className="scroll-mt-24"
              >
                <Card interactive={false} className="border-white/5 bg-zinc-950/40 relative overflow-hidden print-card">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                  <div className="space-y-3 pl-2">
                    <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-400 font-mono">Section 1: Big Picture</h3>
                    <h2 className="text-lg font-bold text-white tracking-tight font-sans">What is this topic & why does it matter?</h2>
                    {/* The first paragraph of the markdown block contains the overview */}
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans font-medium">
                      {revision.final_revision_sheet.split("\n\n")[0]?.replace(/^# (.*)/, "").trim() || 
                       "This lecture outlines the core concepts and frameworks of this subject, providing critical terminology, definitions, and mental models required for master-level retention and exam generalizability."}
                    </p>
                  </div>
                </Card>
              </motion.div>

              {/* SECTION 2: Core Concepts */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                id="core-concepts"
                className="space-y-4 scroll-mt-24"
              >
                <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 font-mono no-print">Section 2: Core Concepts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {revision.core_concepts.map((item, idx) => (
                    <Card key={idx} interactive={false} className="border-white/5 bg-zinc-950/20 hover:border-violet-500/10 transition-colors print-card">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center gap-2">
                          <h4 className="font-bold text-sm text-white font-sans flex items-center gap-2">
                            <span className="h-5 w-5 rounded bg-zinc-900 border border-white/5 flex items-center justify-center text-[10px] text-zinc-400 font-mono">#{idx+1}</span>
                            {item.concept}
                          </h4>
                          {getImportanceBadge(item.importance)}
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed font-sans">{item.explanation}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>

              {/* SECTION 3: Must Remember */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                id="must-remember"
                className="space-y-4 scroll-mt-24"
              >
                <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 font-mono no-print">Section 3: Must Remember Points</h3>
                <Card interactive={false} className="border-white/5 bg-zinc-950/30 print-card">
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-white font-sans flex items-center gap-2">
                      <BookOpen size={16} className="text-amber-400" />
                      High-Yield Test Facts
                    </h4>
                    <div className="space-y-3 divide-y divide-white/5 print:divide-y print:divide-zinc-200">
                      {revision.must_remember.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-4 pt-3 first:pt-0">
                          <div className="flex items-start gap-2.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-2 shrink-0" />
                            <p className="text-xs text-zinc-300 leading-relaxed font-sans">{item.point}</p>
                          </div>
                          <div className="shrink-0">{getImportanceBadge(item.importance)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* SECTION 4: Important Definitions */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                id="definitions"
                className="space-y-4 scroll-mt-24"
              >
                <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 font-mono no-print">Section 4: Key Definitions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {revision.important_definitions.map((item, idx) => (
                    <Card key={idx} interactive={false} className="border-white/5 bg-zinc-950/20 print-card">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center gap-2">
                          <strong className="text-sm font-bold text-indigo-400 font-sans">{item.term}</strong>
                          {getImportanceBadge(item.importance)}
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed font-sans">{item.definition}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>

              {/* SECTION 5: Common Mistakes */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                id="mistakes"
                className="space-y-4 scroll-mt-24"
              >
                <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 font-mono no-print">Section 5: Common Mistakes</h3>
                <div className="space-y-3">
                  {revision.common_mistakes.map((item, idx) => (
                    <Card key={idx} interactive={false} className="border-red-500/10 bg-red-950/5 print-card relative overflow-hidden">
                      <div className="absolute left-0 top-0 w-1 h-full bg-red-500" />
                      <div className="space-y-3 pl-2">
                        <div className="flex justify-between items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 font-sans">
                            <AlertTriangle size={12} />
                            Misconception #{idx+1}
                          </span>
                          {getImportanceBadge(item.importance)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono block">Incorrect Trap:</span>
                            <p className="text-zinc-300 mt-1 leading-relaxed">{item.mistake}</p>
                          </div>
                          <div className="border-t md:border-t-0 md:border-l border-white/5 md:pl-4 pt-3 md:pt-0">
                            <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono block">Correct Understanding:</span>
                            <p className="text-emerald-300 mt-1 leading-relaxed">{item.correction}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>

              {/* SECTION 6: Important Questions */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                id="questions"
                className="space-y-4 scroll-mt-24"
              >
                <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 font-mono no-print">Section 6: Expected Exam Questions</h3>
                <Card interactive={false} className="border-white/5 bg-zinc-950/30 print-card">
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-white font-sans flex items-center gap-2">
                      <HelpCircle size={16} className="text-indigo-400" />
                      High-Relevance Practice Questions
                    </h4>
                    <div className="space-y-3 divide-y divide-white/5 print:divide-y print:divide-zinc-200">
                      {revision.important_questions.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-4 pt-3 first:pt-0">
                          <div className="flex items-start gap-2.5">
                            <span className="text-zinc-500 font-mono text-xs mt-0.5">Q{idx+1}.</span>
                            <p className="text-xs text-zinc-300 leading-relaxed font-sans font-medium">{item.question}</p>
                          </div>
                          <div className="shrink-0">{getImportanceBadge(item.importance)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* SECTION 7: Interview Answers */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                id="quick-answers"
                className="space-y-4 scroll-mt-24"
              >
                <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 font-mono no-print">Section 7: Quick Interview Answers</h3>
                <div className="space-y-3">
                  {revision.interview_quick_answers.map((item, idx) => (
                    <Card key={idx} interactive={false} className="border-white/5 bg-zinc-950/20 print-card">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center gap-2">
                          <h4 className="font-bold text-xs text-white font-sans flex items-center gap-2">
                            <span className="text-[10px] text-violet-400 font-mono font-bold uppercase">Interview:</span>
                            &ldquo;{item.question}&rdquo;
                          </h4>
                          {getImportanceBadge(item.importance)}
                        </div>
                        <div className="p-3 rounded-lg bg-zinc-950/40 border border-white/2 print:bg-zinc-100 flex items-start gap-2">
                          <Lightbulb size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-zinc-300 font-sans italic leading-relaxed font-medium">&ldquo;{item.answer}&rdquo;</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>

              {/* SECTION 8: 1-Page Revision Sheet */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                id="revision-sheet"
                className="space-y-4 scroll-mt-24 pb-20 print:pb-0"
              >
                <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 font-mono no-print">Section 8: Compressed Markdown Sheet</h3>
                <Card interactive={false} className="border-white/5 bg-zinc-950/40 relative overflow-hidden print-card">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="space-y-4 p-2">
                    <div className="flex justify-between items-center gap-2 no-print">
                      <h4 className="font-bold text-sm text-white font-sans flex items-center gap-2">
                        <FileText size={16} className="text-violet-400" />
                        1-Page Condensed Revision Sheet
                      </h4>
                      <button 
                        onClick={handleCopy}
                        className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-900 border border-white/5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        {copied ? "Copied" : "Copy Content"}
                      </button>
                    </div>

                    <div className="border border-white/5 rounded-xl bg-zinc-950/60 p-6 md:p-8 font-mono overflow-x-auto print:border-zinc-200 print:bg-white">
                      {renderMarkdown(revision.final_revision_sheet)}
                    </div>
                  </div>
                </Card>
              </motion.div>

            </div>
          </div>
        )}

        {/* AI GENERATION PIPELINE OVERLAY */}
        <AnimatePresence>
          {generating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 no-print"
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                className="w-full max-w-lg bg-zinc-950/80 border border-violet-500/20 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden"
              >
                {/* Visual back glow design elements */}
                <div className="absolute -top-10 -left-10 h-32 w-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                
                {/* Steps Header */}
                <div className="space-y-1.5 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-2 shadow-md">
                    <Zap className="h-6 w-6 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">AI Revision Notes Generator</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Formulating {activeMode} high-density revision card sections and a 1-page condensed review sheet...
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-violet-400 font-mono">Stage {generationStep + 1} of 6</span>
                    <span className="text-zinc-500 font-mono">
                      {Math.round(((generationStep + 1) / 6) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${((generationStep + 1) / 6) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Loading Stepper Items */}
                <div className="space-y-3">
                  {generationSteps.map((stepName, idx) => {
                    const isDone = generationStep > idx;
                    const isActive = generationStep === idx;

                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors duration-300 ${
                          isDone 
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                            : isActive 
                            ? "bg-violet-500/20 border-violet-500 text-violet-300 animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.3)]" 
                            : "bg-zinc-900 border-zinc-800 text-zinc-600"
                        }`}>
                          {isDone ? <Check size={10} /> : idx + 1}
                        </div>
                        <span className={`text-xs font-medium transition-colors duration-300 ${
                          isDone ? "text-zinc-400" : isActive ? "text-violet-300 font-bold" : "text-zinc-600"
                        }`}>
                          {stepName}
                        </span>
                        {isActive && (
                          <Loader2 size={12} className="animate-spin text-violet-400 ml-auto" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
