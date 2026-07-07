"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft,
  Brain,
  Sparkles,
  BookOpen,
  HelpCircle,
  Clock,
  TrendingUp,
  Award,
  Layers,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  BookOpenCheck,
  CheckCircle,
  Network
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Concept {
  id: number;
  document_id: string;
  name: string;
  category: string; // Core Concept, Supporting Concept, Advanced Concept, Interview Concept
  importance_score: number;
  definition: string;
  learning_tips: string | null;
  created_at: string;
}

interface Relationship {
  id: number;
  source_concept_id: number;
  target_concept_id: number;
  relationship_type: string;
}

interface ConceptDetail extends Concept {
  sub_concepts: Concept[];
  parent_concepts: Concept[];
  related_concepts: Concept[];
  prerequisite_concepts: Concept[];
  advanced_concepts: Concept[];
}

export default function DocumentConceptsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [documentTitle, setDocumentTitle] = useState("");
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  
  // Page states
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Extraction states
  const [extracting, setExtracting] = useState(false);
  const [extractionStep, setExtractionStep] = useState(0);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Drawer states
  const [selectedConceptId, setSelectedConceptId] = useState<number | null>(null);
  const [conceptDetail, setConceptDetail] = useState<ConceptDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Progressive crawling loader states
  const [progressPercent, setProgressPercent] = useState(0);
  const [subMessageIdx, setSubMessageIdx] = useState(0);

  const dynamicSubMessages = [
    "Reading document pages...",
    "Running educational theme analysis...",
    "Drafting core concepts definitions...",
    "Resolving parent-child dependencies...",
    "Synthesizing learning tips & analogies...",
    "Constructing adjacent relationship maps...",
    "Tracing prerequisite learning paths...",
    "Polishing knowledge node weights...",
    "Assembling structural concept graph..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (extracting) {
      interval = setInterval(() => {
        setSubMessageIdx((prev) => (prev + 1) % dynamicSubMessages.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [extracting]);

  const extractionSteps = [
    "Analyzing Document",
    "Identifying Concepts",
    "Building Knowledge Structure",
    "Finding Relationships",
    "Ranking Importance",
    "Completed"
  ];

  const fetchConcepts = useCallback(async () => {
    try {
      setPageLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/document/${id}/concepts`);
      
      if (res.status === 404) {
        // Document exists but no concepts extracted yet
        setConcepts([]);
        // We still need the document details to show title
        const docRes = await fetch(`${API_URL}/api/document/${id}`);
        if (docRes.ok) {
          const docData = await docRes.json();
          setDocumentTitle(docData.title);
        }
        setPageLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to load concepts for this document.");
      }

      const data = await res.json();
      setDocumentTitle(data.document_title);
      setConcepts(data.concepts);
      setRelationships(data.relationships);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while loading concepts.");
    } finally {
      setPageLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchConcepts();
    }
  }, [id, fetchConcepts]);

  const handleExtractConcepts = async () => {
    setExtracting(true);
    setExtractionError(null);
    setExtractionStep(0);
    setProgressPercent(5);

    // Progression timer for loading experience steps
    const timer = setInterval(() => {
      setExtractionStep((prev) => {
        if (prev < 4) {
          setProgressPercent((p) => Math.min(p + 15, 80));
          return prev + 1;
        } else {
          // Slow crawl once we hit Stage 5 ("Ranking Importance")
          setProgressPercent((p) => {
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
        throw new Error(errorData.detail || "Failed to extract educational concepts.");
      }

      setExtractionStep(5); // Completed!
      setProgressPercent(100);
      
      // Reload concepts after extraction
      setTimeout(() => {
        setExtracting(false);
        fetchConcepts();
      }, 1000);

    } catch (err: any) {
      clearInterval(timer);
      console.error(err);
      setExtractionError(err.message || "An unexpected error occurred during extraction.");
      setExtracting(false);
    }
  };

  const handleOpenConcept = async (conceptId: number) => {
    setSelectedConceptId(conceptId);
    setDrawerLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/concept/${conceptId}`);
      if (!res.ok) throw new Error("Failed to fetch concept details.");
      const data = await res.json();
      setConceptDetail(data);
    } catch (err) {
      console.error("Error loading concept details:", err);
      setConceptDetail(null);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Group concepts into categories or by score ranges for layout
  const coreConcepts = concepts.filter(c => c.importance_score >= 85);
  const secondaryConcepts = concepts.filter(c => c.importance_score >= 70 && c.importance_score < 85);
  const supportingConcepts = concepts.filter(c => c.importance_score < 70);

  // Framer motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col md:flex-row font-sans relative overflow-x-hidden">
      {/* SIDEBAR */}
      <Sidebar activeItem="learn" />

      {/* MAIN PANEL */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 space-y-8 overflow-y-auto max-h-screen">
        {/* BACK TO DETAIL & ACTION BAR */}
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <Link 
              href={id ? `/documents/${id}` : "/upload"} 
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider font-mono cursor-pointer"
            >
              <ArrowLeft size={14} />
              Back to Document Index
            </Link>

            {concepts.length > 0 && !pageLoading && (
              <Button 
                variant="secondary"
                size="sm"
                onClick={handleExtractConcepts}
                disabled={extracting}
                className="h-8 border-white/10 hover:border-violet-500/30 hover:bg-violet-950/20 text-zinc-300 hover:text-violet-300 text-xs flex items-center gap-1.5 font-semibold font-mono"
              >
                <Sparkles size={11} className={extracting ? "animate-spin" : ""} />
                Re-Extract Concepts
              </Button>
            )}
          </div>

          <div className="border-b border-white/5 pb-4">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Brain className="text-violet-400 shrink-0" size={28} />
              Educational Knowledge Layer
            </h1>
            <p className="text-zinc-500 text-xs mt-1">
              Analyzing educational concepts, dependencies, and learning importance inside {documentTitle || "your document"}
            </p>
          </div>
        </div>

        {/* LOADING EXPERIENCE MODAL */}
        <AnimatePresence>
          {extracting && (
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
                className="w-full max-w-md bg-zinc-950/80 border border-violet-500/20 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(139,92,246,0.15)] space-y-6 relative overflow-hidden"
              >
                {/* Background glow decorators */}
                <div className="absolute -top-10 -left-10 h-32 w-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                
                {/* Header */}
                <div className="space-y-2 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-2">
                    <Brain className="h-6 w-6 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Extracting Concept Map</h3>
                  <p className="text-xs text-violet-400 font-mono max-w-xs mx-auto animate-pulse h-4">
                    &rarr; {dynamicSubMessages[subMessageIdx]}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-violet-400 font-mono">Stage {extractionStep + 1} of 6</span>
                    <span className="text-zinc-500 font-mono">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Steps tracker */}
                <div className="space-y-3 pt-2">
                  {extractionSteps.map((stepName, idx) => {
                    const isDone = extractionStep > idx;
                    const isActive = extractionStep === idx;

                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                          isDone 
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                            : isActive 
                            ? "bg-violet-500/20 border-violet-500 text-violet-300 animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.3)]" 
                            : "bg-zinc-900 border-zinc-800/80 text-zinc-600"
                        }`}>
                          {isDone ? <CheckCircle size={10} /> : idx + 1}
                        </div>
                        <span className={`text-xs font-medium transition-colors duration-300 ${
                          isDone ? "text-zinc-400 font-normal" : isActive ? "text-violet-300 font-bold" : "text-zinc-600"
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

        {/* LOADING CORE INVENTORY */}
        {pageLoading && (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-zinc-500">
            <Loader2 className="animate-spin text-violet-500" size={36} />
            <p className="text-xs font-mono">Retrieving concept catalog...</p>
          </div>
        )}

        {/* ERROR BOUNDARY DISPLAY */}
        {error && (
          <Card className="border-red-500/20 bg-red-950/10 p-6 flex flex-col items-center text-center gap-4">
            <AlertCircle size={32} className="text-red-400" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Extraction Pipeline Error</h3>
              <p className="text-xs text-red-300 max-w-md">{error}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={fetchConcepts} className="border-zinc-800 text-xs">
              Retry Load
            </Button>
          </Card>
        )}

        {/* INITIAL EMPTY STATE (NEEDS EXTRACTION) */}
        {!pageLoading && concepts.length === 0 && !error && !extracting && (
          <Card className="border-white/5 bg-zinc-950/30 p-8 md:p-12 text-center flex flex-col items-center max-w-2xl mx-auto gap-5 relative overflow-hidden group">
            {/* Background grid */}
            <div className="absolute inset-0 bg-grid-pattern opacity-40" />
            <div className="absolute -top-24 -left-24 h-48 w-48 bg-violet-600/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-48 w-48 bg-indigo-600/10 rounded-full blur-3xl" />

            <div className="h-16 w-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 relative z-10 shadow-[0_0_15px_rgba(139,92,246,0.1)] group-hover:scale-105 transition-transform duration-300">
              <Brain size={32} />
            </div>

            <div className="space-y-2 relative z-10 max-w-md">
              <h3 className="text-lg font-bold text-white">No Concepts Extracted Yet</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This document is ready! Run the AI Concept Extraction Engine to compile core definitions, sub-concepts, learning importance scores, and educational pre-requisites.
              </p>
            </div>

            {extractionError && (
              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-[11px] text-red-300 max-w-sm relative z-10 flex gap-2 text-left">
                <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <span>{extractionError}</span>
              </div>
            )}

            <Button 
              onClick={handleExtractConcepts}
              className="relative z-10 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center gap-2 border border-violet-500/10 font-bold shadow-[0_0_20px_rgba(139,92,246,0.25)]"
            >
              <Sparkles size={14} />
              Build Knowledge Graph
            </Button>
          </Card>
        )}

        {/* CONCEPT CARDS & DASHBOARD */}
        {!pageLoading && concepts.length > 0 && !error && (
          <div className="space-y-12">
            {/* HERO STATS OVERVIEW */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 bg-zinc-950/30 border-white/5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <Brain size={18} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white font-mono">{concepts.length}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Total Concepts</p>
                </div>
              </Card>

              <Card className="p-4 bg-zinc-950/30 border-white/5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Network size={18} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white font-mono">{relationships.length / 2}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Dependencies</p>
                </div>
              </Card>

              <Card className="p-4 bg-zinc-950/30 border-white/5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Award size={18} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white font-mono">
                    {concepts.filter(c => c.category === "Core Concept").length}
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Core Foundations</p>
                </div>
              </Card>
            </div>

            {/* CORE / HIGH IMPORTANCE SECTION */}
            {coreConcepts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-l-2 border-violet-500 pl-3">
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-violet-400 font-mono">
                    Core Conceptual Foundations
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-950/40 border border-violet-500/20 text-violet-300 font-bold font-mono">
                    Score &ge; 85
                  </span>
                </div>
                
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  {coreConcepts.map((concept) => (
                    <motion.div 
                      key={concept.id}
                      variants={itemVariants}
                      onClick={() => handleOpenConcept(concept.id)}
                      className="animated-border-card cursor-pointer group shadow-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01]"
                    >
                      {/* Interactive glowing effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      
                      <div className="p-6 md:p-8 space-y-4 relative z-10">
                        {/* Title block */}
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                            {concept.name}
                          </h3>
                          <span className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 font-extrabold tracking-wide uppercase">
                            {concept.category}
                          </span>
                        </div>

                        {/* Definition preview */}
                        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                          {concept.definition}
                        </p>

                        {/* Progress importance indicator */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex justify-between items-center text-[10px] font-bold font-mono">
                            <span className="text-zinc-500 flex items-center gap-1">
                              <TrendingUp size={10} />
                              Learning Importance
                            </span>
                            <span className="text-violet-400">{concept.importance_score}/100</span>
                          </div>
                          <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                            <div 
                              style={{ width: `${concept.importance_score}%` }} 
                              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}

            {/* SECONDARY SECTION */}
            {secondaryConcepts.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 border-l-2 border-indigo-400 pl-3">
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-indigo-400 font-mono">
                    Supporting &amp; Scenario Concepts
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 font-bold font-mono">
                    Score 70-84
                  </span>
                </div>

                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                  {secondaryConcepts.map((concept) => (
                    <motion.div 
                      key={concept.id}
                      variants={itemVariants}
                      onClick={() => handleOpenConcept(concept.id)}
                      className="p-5 rounded-xl border border-white/5 hover:border-indigo-500/30 bg-zinc-950/30 hover:bg-zinc-950/60 transition-all duration-300 cursor-pointer group hover:shadow-[0_0_20px_rgba(99,102,241,0.05)] hover:scale-[1.01] flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-3">
                          <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                            {concept.name}
                          </h3>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 font-bold uppercase shrink-0">
                            {concept.category.replace(" Concept", "")}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-normal line-clamp-3">
                          {concept.definition}
                        </p>
                      </div>

                      <div className="space-y-1.5 pt-4">
                        <div className="flex justify-between items-center text-[9px] font-bold font-mono">
                          <span className="text-zinc-600">Importance</span>
                          <span className="text-indigo-400">{concept.importance_score}%</span>
                        </div>
                        <div className="h-0.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${concept.importance_score}%` }} 
                            className="h-full bg-indigo-500 rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}

            {/* SUPPORTING / ADVANCED SECTION */}
            {supportingConcepts.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 border-l-2 border-zinc-600 pl-3">
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-500 font-mono">
                    Advanced &amp; Adjacent Concepts
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900/60 border border-white/5 text-zinc-500 font-bold font-mono">
                    Score &lt; 70
                  </span>
                </div>

                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {supportingConcepts.map((concept) => (
                    <motion.div 
                      key={concept.id}
                      variants={itemVariants}
                      onClick={() => handleOpenConcept(concept.id)}
                      className="p-4 rounded-xl border border-white/5 hover:border-zinc-500/20 bg-zinc-950/20 hover:bg-zinc-950/40 transition-all duration-200 cursor-pointer group hover:scale-[1.01] flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <h3 className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors line-clamp-1">
                          {concept.name}
                        </h3>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                          {concept.category.replace(" Concept", "")}
                        </p>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-zinc-600 font-mono">Priority:</span>
                        <span className="font-bold font-mono text-zinc-400">{concept.importance_score}%</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* CONCEPT DETAIL DRAWER */}
      <AnimatePresence>
        {selectedConceptId !== null && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedConceptId(null)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />
            {/* Drawer Container */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-[#09090b] border-l border-white/5 shadow-2xl z-50 flex flex-col h-full"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-950/50">
                <span className="flex items-center gap-2 text-violet-400 font-mono text-xs uppercase tracking-wider font-semibold">
                  <Brain size={14} />
                  Concept Intelligence Card
                </span>
                <button 
                  onClick={() => setSelectedConceptId(null)}
                  className="p-1.5 rounded-lg border border-white/5 hover:border-white/10 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {drawerLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-500">
                    <Loader2 className="animate-spin text-violet-500" size={28} />
                    <p className="text-xs font-mono">Resolving relationships...</p>
                  </div>
                ) : conceptDetail ? (
                  <div className="space-y-6">
                    {/* Header info */}
                    <div className="space-y-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-950/40 text-[10px] font-bold text-violet-300 uppercase tracking-wider">
                        {conceptDetail.category}
                      </span>
                      <h2 className="text-2xl font-black text-white leading-tight">
                        {conceptDetail.name}
                      </h2>
                    </div>

                    {/* Importance score breakdown */}
                    <div className="p-4 bg-zinc-950/40 rounded-xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono font-bold">
                        <span className="text-zinc-500">Educational Importance Index</span>
                        <span className="text-violet-400">{conceptDetail.importance_score}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${conceptDetail.importance_score}%` }} 
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-normal font-medium">
                        Based onExam relevance, concept centrality, frequency, and relationship dependencies.
                      </p>
                    </div>

                    {/* Definition */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">Definition</h3>
                      <p className="text-xs text-zinc-300 leading-relaxed p-4 bg-zinc-950/20 border border-white/5 rounded-xl font-medium">
                        {conceptDetail.definition}
                      </p>
                    </div>

                    {/* Learning tips */}
                    {conceptDetail.learning_tips && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">Learning Tips &amp; Analogy</h3>
                        <div className="p-4 bg-violet-950/5 border border-violet-500/10 rounded-xl text-xs text-violet-200/90 leading-relaxed font-medium">
                          {conceptDetail.learning_tips}
                        </div>
                      </div>
                    )}

                    {/* Hierarchy Relationships */}
                    {/* Parent concept */}
                    {conceptDetail.parent_concepts.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">Parent Concept</h3>
                        <div className="space-y-2">
                          {conceptDetail.parent_concepts.map((pc) => (
                            <div 
                              key={pc.id}
                              onClick={() => handleOpenConcept(pc.id)}
                              className="p-3 bg-zinc-950/30 border border-white/5 hover:border-violet-500/20 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:text-white transition-all text-zinc-300 font-semibold group"
                            >
                              <span>{pc.name}</span>
                              <ChevronRight size={12} className="text-zinc-600 group-hover:text-violet-400 transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sub-concepts */}
                    {conceptDetail.sub_concepts.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">Sub Concepts</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {conceptDetail.sub_concepts.map((sub) => (
                            <div 
                              key={sub.id}
                              onClick={() => handleOpenConcept(sub.id)}
                              className="p-3 bg-zinc-950/30 border border-white/5 hover:border-violet-500/20 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:text-white transition-all text-zinc-300 font-semibold group"
                            >
                              <span>{sub.name}</span>
                              <ChevronRight size={12} className="text-zinc-600 group-hover:text-violet-400 transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Prerequisites */}
                    {conceptDetail.prerequisite_concepts.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">Prerequisites</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {conceptDetail.prerequisite_concepts.map((prereq) => (
                            <div 
                              key={prereq.id}
                              onClick={() => handleOpenConcept(prereq.id)}
                              className="p-3 bg-yellow-950/5 border border-yellow-500/10 hover:border-yellow-500/20 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:text-white transition-all text-zinc-300 font-semibold group"
                            >
                              <span className="flex items-center gap-1.5 text-yellow-200/80">
                                <BookOpenCheck size={12} className="text-yellow-500" />
                                {prereq.name}
                              </span>
                              <ChevronRight size={12} className="text-zinc-600 group-hover:text-yellow-400 transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Related concepts */}
                    {conceptDetail.related_concepts.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">Related Concepts</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {conceptDetail.related_concepts.map((rc) => (
                            <div 
                              key={rc.id}
                              onClick={() => handleOpenConcept(rc.id)}
                              className="p-3 bg-indigo-950/5 border border-indigo-500/10 hover:border-indigo-500/20 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:text-white transition-all text-zinc-300 font-semibold group"
                            >
                              <span className="flex items-center gap-1.5 text-indigo-200/80">
                                <Network size={12} className="text-indigo-400" />
                                {rc.name}
                              </span>
                              <ChevronRight size={12} className="text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-xs text-zinc-500 py-12">Failed to load detailed intelligence data.</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
