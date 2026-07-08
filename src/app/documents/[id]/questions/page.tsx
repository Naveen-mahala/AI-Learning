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
  HelpCircle,
  Zap,
  Info,
  Loader2,
  Bookmark,
  Award,
  ChevronDown,
  Play,
  RotateCcw,
  CheckCircle,
  BookOpen
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface QuestionItem {
  question: string;
  type: string; // Conceptual, Definition, Application, Scenario, Interview, Viva
  importance_score: number;
  reason: string;
  answer_outline: string;
}

interface QuestionsJSON {
  document_title: string;
  question_count: number;
  questions: QuestionItem[];
}

interface ImportantQuestionsData {
  id: number;
  document_id: string;
  question_mode: string;
  questions_json: QuestionsJSON;
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
  created_at: string;
}

export default function ImportantQuestionsPage() {
  const params = useParams();
  const id = params.id as string;

  // Active Mode: "Mixed Mode" | "Exam Mode" | "Interview Mode" | "Viva Mode"
  const [activeMode, setActiveMode] = useState<string>("Mixed Mode");
  const [questionsData, setQuestionsData] = useState<QuestionsJSON | null>(null);
  const [docDetail, setDocDetail] = useState<DocumentDetail | null>(null);
  const [generatedDate, setGeneratedDate] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive UI states
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [globalPracticeMode, setGlobalPracticeMode] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({});
  const [submittedPractice, setSubmittedPractice] = useState<Record<number, boolean>>({});

  const generationSteps = [
    "Analyzing Concepts",
    "Identifying Important Topics",
    "Generating Questions",
    "Ranking Importance",
    "Preparing Answer Outlines",
    "Completed"
  ];

  const fetchQuestionsData = useCallback(async (mode: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`${API_URL}/api/document/${id}/important-questions?question_mode=${encodeURIComponent(mode)}`);
      
      if (res.ok) {
        const data: ImportantQuestionsData = await res.json();
        setQuestionsData(data.questions_json);
        setGeneratedDate(data.created_at);
      } else {
        setQuestionsData(null);
        setGeneratedDate(null);
      }

      // Fetch document details if not already loaded
      if (!docDetail) {
        const docRes = await fetch(`${API_URL}/api/document/${id}`);
        if (docRes.ok) {
          const docData = await docRes.json();
          setDocDetail(docData);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch important questions.");
    } finally {
      setLoading(false);
    }
  }, [id, docDetail]);

  useEffect(() => {
    if (id) {
      fetchQuestionsData(activeMode);
    }
  }, [id, activeMode, fetchQuestionsData]);

  // Handle generation pipeline trigger
  const handleGenerateQuestions = async () => {
    setGenerating(true);
    setError(null);
    setGenerationStep(0);

    // Progressive loading bar
    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev < 4) return prev + 1;
        return prev;
      });
    }, 2000);

    try {
      const res = await fetch(`${API_URL}/api/document/${id}/generate-important-questions?question_mode=${encodeURIComponent(activeMode)}`, {
        method: "POST"
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to generate important questions.");
      }

      const data: ImportantQuestionsData = await res.json();
      setGenerationStep(5); // Completed!
      
      setTimeout(() => {
        setQuestionsData(data.questions_json);
        setGeneratedDate(data.created_at);
        setGenerating(false);
        // Clear expansion and user states
        setExpandedQuestions({});
        setPracticeAnswers({});
        setSubmittedPractice({});
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
    if (!questionsData) return;
    let textToCopy = `Important Questions: ${questionsData.document_title}\n`;
    textToCopy += `Mode: ${activeMode} | Count: ${questionsData.question_count}\n\n`;
    
    questionsData.questions.forEach((q, idx) => {
      textToCopy += `[Question ${idx + 1}] (${q.type} - Importance: ${q.importance_score}%) ${q.question}\n`;
      textToCopy += `Reason: ${q.reason}\n`;
      textToCopy += `Suggested Answer Outline:\n${q.answer_outline}\n\n`;
    });
      
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Markdown download helper
  const handleDownloadMarkdown = () => {
    if (!questionsData) return;
    let markdownContent = `# Important Questions: ${questionsData.document_title}\n`;
    markdownContent += `* **Question Mode:** ${activeMode}\n`;
    markdownContent += `* **Question Count:** ${questionsData.question_count}\n`;
    markdownContent += `* **Generated Date:** ${generatedDate ? new Date(generatedDate).toLocaleDateString() : 'N/A'}\n\n`;
    
    markdownContent += `## Questions List\n\n`;
    questionsData.questions.forEach((q, idx) => {
      const cat = q.importance_score >= 90 ? "Must Know" : q.importance_score >= 70 ? "Important" : "Nice to Know";
      markdownContent += `### ${idx + 1}. ${q.question}\n`;
      markdownContent += `* **Type:** ${q.type}\n`;
      markdownContent += `* **Importance:** ${q.importance_score}% (${cat})\n`;
      markdownContent += `* **Why it matters:** ${q.reason}\n\n`;
      markdownContent += `#### Answer Outline\n\n${q.answer_outline}\n\n---\n\n`;
    });

    const element = document.createElement("a");
    const file = new Blob([markdownContent], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${questionsData.document_title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_important_questions.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  // Trigger print view (configured via media queries for printing)
  const handlePrint = () => {
    window.print();
  };

  const toggleQuestionExpand = (index: number) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handlePracticeSubmit = (index: number) => {
    setSubmittedPractice(prev => ({
      ...prev,
      [index]: true
    }));
  };

  const handlePracticeReset = (index: number) => {
    setSubmittedPractice(prev => ({
      ...prev,
      [index]: false
    }));
    setPracticeAnswers(prev => ({
      ...prev,
      [index]: ""
    }));
  };

  const getImportanceDetails = (score: number) => {
    if (score >= 90) {
      return {
        label: "Must Know",
        colorClass: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.1)]",
        barColor: "bg-emerald-500",
        glowRing: "border-emerald-500/30"
      };
    } else if (score >= 70) {
      return {
        label: "Important",
        colorClass: "text-violet-400 border-violet-500/20 bg-violet-500/10 shadow-[0_0_8px_rgba(139,92,246,0.1)]",
        barColor: "bg-violet-500",
        glowRing: "border-violet-500/30"
      };
    } else {
      return {
        label: "Nice to Know",
        colorClass: "text-zinc-400 border-zinc-700/30 bg-zinc-800/40",
        barColor: "bg-zinc-500",
        glowRing: "border-zinc-700/30"
      };
    }
  };

  const getQuestionTypeBadgeColor = (type: string) => {
    const types: Record<string, string> = {
      Conceptual: "text-sky-400 border-sky-500/20 bg-sky-500/5",
      Definition: "text-amber-400 border-amber-500/20 bg-amber-500/5",
      Application: "text-pink-400 border-pink-500/20 bg-pink-500/5",
      Scenario: "text-purple-400 border-purple-500/20 bg-purple-500/5",
      Interview: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
      Viva: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
    };
    return types[type] || "text-zinc-400 border-zinc-700/20 bg-zinc-800/10";
  };

  // Sort questions: Must Know -> Important -> Nice to Know (Descending Importance Score)
  const sortedQuestions = questionsData?.questions
    ? [...questionsData.questions].sort((a, b) => b.importance_score - a.importance_score)
    : [];

  const renderOutlineText = (text: string, isPrint = false) => {
    if (!text) return null;
    
    const lines = text.split("\n");
    
    return (
      <div className="space-y-1">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          
          let html = line;
          
          // Replace bold markdown syntax (**text**) with HTML strong
          const boldRegex = /\*\*(.*?)\*\*/g;
          if (isPrint) {
            html = html.replace(boldRegex, '<strong class="font-bold text-zinc-900">$1</strong>');
          } else {
            html = html.replace(boldRegex, '<strong class="font-bold text-white">$1</strong>');
          }
          
          // Check for bullet list item
          const trimmed = line.trim();
          const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ");
          
          if (isBullet) {
            const content = html.replace(/^[\*\-]\s+/, "");
            return (
              <div key={idx} className="flex items-start gap-2 pl-3">
                <span className={`text-[10px] select-none mt-1 shrink-0 ${isPrint ? "text-zinc-800" : "text-violet-400"}`}>•</span>
                <p 
                  className={`text-xs leading-relaxed flex-1 ${isPrint ? "text-zinc-800" : "text-zinc-300"}`}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            );
          }
          
          return (
            <p 
              key={idx} 
              className={`text-xs leading-relaxed ${isPrint ? "text-zinc-800" : "text-zinc-300"}`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col md:flex-row font-sans relative overflow-x-hidden">
      {/* Print custom stylesheet override directly embedded */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          aside, header, nav, button, .no-print, main > div:first-child, .sticky-sidebar, .practice-mode-hint {
            display: none !important;
          }
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
            font-weight: bold;
          }
          .print-meta {
            color: #52525b !important;
            font-size: 12px !important;
            margin-bottom: 20px !important;
            font-family: monospace;
          }
          .print-card {
            background: white !important;
            border: 1px solid #e4e4e7 !important;
            color: black !important;
            box-shadow: none !important;
            margin-bottom: 20px !important;
            padding: 16px !important;
            break-inside: avoid;
            border-radius: 8px;
          }
          .print-card h3, .print-card p, .print-card li, .print-card strong, .print-card span {
            color: black !important;
          }
          .print-outline {
            margin-top: 12px !important;
            border-top: 1px dashed #e4e4e7 !important;
            padding-top: 8px !important;
          }
          .print-badge {
            border: 1px solid #71717a !important;
            color: black !important;
            background: transparent !important;
            padding: 2px 6px !important;
            font-size: 10px !important;
            border-radius: 4px;
            font-weight: bold;
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
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/5 pb-5">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-violet-500/20 bg-violet-950/20 text-[10px] font-bold text-violet-400 uppercase tracking-wider font-mono">
                  <HelpCircle size={10} className="animate-pulse" />
                  AI Important Questions Engine
                </span>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  {docDetail.title}
                </h1>
                <p className="text-zinc-500 text-xs font-mono">{docDetail.filename}</p>
              </div>

              {/* ESTIMATED REVISION TIME SELECTOR */}
              <div className="flex flex-wrap items-center gap-3 bg-zinc-950/60 p-1.5 rounded-xl border border-white/5">
                <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono px-2">Mode:</span>
                {(["Mixed Mode", "Exam Mode", "Interview Mode", "Viva Mode"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setActiveMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-tight transition-all duration-300 cursor-pointer ${
                      activeMode === mode
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg border border-violet-500/20"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {mode}
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
            <p className="text-sm font-semibold font-mono">Fetching saved questions package...</p>
          </div>
        )}

        {/* ERROR DISPLAY */}
        {error && (
          <Card className="border-red-500/20 bg-red-950/10 p-6 flex flex-col items-center text-center gap-4 no-print">
            <AlertCircle size={32} className="text-red-400" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Questions Engine Alert</h3>
              <p className="text-xs text-red-300 max-w-md">{error}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => fetchQuestionsData(activeMode)} className="border-zinc-800">
              Try Again
            </Button>
          </Card>
        )}

        {/* NO QUESTIONS FOUND - GENERATION CALL-TO-ACTION */}
        {!loading && !questionsData && !generating && !error && (
          <Card className="border-white/5 bg-zinc-950/30 p-10 max-w-xl mx-auto flex flex-col items-center text-center gap-6 no-print shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="mx-auto h-14 w-14 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-md">
              <HelpCircle size={24} className="animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Generate Important Questions ({activeMode})</h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Extract the top 20 most critical conceptual, scenario, and interview-readiness questions along with answer outlines.
              </p>
            </div>
            <Button 
              onClick={handleGenerateQuestions}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border border-violet-500/20 text-xs font-semibold h-10 px-5 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
            >
              <Sparkles size={13} className="mr-1.5" />
              Generate Top 20 Questions
            </Button>
          </Card>
        )}

        {/* CONTENT PANELS (ACTIVE STATE) */}
        {!loading && questionsData && !generating && !error && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* LEFT COLUMN - WORKSPACE MANAGEMENT & EXPORTS */}
            <div className="xl:col-span-1 space-y-6 no-print">
              {/* PRACTICE MODE CARD */}
              <Card className="p-5 border-white/5 bg-zinc-950/40 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 h-28 w-28 bg-violet-600/10 rounded-full blur-2xl" />
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
                      <Award size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-white">Active Practice Mode</h3>
                  </div>
                  
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Hide suggested outlines, sketch your own answers in text boxes, and compare your drafting structure directly for self-testing.
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-xs font-semibold text-zinc-300">Practice Mode</span>
                    <button 
                      onClick={() => setGlobalPracticeMode(!globalPracticeMode)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        globalPracticeMode ? "bg-violet-600" : "bg-zinc-800"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        globalPracticeMode ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                </div>
              </Card>

              {/* INFO PANEL */}
              <h3 className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 font-mono">Questions Metadata</h3>
              <Card className="p-5 border-white/5 bg-zinc-950/40 text-xs font-medium space-y-4">
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-zinc-500">Document Type</span>
                  <span className="text-zinc-200">Lecture Notes</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-zinc-500">Active Mode</span>
                  <span className="text-zinc-200 font-semibold">{activeMode}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-zinc-500">Total Questions</span>
                  <span className="text-zinc-200 font-mono">{questionsData.questions.length}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-500">Generated Date</span>
                  <span className="text-zinc-400 font-mono text-[10px]">
                    {generatedDate ? new Date(generatedDate).toLocaleDateString() : 'Just now'}
                  </span>
                </div>
              </Card>

              {/* ACTION TOOLS */}
              <h3 className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 font-mono">Export utilities</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Copy */}
                <button
                  onClick={handleCopy}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/5 bg-zinc-950/40 hover:bg-zinc-900/60 transition-colors text-center cursor-pointer group"
                >
                  {copied ? (
                    <Check className="text-emerald-400" size={16} />
                  ) : (
                    <Copy className="text-zinc-400 group-hover:text-white transition-colors" size={16} />
                  )}
                  <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200">
                    {copied ? "Copied!" : "Copy Text"}
                  </span>
                </button>

                {/* Download MD */}
                <button
                  onClick={handleDownloadMarkdown}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/5 bg-zinc-950/40 hover:bg-zinc-900/60 transition-colors text-center cursor-pointer group"
                >
                  {downloaded ? (
                    <Check className="text-emerald-400" size={16} />
                  ) : (
                    <Download className="text-zinc-400 group-hover:text-white transition-colors" size={16} />
                  )}
                  <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200">
                    {downloaded ? "Downloaded!" : "Markdown"}
                  </span>
                </button>

                {/* Print Sheet */}
                <button
                  onClick={handlePrint}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/5 bg-zinc-950/40 hover:bg-zinc-900/60 transition-colors text-center cursor-pointer group"
                >
                  <Printer className="text-zinc-400 group-hover:text-white transition-colors" size={16} />
                  <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200">
                    Printable
                  </span>
                </button>

                {/* Regenerate */}
                <button
                  onClick={handleGenerateQuestions}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/5 bg-zinc-950/40 hover:bg-zinc-900/60 transition-colors text-center cursor-pointer group"
                >
                  <RotateCcw className="text-zinc-400 group-hover:text-white transition-colors" size={16} />
                  <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200">
                    Regenerate
                  </span>
                </button>
              </div>

              {/* PRACTICE MODE TIP */}
              {globalPracticeMode && (
                <div className="p-3 border border-violet-500/20 bg-violet-950/15 rounded-xl flex gap-2 text-[10px] text-violet-300 leading-relaxed practice-mode-hint">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <span>
                    Practice Mode is active. Expand cards below to draft your responses. Pressing check compares your text to the model answers outline.
                  </span>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - VISUAL LIST OF QUESTIONS */}
            <div className="xl:col-span-3 space-y-4 print-area">
              <div className="hidden print:block">
                <h1 className="print-title">Important Questions Worksheet</h1>
                <div className="print-meta">
                  Document: {docDetail?.title} | Mode: {activeMode} | Generated Date: {generatedDate ? new Date(generatedDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              <div className="flex justify-between items-center no-print">
                <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 font-mono flex items-center gap-1.5">
                  <Bookmark size={12} />
                  Top Ranked Questions
                </h3>
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950/60 px-2 py-0.5 rounded border border-white/5">
                  Sorted by Relevance
                </span>
              </div>

              <div className="space-y-4">
                {sortedQuestions.map((q, idx) => {
                  const isExpanded = !!expandedQuestions[idx];
                  const scoreDetails = getImportanceDetails(q.importance_score);
                  const isSubmitted = !!submittedPractice[idx];
                  const userDraft = practiceAnswers[idx] || "";

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="print-card"
                    >
                      <Card className="border-white/5 bg-zinc-950/40 hover:border-zinc-800 transition-colors overflow-hidden print:border-none print:bg-transparent">
                        <div 
                          onClick={() => toggleQuestionExpand(idx)}
                          className="p-5 md:p-6 flex items-start gap-4 cursor-pointer select-none no-print"
                        >
                          {/* Circle importance ring */}
                          <div className={`h-11 w-11 shrink-0 rounded-full border-2 flex flex-col items-center justify-center font-mono ${scoreDetails.glowRing} ${scoreDetails.colorClass}`}>
                            <span className="text-[14px] font-bold tracking-tight">{q.importance_score}</span>
                            <span className="text-[7px] uppercase tracking-wider font-bold -mt-0.5">SCORE</span>
                          </div>

                          {/* Question details */}
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider font-mono ${scoreDetails.colorClass}`}>
                                {scoreDetails.label}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider font-mono ${getQuestionTypeBadgeColor(q.type)}`}>
                                {q.type}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-white leading-snug group-hover:text-violet-400">
                              {q.question}
                            </h3>
                          </div>

                          {/* Arrow indicator */}
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-zinc-500 shrink-0 mt-1 self-start"
                          >
                            <ChevronDown size={16} />
                          </motion.div>
                        </div>

                        {/* PRINT ONLY VIEW */}
                        <div className="hidden print:block space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="print-badge">{scoreDetails.label} ({q.importance_score}%)</span>
                            <span className="print-badge">{q.type}</span>
                          </div>
                          <h3 className="text-base font-bold leading-snug text-black">
                            {idx + 1}. {q.question}
                          </h3>
                          <p className="text-xs text-zinc-500 italic">Why it is tested: {q.reason}</p>
                          <div className="print-outline space-y-1.5">
                            <p className="text-xs font-bold text-black uppercase tracking-wider">Suggested Answer Outline:</p>
                            <div className="text-xs text-zinc-800 leading-relaxed mt-1.5">
                              {renderOutlineText(q.answer_outline, true)}
                            </div>
                          </div>
                        </div>

                        {/* EXPANDABLE PORTION */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="border-t border-white/5 bg-zinc-950/20 no-print"
                            >
                              <div className="p-5 md:p-6 space-y-5">
                                {/* Reason block */}
                                <div className="p-3 bg-zinc-950/50 border border-white/5 rounded-xl flex gap-2.5 text-[11px] text-zinc-400 leading-relaxed">
                                  <Info size={14} className="text-violet-400 shrink-0 mt-0.5" />
                                  <div>
                                    <strong className="text-zinc-200">Relevance Context:</strong> {q.reason}
                                  </div>
                                </div>

                                {/* Interactive practice sheet */}
                                {globalPracticeMode ? (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex justify-between">
                                        <span>Draft your response outline</span>
                                        <span className="text-zinc-600 font-mono">{userDraft.length} characters</span>
                                      </label>
                                      <textarea
                                        value={userDraft}
                                        onChange={(e) => setPracticeAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                                        disabled={isSubmitted}
                                        rows={4}
                                        placeholder="Type key bullets, core formulas, or notes here. Test what you can remember..."
                                        className="w-full rounded-xl border border-white/5 bg-zinc-950/50 px-4 py-3 text-xs text-zinc-200 placeholder-zinc-600 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/40 focus:outline-none disabled:opacity-60 transition-colors"
                                      />
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-2">
                                      {!isSubmitted ? (
                                        <Button
                                          size="sm"
                                          onClick={() => handlePracticeSubmit(idx)}
                                          disabled={!userDraft.trim()}
                                          className="h-8 text-[11px] px-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold flex items-center gap-1 cursor-pointer"
                                        >
                                          <Play size={10} />
                                          Check Answer Outline
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          onClick={() => handlePracticeReset(idx)}
                                          className="h-8 text-[11px] px-3 border border-zinc-800 text-zinc-300 font-semibold flex items-center gap-1 cursor-pointer"
                                        >
                                          <RotateCcw size={10} />
                                          Reset Question
                                        </Button>
                                      )}
                                    </div>

                                    {/* Reveal outlines only after user submits */}
                                    <AnimatePresence>
                                      {isSubmitted && (
                                        <motion.div
                                          initial={{ opacity: 0, y: -5 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -5 }}
                                          className="space-y-3 p-4 rounded-xl border border-violet-500/20 bg-violet-950/10"
                                        >
                                          <div className="flex items-center gap-1.5 text-xs text-violet-400 font-bold">
                                            <CheckCircle size={14} />
                                            <span>Suggested Answer Outline</span>
                                          </div>
                                          <p className="text-[10px] text-zinc-500 leading-relaxed">
                                            Review the primary components of a high-scoring answer below:
                                          </p>
                                          <div className="text-xs text-zinc-300 pl-3 border-l border-violet-500/20 py-1 leading-relaxed">
                                            {renderOutlineText(q.answer_outline)}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                ) : (
                                  /* Practice mode inactive, display suggested details immediately */
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold">
                                      <BookOpen size={14} />
                                      <span>Suggested Answer Outline</span>
                                    </div>
                                    <div className="text-xs text-zinc-300 pl-3 border-l border-indigo-500/20 py-1 leading-relaxed">
                                      {renderOutlineText(q.answer_outline)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* LOADING MODAL OVERLAY */}
        <AnimatePresence>
          {generating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 no-print"
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                className="w-full max-w-lg bg-zinc-950/80 border border-violet-500/20 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden"
              >
                <div className="absolute -top-10 -left-10 h-32 w-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="space-y-1.5 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-2">
                    <HelpCircle className="h-6 w-6 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Generating Important Questions</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Running examiner models to compile, rank, and outline the top 20 most critical questions...
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

                {/* Steps checklist */}
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
                            ? "bg-violet-500/20 border-violet-500 text-violet-300 animate-pulse" 
                            : "bg-zinc-900 border-zinc-800 text-zinc-600"
                        }`}>
                          {isDone ? <CheckCircle size={10} /> : idx + 1}
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
