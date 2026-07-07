"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft,
  FileText,
  Clock,
  BookOpen,
  Hash,
  Database,
  Calendar,
  AlertCircle,
  Loader2,
  Trash2,
  ExternalLink,
  Info,
  Sparkles,
  CheckCircle,
  Brain,
  Zap
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Log {
  id: number;
  status: string;
  message: string;
  created_at: string;
}

interface DocumentDetail {
  id: string;
  title: string;
  filename: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  file_size: number;
  processing_status: "idle" | "uploading" | "processing" | "completed" | "failed";
  page_count: number | null;
  estimated_reading_time: number | null;
  word_count: number;
  character_count: number;
  text_preview: string | null;
  created_at: string;
  updated_at: string;
  logs: Log[];
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Smart Summary States
  const [hasSummary, setHasSummary] = useState(false);
  const [checkingSummary, setCheckingSummary] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryStep, setSummaryStep] = useState(0);

  const summarySteps = [
    "Reading Document",
    "Understanding Concepts",
    "Finding Key Topics",
    "Building Learning Experience",
    "Creating Revision Sheet",
    "Generating Questions",
    "Completed"
  ];

  const checkSummaryExists = useCallback(async () => {
    try {
      setCheckingSummary(true);
      const res = await fetch(`${API_URL}/api/document/${id}/summary`);
      if (res.ok) {
        setHasSummary(true);
      } else {
        setHasSummary(false);
      }
    } catch (err) {
      console.error("Error checking summary status:", err);
      setHasSummary(false);
    } finally {
      setCheckingSummary(false);
    }
  }, [id]);

  // Concept Extraction States
  const [hasConcepts, setHasConcepts] = useState(false);
  const [checkingConcepts, setCheckingConcepts] = useState(true);
  const [conceptsLoading, setConceptsLoading] = useState(false);
  const [conceptsError, setConceptsError] = useState<string | null>(null);
  const [conceptsStep, setConceptsStep] = useState(0);

  // Concepts dynamic progress states
  const [conceptsProgress, setConceptsProgress] = useState(0);
  const [subMessageIdx, setSubMessageIdx] = useState(0);

  const dynamicSubMessages = [
    "Contacting AI service engine...",
    "Scanning document layout & vocabulary...",
    "Drafting core concepts explanations...",
    "Establishing dependency prerequisites...",
    "Generating study guides & analogies...",
    "Structuring relationship tree nodes...",
    "Tracing prerequisite learning lines...",
    "Polishing concept relevance scores...",
    "Constructing adjacent connection links..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (conceptsLoading) {
      interval = setInterval(() => {
        setSubMessageIdx((prev) => (prev + 1) % dynamicSubMessages.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [conceptsLoading]);

  const conceptsSteps = [
    "Analyzing Document",
    "Identifying Concepts",
    "Building Knowledge Structure",
    "Finding Relationships",
    "Ranking Importance",
    "Completed"
  ];

  const checkConceptsExist = useCallback(async () => {
    try {
      setCheckingConcepts(true);
      const res = await fetch(`${API_URL}/api/document/${id}/concepts`);
      if (res.ok) {
        setHasConcepts(true);
      } else {
        setHasConcepts(false);
      }
    } catch (err) {
      console.error("Error checking concepts status:", err);
      setHasConcepts(false);
    } finally {
      setCheckingConcepts(false);
    }
  }, [id]);

  const fetchDocumentDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/document/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Document not found.");
        }
        throw new Error("Failed to load document details.");
      }
      const data = await res.json();
      setDoc(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchDocumentDetail();
      checkSummaryExists();
      checkConceptsExist();
    }
  }, [id, fetchDocumentDetail, checkSummaryExists, checkConceptsExist]);

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    setSummaryStep(0);

    // Progressive step loader loop
    const intervalTime = 3000;
    const timer = setInterval(() => {
      setSummaryStep((prev) => {
        if (prev < 5) return prev + 1;
        return prev;
      });
    }, intervalTime);

    try {
      const res = await fetch(`${API_URL}/api/document/${id}/generate-summary`, {
        method: "POST"
      });

      clearInterval(timer);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to generate smart summary.");
      }

      setSummaryStep(6); // Completed!
      setHasSummary(true);

      setTimeout(() => {
        setSummaryLoading(false);
        router.push(`/documents/${id}/summary`);
      }, 1200);

    } catch (err: any) {
      clearInterval(timer);
      console.error(err);
      setSummaryError(err.message || "An unexpected error occurred during summary generation.");
      setSummaryLoading(false);
    }
  };

  const handleExtractConcepts = async () => {
    setConceptsLoading(true);
    setConceptsError(null);
    setConceptsStep(0);
    setConceptsProgress(5);

    const timer = setInterval(() => {
      setConceptsStep((prev) => {
        if (prev < 4) {
          setConceptsProgress((p) => Math.min(p + 15, 80));
          return prev + 1;
        } else {
          // Slow crawl once we hit Stage 5 ("Ranking Importance")
          setConceptsProgress((p) => {
            if (p < 98) return p + 1;
            return p;
          });
          return prev;
        }
      });
    }, 2000);

    try {
      const res = await fetch(`${API_URL}/api/document/${id}/extract-concepts`, {
        method: "POST"
      });

      clearInterval(timer);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to extract concepts.");
      }

      setConceptsStep(5); // Completed!
      setConceptsProgress(100);
      setHasConcepts(true);

      setTimeout(() => {
        setConceptsLoading(false);
        router.push(`/documents/${id}/concepts`);
      }, 1000);

    } catch (err: any) {
      clearInterval(timer);
      console.error(err);
      setConceptsError(err.message || "An unexpected error occurred during concept extraction.");
      setConceptsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!doc) return;
    if (!confirm("Are you sure you want to permanently delete this document and all its extracted contents?")) return;

    try {
      const res = await fetch(`${API_URL}/api/document/${doc.id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Delete operation failed.");
      router.push("/upload");
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete the document.");
    }
  };

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col md:flex-row font-sans">
      {/* SIDEBAR */}
      <Sidebar activeItem="upload" />

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 space-y-8 overflow-y-auto max-h-screen">
        {/* BACK ACTION & HEADER */}
        <div className="space-y-4">
          <Link 
            href="/upload" 
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider font-mono cursor-pointer"
          >
            <ArrowLeft size={14} />
            Back to Library
          </Link>

          {doc && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
              <div className="space-y-1">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <FileText className="text-violet-400 shrink-0" size={24} />
                  {doc.title}
                </h1>
                <p className="text-zinc-500 text-xs font-mono">{doc.filename}</p>
              </div>
              <div className="flex items-center gap-3">
                {doc.processing_status === "completed" && !checkingSummary && (
                  hasSummary ? (
                    <Link href={`/documents/${doc.id}/summary`}>
                      <Button variant="primary" size="sm" className="h-9 px-3 text-xs bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1.5 shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-violet-500/20 font-semibold">
                        <Sparkles size={12} className="animate-pulse" />
                        View Smart Summary
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={handleGenerateSummary}
                      disabled={summaryLoading}
                      className="h-9 px-3 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-[0_0_15px_rgba(139,92,246,0.2)] border border-violet-500/10 font-semibold"
                    >
                      {summaryLoading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Sparkles size={12} />
                      )}
                      Generate Smart Summary
                    </Button>
                  )
                )}
                {doc.processing_status === "completed" && !checkingConcepts && (
                  hasConcepts ? (
                    <Link href={`/documents/${doc.id}/concepts`}>
                      <Button variant="primary" size="sm" className="h-9 px-3 text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-indigo-500/20 font-semibold">
                        <Brain size={12} className="animate-pulse" />
                        View Concepts
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={handleExtractConcepts}
                      disabled={conceptsLoading}
                      className="h-9 px-3 text-xs bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white flex items-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.2)] border border-indigo-500/10 font-semibold"
                    >
                      {conceptsLoading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Brain size={12} />
                      )}
                      Extract Concepts
                    </Button>
                  )
                )}
                {doc.processing_status === "completed" && (
                  <Link href={`/documents/${doc.id}/revision`}>
                    <Button variant="primary" size="sm" className="h-9 px-3 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-violet-500/20 font-semibold">
                      <Zap size={12} />
                      Revision Notes
                    </Button>
                  </Link>
                )}
                <a 
                  href={doc.cloudinary_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="secondary" size="sm" className="h-9 px-3 text-xs border border-zinc-800 flex items-center gap-1.5 text-zinc-300">
                    <ExternalLink size={12} />
                    Original PDF
                  </Button>
                </a>
                <button 
                  onClick={handleDelete}
                  className="h-9 w-9 rounded-lg bg-zinc-900 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-zinc-500 hover:text-red-400 flex items-center justify-center cursor-pointer transition-colors"
                  title="Delete Document"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500">
            <Loader2 className="animate-spin text-violet-500" size={32} />
            <p className="text-sm">Loading document inventory metadata...</p>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <Card className="border-red-500/20 bg-red-950/10 p-6 flex flex-col items-center text-center gap-4">
            <AlertCircle size={32} className="text-red-400" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Failed to retrieve document</h3>
              <p className="text-xs text-red-300 max-w-md">{error}</p>
            </div>
            <Link href="/upload">
              <Button size="sm" variant="secondary" className="border-zinc-800">
                Return to library
              </Button>
            </Link>
          </Card>
        )}

        {/* SUMMARY ERROR DISPLAY */}
        <AnimatePresence>
          {summaryError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-950/15 mb-6"
            >
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-bold text-red-200">Summary Generation Failed</h4>
                <p className="text-xs text-red-300/80 leading-relaxed">{summaryError}</p>
              </div>
              <button 
                onClick={() => setSummaryError(null)}
                className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DETAILS GRID */}
        {doc && !loading && !error && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* LEFT COLUMN - STATS & GENERAL INFO */}
            <div className="lg:col-span-1 space-y-6">
              {/* STATS CARD */}
              <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 font-mono">Statistics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Pages */}
                <Card className="p-4 border-white/5 bg-zinc-950/40 relative overflow-hidden group">
                  <div className="absolute top-3 right-3 text-zinc-600 group-hover:text-violet-400/20 transition-colors">
                    <FileText size={18} />
                  </div>
                  <p className="text-2xl font-bold text-white font-mono">{doc.page_count || 0}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Pages</p>
                </Card>

                {/* Reading Time */}
                <Card className="p-4 border-white/5 bg-zinc-950/40 relative overflow-hidden group">
                  <div className="absolute top-3 right-3 text-zinc-600 group-hover:text-violet-400/20 transition-colors">
                    <Clock size={18} />
                  </div>
                  <p className="text-2xl font-bold text-white font-mono">{doc.estimated_reading_time || 0}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Est. Minutes</p>
                </Card>

                {/* Words */}
                <Card className="p-4 border-white/5 bg-zinc-950/40 relative overflow-hidden group">
                  <div className="absolute top-3 right-3 text-zinc-600 group-hover:text-violet-400/20 transition-colors">
                    <BookOpen size={18} />
                  </div>
                  <p className="text-2xl font-bold text-white font-mono">{doc.word_count.toLocaleString()}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Words</p>
                </Card>

                {/* Characters */}
                <Card className="p-4 border-white/5 bg-zinc-950/40 relative overflow-hidden group">
                  <div className="absolute top-3 right-3 text-zinc-600 group-hover:text-violet-400/20 transition-colors">
                    <Hash size={18} />
                  </div>
                  <p className="text-2xl font-bold text-white font-mono">{doc.character_count.toLocaleString()}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Characters</p>
                </Card>
              </div>

              {/* DOCUMENT INFORMATION */}
              <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 font-mono pt-2">Document Info</h3>
              
              <Card className="p-5 border-white/5 bg-zinc-950/40 space-y-4 text-xs font-medium">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <Database size={12} />
                    File Size
                  </span>
                  <span className="text-zinc-200 font-mono">{formatBytes(doc.file_size)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <Info size={12} />
                    Pipeline Status
                  </span>
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    {doc.processing_status === "completed" ? (
                      <span className="text-emerald-400">Completed</span>
                    ) : doc.processing_status === "processing" ? (
                      <span className="text-violet-400">Processing</span>
                    ) : (
                      <span className="text-red-400">Failed</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <Calendar size={12} />
                    Uploaded At
                  </span>
                  <span className="text-zinc-400 font-mono">
                    {new Date(doc.created_at).toLocaleString()}
                  </span>
                </div>
              </Card>

              {/* PROCESSING LOGS */}
              <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 font-mono pt-2">Pipeline Logs</h3>

              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {doc.logs && doc.logs.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg border border-white/5 bg-zinc-950/20 flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className={`font-mono font-bold uppercase tracking-wider text-[9px] ${
                        log.status === "completed" 
                          ? "text-emerald-400" 
                          : log.status === "failed" 
                          ? "text-red-400" 
                          : "text-violet-400"
                      }`}>
                        {log.status}
                      </span>
                      <span className="text-zinc-600 font-mono">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-zinc-400 leading-normal">{log.message}</p>
                  </div>
                ))}
                {(!doc.logs || doc.logs.length === 0) && (
                  <div className="text-xs text-zinc-600 text-center py-4">No processing logs registered.</div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN - TEXT PREVIEW */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 font-mono flex items-center justify-between">
                <span>Text Preview</span>
                <span className="text-[10px] text-zinc-600 font-normal">First 1,000 characters</span>
              </h3>

              <Card className="border-white/5 bg-zinc-950/40 relative overflow-hidden flex flex-col min-h-[400px]">
                {/* Shadow top/bottom visual decorators */}
                <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-zinc-950/30 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-zinc-950/80 via-zinc-950/40 to-transparent pointer-events-none" />
                
                {/* Content body */}
                <div className="flex-1 p-6 md:p-8 font-mono text-xs text-zinc-300 leading-relaxed overflow-y-auto whitespace-pre-wrap selection:bg-violet-500/30">
                  {doc.text_preview ? (
                    doc.text_preview
                  ) : (
                    <span className="text-zinc-600 italic">No text content extracted for this document.</span>
                  )}
                </div>

                {doc.text_preview && doc.text_preview.length >= 1000 && (
                  <div className="absolute bottom-4 left-0 right-0 text-center z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-950/80 backdrop-blur text-[10px] font-bold text-violet-300 tracking-wide shadow-md">
                      <BookOpen size={10} />
                      Preview Truncated
                    </span>
                  </div>
                )}
              </Card>
            </div>
          </motion.div>
        )}

        {/* CONCEPTS ERROR DISPLAY */}
        <AnimatePresence>
          {conceptsError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-950/15 mb-6"
            >
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-bold text-red-200">Concept Extraction Failed</h4>
                <p className="text-xs text-red-300/80 leading-relaxed">{conceptsError}</p>
              </div>
              <button 
                onClick={() => setConceptsError(null)}
                className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SUMMARY GENERATION PROGRESS MODAL OVERLAY */}
        <AnimatePresence>
          {summaryLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                className="w-full max-w-lg bg-zinc-950/80 border border-violet-500/20 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden"
              >
                {/* Background glow decorator */}
                <div className="absolute -top-10 -left-10 h-32 w-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                
                {/* Heading */}
                <div className="space-y-1.5 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-2">
                    <Sparkles className="h-6 w-6 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Creating Smart Summary</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Translating this document into a structured, high-yield 10-minute learning journey...
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-violet-400 font-mono">Stage {summaryStep + 1} of 7</span>
                    <span className="text-zinc-500 font-mono">
                      {Math.round(((summaryStep + 1) / 7) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${((summaryStep + 1) / 7) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Stepper Steps list */}
                <div className="space-y-3">
                  {summarySteps.map((stepName, idx) => {
                    const isDone = summaryStep > idx;
                    const isActive = summaryStep === idx;

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

        {/* CONCEPT EXTRACTION PROGRESS MODAL OVERLAY */}
        <AnimatePresence>
          {conceptsLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
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
                    <Brain className="h-6 w-6 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Extracting Concept Map</h3>
                  <p className="text-xs text-violet-400 font-mono max-w-sm mx-auto animate-pulse h-4">
                    &rarr; {dynamicSubMessages[subMessageIdx]}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-violet-400 font-mono">Stage {conceptsStep + 1} of 6</span>
                    <span className="text-zinc-500 font-mono">
                      {conceptsProgress}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${conceptsProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {conceptsSteps.map((stepName, idx) => {
                    const isDone = conceptsStep > idx;
                    const isActive = conceptsStep === idx;

                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors duration-300 ${
                          isDone 
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                            : isActive 
                            ? "bg-violet-500/20 border-violet-500 text-violet-300 animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.3)]" 
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
