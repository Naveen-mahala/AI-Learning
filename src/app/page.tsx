"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Sparkles, 
  BookOpen, 
  Cpu, 
  FileText, 
  Brain, 
  CheckCircle, 
  Award, 
  HelpCircle, 
  Terminal, 
  Play, 
  ArrowRight,
  Map
} from "lucide-react";
import { Button } from "@/components/Button";
import { GlowCard } from "@/components/Card";
import { AccordionItem } from "@/components/Accordion";
import { Tabs } from "@/components/Tabs";

// CountUp Component for Stats
interface CountUpProps {
  end: number;
  suffix?: string;
  duration?: number;
}

const CountUp: React.FC<CountUpProps> = ({ end, suffix = "", duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const increment = end / (duration * 60); // 60fps
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 1000 / 60);
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return (
    <span ref={ref} className="font-bold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
      {count.toLocaleString()}{suffix}
    </span>
  );
};

export default function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [demoPrompt, setDemoPrompt] = useState("");
  const [demoResponseState, setDemoResponseState] = useState<"idle" | "typing" | "completed">("idle");
  const [demoResponseText, setDemoResponseText] = useState("");
  const [demoActiveTab, setDemoActiveTab] = useState("overview");
  const [demoQuizSelected, setDemoQuizSelected] = useState<number | null>(null);
  const [showDemoVideo, setShowDemoVideo] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse move handler for Hero Gradient Glow
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Fake AI Streaming logic
  const triggerDemoAI = () => {
    if (demoResponseState !== "idle") return;
    setDemoPrompt("Teach me Gradient Descent in 10 minutes");
    setDemoResponseState("typing");
    
    // Simulate streaming typing
    let i = 0;
    const fullText = "Gradient descent is an optimization algorithm used to minimize some function by iteratively moving in the direction of steepest descent as defined by the negative of the gradient. In machine learning, we use gradient descent to update the parameters of our model (like weights and biases) to minimize a cost/loss function, ensuring our predictions match real-world labels.";
    setDemoResponseText("");
    
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setDemoResponseText((prev) => prev + fullText.charAt(i));
        i++;
      } else {
        clearInterval(interval);
        setDemoResponseState("completed");
      }
    }, 15);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#030303] bg-grid-pattern relative text-zinc-100 overflow-hidden"
      style={{
        "--mouse-x": `${mousePos.x}px`,
        "--mouse-y": `${mousePos.y}px`
      } as React.CSSProperties}
    >
      {/* Background Glows */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-[radial-gradient(600px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(139,92,246,0.08),transparent_50%)] pointer-events-none z-10" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none animate-pulse-slow" />

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)] group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            AI Learning <span className="text-violet-400 font-medium">Accelerator</span>
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#features" className="hover:text-zinc-200 transition-colors">Features</a>
          <a href="#demo" className="hover:text-zinc-200 transition-colors">AI Demo</a>
          <a href="#stats" className="hover:text-zinc-200 transition-colors">Stats</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors mr-2">
            Sign In
          </Link>
          <Link href="/dashboard">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />}>
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-20 pt-20 pb-24 px-6 md:px-12 max-w-6xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-xs font-semibold tracking-wide uppercase shadow-inner">
            <Sparkles size={12} className="animate-pulse" />
            AI-Native Learning Experience
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Learn in <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">10 Minutes</span>. <br />
            Not 3 Hours.
          </h1>

          {/* Subheadline */}
          <p className="text-zinc-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-normal">
            Transform lectures, notes, and study material into personalized, highly structured AI-powered learning accelerators.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-6">
            <Link href="/dashboard">
              <Button variant="gradient" size="lg" className="w-full sm:w-auto font-semibold px-8" rightIcon={<ArrowRight size={18} />}>
                Get Started
              </Button>
            </Link>
            <Button 
              variant="secondary" 
              size="lg" 
              className="w-full sm:w-auto font-semibold px-8 hover:border-zinc-700/50" 
              leftIcon={<Play size={16} fill="currentColor" />}
              onClick={() => setShowDemoVideo(true)}
            >
              Watch Demo
            </Button>
          </div>
        </motion.div>

        {/* Hero Interactive Glow Card / Dash Preview */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mt-16 w-full max-w-4xl rounded-2xl border border-white/5 p-2 bg-zinc-950/40 glass-panel shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative group overflow-hidden"
        >
          {/* Animated border glow accent */}
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 via-transparent to-emerald-500/10 opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
          
          <div className="rounded-xl border border-white/5 overflow-hidden bg-zinc-950/80">
            {/* Fake Dashboard Topbar */}
            <div className="flex justify-between items-center bg-zinc-900/60 px-4 py-3 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/40" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                <div className="w-3 h-3 rounded-full bg-green-500/40" />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-950/60 border border-white/5 text-[11px] text-zinc-500 w-48 justify-center select-none font-mono">
                ai-learning-accelerator.app
              </div>
              <div className="w-12" />
            </div>
            
            {/* Fake Dashboard Preview Layout */}
            <div className="p-4 sm:p-8 flex flex-col md:flex-row gap-6 text-left">
              {/* Fake Sidebar */}
              <div className="w-full md:w-1/4 space-y-4">
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-zinc-800 rounded" />
                  <div className="h-7 w-full bg-zinc-900 border border-white/5 rounded-md flex items-center px-2.5 gap-2">
                    <div className="h-3 w-3 rounded-full bg-violet-500" />
                    <div className="h-2 w-16 bg-zinc-600 rounded" />
                  </div>
                  <div className="h-7 w-full bg-transparent rounded-md flex items-center px-2.5 gap-2">
                    <div className="h-3 w-3 rounded-full bg-zinc-700" />
                    <div className="h-2 w-20 bg-zinc-700 rounded" />
                  </div>
                  <div className="h-7 w-full bg-transparent rounded-md flex items-center px-2.5 gap-2">
                    <div className="h-3 w-3 rounded-full bg-zinc-700" />
                    <div className="h-2 w-14 bg-zinc-700 rounded" />
                  </div>
                </div>
              </div>
              
              {/* Fake Content Area */}
              <div className="flex-1 space-y-6">
                <div className="h-24 bg-gradient-to-r from-violet-950/20 to-indigo-950/20 border border-violet-500/10 rounded-xl p-4 flex flex-col justify-end">
                  <div className="h-4 w-32 bg-white/80 rounded mb-1.5" />
                  <div className="h-2.5 w-48 bg-zinc-400/40 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 glass-panel border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                    <div className="h-4 w-12 bg-zinc-800 rounded" />
                    <div className="h-2.5 w-16 bg-zinc-700 rounded" />
                  </div>
                  <div className="h-24 glass-panel border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                    <div className="h-4 w-16 bg-zinc-800 rounded" />
                    <div className="h-2.5 w-12 bg-zinc-700 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-6xl mx-auto relative z-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Designed for Accelerated Understanding
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Everything you need to digest knowledge, master concepts, and prepare for evaluations at 10x speed.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Teach Me Any Topic */}
          <GlowCard glowColor="from-violet-500/15 to-indigo-500/15">
            <div className="space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                  <Brain size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Teach Me Any Topic</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Enter any concept or subject. The engine structures a personalized deep-dive adapted to your current comprehension level.
                </p>
              </div>
              <div className="pt-2 text-violet-400 text-xs font-semibold flex items-center gap-1 group-hover:text-violet-300">
                Explore Feature <ArrowRight size={12} />
              </div>
            </div>
          </GlowCard>

          {/* Card 2: Lecture Compression */}
          <GlowCard glowColor="from-emerald-500/15 to-teal-500/15">
            <div className="space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <FileText size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Lecture Compression</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Upload slides, transcriptions, or textbooks. Compress a 3-hour long lecture into high-yield summaries in seconds.
                </p>
              </div>
              <div className="pt-2 text-emerald-400 text-xs font-semibold flex items-center gap-1 group-hover:text-emerald-300">
                Explore Feature <ArrowRight size={12} />
              </div>
            </div>
          </GlowCard>

          {/* Card 3: AI Generated Quizzes */}
          <GlowCard glowColor="from-indigo-500/15 to-blue-500/15">
            <div className="space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <HelpCircle size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">AI Generated Quizzes</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Validate your comprehension instantly with quizzes custom-tailored to the learning speed and mode you select.
                </p>
              </div>
              <div className="pt-2 text-indigo-400 text-xs font-semibold flex items-center gap-1 group-hover:text-indigo-300">
                Explore Feature <ArrowRight size={12} />
              </div>
            </div>
          </GlowCard>

          {/* Card 4: Flashcards */}
          <GlowCard glowColor="from-rose-500/15 to-violet-500/15">
            <div className="space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                  <BookOpen size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Interactive Flashcards</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Retain facts using spaced repetition cards auto-generated from your study materials with interactive flip designs.
                </p>
              </div>
              <div className="pt-2 text-rose-400 text-xs font-semibold flex items-center gap-1 group-hover:text-rose-300">
                Explore Feature <ArrowRight size={12} />
              </div>
            </div>
          </GlowCard>

          {/* Card 5: Mind Maps */}
          <GlowCard glowColor="from-blue-500/15 to-emerald-500/15">
            <div className="space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Map size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Interactive Mind Maps</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Synthesize relationships between concepts visually. Jump from macro connections down to granular facts instantly.
                </p>
              </div>
              <div className="pt-2 text-blue-400 text-xs font-semibold flex items-center gap-1 group-hover:text-blue-300">
                Explore Feature <ArrowRight size={12} />
              </div>
            </div>
          </GlowCard>

          {/* Card 6: Interview Preparation */}
          <GlowCard glowColor="from-amber-500/15 to-rose-500/15">
            <div className="space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Award size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Interview Preparation</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Practice simulated viva or tech-interviews based on your study contents with localized constructive AI critique feedback.
                </p>
              </div>
              <div className="pt-2 text-amber-400 text-xs font-semibold flex items-center gap-1 group-hover:text-amber-300">
                Explore Feature <ArrowRight size={12} />
              </div>
            </div>
          </GlowCard>
        </div>
      </section>

      {/* AI DEMO SECTION */}
      <section id="demo" className="py-24 px-6 md:px-12 max-w-4xl mx-auto relative z-20">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Experience AI Learning in Action
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Click the input below to simulate a live AI extraction matching gradient descent variables.
          </p>
        </div>

        {/* Premium Chat Interface */}
        <div className="rounded-2xl border border-white/10 overflow-hidden glass-panel glow-violet">
          {/* Header */}
          <div className="flex justify-between items-center bg-zinc-950/60 px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
              <span className="font-mono text-xs text-zinc-400">SESSION: GRADIENT_DESCENT_10M</span>
            </div>
            <Terminal size={14} className="text-zinc-500" />
          </div>

          {/* Terminal Body */}
          <div className="p-6 space-y-6">
            {/* Input Trigger Block */}
            <div 
              onClick={triggerDemoAI}
              className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                demoResponseState === "idle" 
                  ? "bg-zinc-900/40 border-white/5 hover:border-violet-500/35 hover:bg-zinc-900/70"
                  : "bg-zinc-900/20 border-violet-500/10 cursor-default"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-violet-400 font-mono text-sm">{">"}</span>
                <span className={`text-sm sm:text-base font-medium ${demoPrompt ? "text-white" : "text-zinc-500"}`}>
                  {demoPrompt || "Click to teach: 'Teach me Gradient Descent in 10 minutes'"}
                </span>
              </div>
              {demoResponseState === "idle" && (
                <div className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-violet-500/10 border border-violet-500/20 text-violet-400 animate-pulse">
                  Click to Run
                </div>
              )}
            </div>

            {/* AI Streaming Response Block */}
            <AnimatePresence>
              {demoResponseState !== "idle" && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
                      <Sparkles size={14} className="text-white" />
                    </div>
                    <div className="space-y-4 flex-1">
                      <div className="text-xs font-semibold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                        AI Learning Accelerator
                        {demoResponseState === "typing" && (
                          <span className="inline-flex gap-0.5">
                            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </span>
                        )}
                      </div>
                      <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap select-none border-l-2 border-violet-500/20 pl-3">
                        {demoResponseText}
                      </p>
                    </div>
                  </div>

                  {/* Generated Sub-Modules (Tabs/Accordions) */}
                  {demoResponseState === "completed" && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="pt-6 border-t border-white/5 space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Accelerated Structure</span>
                        <Tabs 
                          options={[
                            { id: "overview", label: "Overview" },
                            { id: "concepts", label: "Key Concepts" },
                            { id: "example", label: "Real Example" },
                            { id: "quiz", label: "Quick Quiz" }
                          ]} 
                          activeTab={demoActiveTab}
                          onChange={setDemoActiveTab}
                          className="bg-zinc-950/80"
                        />
                      </div>

                      {/* Tab Contents */}
                      <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/5 min-h-[180px]">
                        {demoActiveTab === "overview" && (
                          <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="space-y-3"
                          >
                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                              <Cpu size={14} className="text-violet-400" />
                              Gradient Descent Overview
                            </h4>
                            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                              Think of standing at the top of a mountain blindfolded. Your goal is to reach the lowest valley. What do you do? You feel the slope with your feet and take a step in the direction that slopes downward. You repeat this iteratively until you are on flat ground. That is Gradient Descent.
                            </p>
                            <ul className="list-disc pl-4 text-xs text-zinc-500 space-y-1">
                              <li>Function Minimums: Finds coordinates where loss is minimal.</li>
                              <li>Step Size (Learning Rate): Controls length of steps down the slope.</li>
                            </ul>
                          </motion.div>
                        )}

                        {demoActiveTab === "concepts" && (
                          <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="space-y-2"
                          >
                            <AccordionItem title="1. Cost Function (Loss)">
                              A mathematical formula measuring how wrong the AI predictions are. Minimizing cost = maximizing prediction accuracy.
                            </AccordionItem>
                            <AccordionItem title="2. The Gradient">
                              The vector of partial derivatives pointing to the steepest upward direction. Negative gradient points downward.
                            </AccordionItem>
                            <AccordionItem title="3. Learning Rate (Alpha)">
                              How large a step we take. Too small = slow convergence. Too large = overshoot the minimum and fail.
                            </AccordionItem>
                          </motion.div>
                        )}

                        {demoActiveTab === "example" && (
                          <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="space-y-3"
                          >
                            <h4 className="text-sm font-bold text-white">How a Linear Model Learns</h4>
                            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                              Say we want to fit a line <code className="bg-white/5 px-1 py-0.5 rounded text-violet-400 text-xs">y = mx + c</code> to predict house prices. 
                              Initially, we guess <code className="bg-white/5 px-1 py-0.5 rounded text-zinc-300 text-xs">m=0, c=0</code>.
                            </p>
                            <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-lg space-y-1.5 font-mono text-[11px] text-zinc-400">
                              <div>Step 1: Calculate Error (Prediction - Actual)</div>
                              <div>Step 2: Calculate Slope of Error function relative to m and c</div>
                              <div>Step 3: Update: m = m - (Learning Rate * Slope)</div>
                              <div className="text-emerald-400 font-bold">{"=> Line adjusts closer to scatter points on every iteration"}</div>
                            </div>
                          </motion.div>
                        )}

                        {demoActiveTab === "quiz" && (
                          <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="space-y-3"
                          >
                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                              <HelpCircle size={14} className="text-emerald-400" />
                              Check Your Comprehension
                            </h4>
                            <p className="text-xs sm:text-sm text-zinc-400">
                              What happens if your learning rate parameter (alpha) is configured too large?
                            </p>
                            <div className="space-y-2">
                              {[
                                "The algorithm will run extremely slowly.",
                                "It might overshoot the minimum and fail to converge.",
                                "It will hit the minimum in a single step."
                              ].map((option, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setDemoQuizSelected(idx)}
                                  className={`w-full text-left p-3 rounded-lg border text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                                    demoQuizSelected === idx
                                      ? idx === 1
                                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                                        : "bg-red-500/10 border-red-500/40 text-red-300"
                                      : "bg-zinc-900/60 border-white/5 hover:border-zinc-800 hover:bg-zinc-900"
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span>{option}</span>
                                    {demoQuizSelected === idx && (
                                      <span>
                                        {idx === 1 ? (
                                          <CheckCircle size={14} className="text-emerald-400" />
                                        ) : (
                                          <Award size={14} className="text-red-400" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section id="stats" className="py-24 px-6 md:px-12 max-w-6xl mx-auto border-t border-white/5 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 text-center">
          <div className="space-y-2">
            <CountUp end={10000} suffix="+" />
            <p className="text-zinc-500 text-sm uppercase tracking-wider font-semibold">Active Students</p>
          </div>
          <div className="space-y-2">
            <CountUp end={500} suffix="+" />
            <p className="text-zinc-500 text-sm uppercase tracking-wider font-semibold">Accelerated Topics</p>
          </div>
          <div className="space-y-2">
            <CountUp end={95} suffix="%" />
            <p className="text-zinc-500 text-sm uppercase tracking-wider font-semibold">Learning Satisfaction</p>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 px-6 md:px-12 text-center max-w-4xl mx-auto relative z-20">
        <div className="rounded-2xl border border-white/5 bg-gradient-to-tr from-zinc-950 via-zinc-900/50 to-zinc-950 p-8 sm:p-12 space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-emerald-500/5 pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Stop Staring at 3-Hour Lectures. <br />
            Accelerate Your Mind Today.
          </h2>
          <p className="text-zinc-400 max-w-lg mx-auto text-sm sm:text-base">
            Join thousands of students and builders compressing knowledge, crushing exams, and unlocking new skills.
          </p>
          <div className="pt-4">
            <Link href="/dashboard">
              <Button variant="gradient" size="lg" className="w-full sm:w-auto font-semibold px-8" rightIcon={<ArrowRight size={18} />}>
                Start Learning Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/5 text-center text-xs text-zinc-600 relative z-20">
        <p>© 2026 AI Learning Accelerator. Built for Investors & Founders. All Rights Reserved.</p>
      </footer>

      {/* WATCH DEMO VIDEO MODAL DIALOG */}
      <AnimatePresence>
        {showDemoVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemoVideo(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            {/* Dialog Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative glass-panel rounded-2xl max-w-2xl w-full p-1 bg-zinc-950 border border-white/10 z-10 shadow-2xl overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                    <Sparkles className="text-violet-400 animate-pulse" size={18} />
                    AI Learning Accelerator Demo Walkthrough
                  </h3>
                  <button 
                    onClick={() => setShowDemoVideo(false)}
                    className="text-zinc-500 hover:text-zinc-300 text-xs font-semibold px-2.5 py-1 rounded bg-zinc-900 border border-white/5 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                
                {/* Simulated interactive video */}
                <div className="aspect-video rounded-xl bg-zinc-900/80 border border-white/5 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.1),transparent)] pointer-events-none" />
                  
                  {/* Streaming playback visual */}
                  <div className="space-y-4 max-w-sm">
                    <div className="h-12 w-12 rounded-full bg-violet-600 flex items-center justify-center mx-auto text-white shadow-[0_0_20px_rgba(139,92,246,0.6)] animate-pulse">
                      <Sparkles size={20} />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-white">Generating AI Comprehension Maps...</div>
                      <div className="text-xs text-zinc-500 leading-normal">
                        This 3-minute video covers document compression, quiz setups, flashcard reviews, and dashboard tracking.
                      </div>
                    </div>
                    {/* Simulated Loading bar */}
                    <div className="w-48 h-1 bg-zinc-800 rounded-full mx-auto overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 w-3/4 rounded-full animate-[shimmer_1.5s_infinite_linear]" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowDemoVideo(false)}>
                    Close Walkthrough
                  </Button>
                  <Link href="/dashboard" onClick={() => setShowDemoVideo(false)}>
                    <Button variant="primary" size="sm">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
