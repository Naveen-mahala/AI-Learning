"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  Trash2, 
  Eye,
  ChevronRight, 
  Database,
  AlertTriangle,
  Loader2,
  Clock,
  X,
  AlertCircle
} from "lucide-react";
import confetti from "canvas-confetti";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Document {
  id: string;
  title: string;
  filename: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  file_size: number;
  page_count: number | null;
  processing_status: "idle" | "uploading" | "processing" | "completed" | "failed";
  word_count?: number;
  character_count?: number;
  created_at: string;
  updated_at: string;
}

interface SuccessData {
  documentId: string;
  title: string;
  pageCount: number;
  wordCount: number;
}

const STEPS = [
  { label: "Uploading PDF", description: "Transferring file to secure Cloudinary storage" },
  { label: "Extracting Content", description: "Parsing page layout and text structures" },
  { label: "Saving Knowledge", description: "Calculating statistics and indexing metadata" },
  { label: "Completed", description: "Document successfully processed for learning" }
];

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Custom stepper steps: 0=uploading, 1=extracting, 2=saving, 3=completed
  const [activeStep, setActiveStep] = useState<number>(0);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<Document[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoadingFiles(true);
      const res = await fetch(`${API_URL}/api/documents`);
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      setFiles(data);
    } catch (e: any) {
      console.error(e);
      setUploadError("Could not connect to document database server.");
    } finally {
      setLoadingFiles(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleUploadFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleUploadFile(file);
    }
  };

  const handleUploadFile = async (file: File) => {
    if (uploadProgress !== null) return;
    
    setUploadFileName(file.name);
    setUploadProgress(0);
    setActiveStep(0);
    setUploadError(null);
    setSuccessData(null);

    // Client-side extension validation
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf") {
      setUploadError("Invalid file format. Only PDF documents (.pdf) are supported.");
      setUploadProgress(null);
      setUploadFileName("");
      return;
    }

    // Client-side size validation (25MB)
    const maxFileSize = 25 * 1024 * 1024;
    if (file.size > maxFileSize) {
      setUploadError("File size exceeds 25MB limit. Please upload a smaller PDF.");
      setUploadProgress(null);
      setUploadFileName("");
      return;
    }

    // Timer refs for simulated stepper states during processing
    let extractingTimer: NodeJS.Timeout;
    let savingTimer: NodeJS.Timeout;

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Setup XMLHttp for upload progress tracking
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            // Cap upload bar at 95% until server starts returning values
            setUploadProgress(Math.min(percentComplete, 95));
            if (percentComplete >= 98) {
              // Once network upload is done, transition stepper to "Extracting Content"
              setActiveStep(1);
              // Setup subsequent visual transitions
              extractingTimer = setTimeout(() => {
                setActiveStep(2); // "Saving Knowledge"
              }, 2500);
            }
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error("Invalid server response format."));
            }
          } else {
            try {
              const errData = JSON.parse(xhr.responseText);
              reject(new Error(errData.detail || "Upload failed."));
            } catch {
              reject(new Error(`Server upload error (HTTP ${xhr.status})`));
            }
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network connection lost during upload.")));
        xhr.addEventListener("abort", () => reject(new Error("Upload aborted.")));

        xhr.open("POST", `${API_URL}/api/upload-pdf`);
        xhr.send(formData);
      });

      const result = await uploadPromise;

      // Clear any simulated timers
      clearTimeout(extractingTimer!);
      clearTimeout(savingTimer!);

      // Complete the progress bars and transition stepper to "Completed"
      setUploadProgress(100);
      setActiveStep(3);

      setTimeout(() => {
        // Trigger confetti celebration
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.75 },
          colors: ["#8b5cf6", "#6366f1", "#10b981"]
        });

        setSuccessData({
          documentId: result.document_id,
          title: file.name.includes(".") ? file.name.substring(0, file.name.lastIndexOf(".")) : file.name,
          pageCount: result.pages || 0,
          wordCount: result.words || 0
        });
        
        // Clean up States
        setUploadProgress(null);
        setUploadFileName("");
        fetchDocuments();
      }, 1000);

    } catch (err: any) {
      clearTimeout(extractingTimer!);
      clearTimeout(savingTimer!);
      console.error(err);
      setUploadError(err.message || "An unexpected error occurred during upload.");
      setUploadProgress(null);
      setUploadFileName("");
    }
  };

  const handleDeleteFile = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/documents/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Delete failed");
      
      // Update list
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete document from catalog.");
    }
  };

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle size={10} />
            Completed
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
            <Loader2 size={10} className="animate-spin" />
            Processing
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-red-500/20 bg-red-500/5 text-red-400 text-[10px] font-bold uppercase tracking-wider">
            <AlertCircle size={10} />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
            <Clock size={10} />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col md:flex-row font-sans">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar activeItem="upload" />

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 space-y-8 overflow-y-auto max-h-screen">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <UploadCloud className="text-violet-400" size={24} />
              Content Library
            </h1>
            <p className="text-zinc-500 text-xs sm:text-sm">Upload learning resources to ingest knowledge maps.</p>
          </div>
        </div>

        {/* ERROR BANNER */}
        <AnimatePresence>
          {uploadError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-950/15"
            >
              <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-bold text-red-200">Upload Failed</h4>
                <p className="text-xs text-red-300/80 leading-relaxed">{uploadError}</p>
              </div>
              <button 
                onClick={() => setUploadError(null)}
                className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SUCCESS COMPILATION STATE SCREEN */}
        <AnimatePresence>
          {successData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel border border-emerald-500/20 rounded-xl p-6 bg-gradient-to-r from-emerald-950/10 to-zinc-950/80 space-y-4 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setSuccessData(null)}
                  className="p-1 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-start gap-4">
                <motion.div 
                  initial={{ scale: 0.5, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0"
                >
                  <CheckCircle size={24} />
                </motion.div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-base font-bold text-white">Document Ingested Successfully</h3>
                  <div className="text-xs text-zinc-400 space-y-1">
                    <p className="font-semibold text-zinc-200 truncate max-w-lg">{successData.title}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 max-w-md font-mono text-[10px]">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Pages: <span className="font-bold text-white ml-1">{successData.pageCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Words: <span className="font-bold text-white ml-1">{successData.wordCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Database Ingestion: <span className="font-bold text-white ml-1">True</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 flex gap-3">
                    <Link href={`/documents/${successData.documentId}`}>
                      <Button variant="secondary" size="sm" className="h-8 text-[11px] px-3 font-semibold">
                        View Extracted Text
                      </Button>
                    </Link>
                    <Button variant="primary" size="sm" className="h-8 text-[11px] px-3 font-semibold bg-violet-600 hover:bg-violet-500" onClick={() => setSuccessData(null)}>
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* UPLOAD BOX CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group"
        >
          {/* Animated Hover Glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-10 transition duration-700 pointer-events-none" />
          
          <Card interactive={false} className="border-white/5 relative bg-zinc-950/40 backdrop-blur-xl overflow-hidden">
            {/* Animated border lines during active drag */}
            {dragActive && (
              <motion.div 
                className="absolute inset-0 border-2 border-dashed border-violet-500/60 rounded-xl pointer-events-none"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              />
            )}
            
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed border-white/5 rounded-xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center space-y-5 ${
                dragActive 
                  ? "bg-violet-500/5 shadow-[0_0_30px_rgba(139,92,246,0.1)] scale-[1.01]" 
                  : "hover:bg-zinc-950/80"
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".pdf" 
                className="hidden" 
                onChange={handleFileChange}
              />

              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="h-16 w-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:border-violet-500/20 group-hover:text-violet-400 transition-colors duration-300"
              >
                <UploadCloud size={28} className="text-violet-400 group-hover:animate-pulse" />
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white tracking-wide">Upload PDF</h2>
                <p className="text-sm text-zinc-400">Drag file here</p>
                <div className="text-xs text-zinc-600 font-medium">or</div>
                <div className="inline-block px-5 py-2 text-xs font-semibold rounded-lg bg-zinc-900 border border-white/5 text-zinc-200 hover:bg-zinc-800 transition-colors">
                  Click to browse
                </div>
                <p className="text-[11px] text-zinc-500 pt-2">
                  Supported: PDF only (Maximum file size: 25MB)
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* UPLOAD PROGRESS POPUP CARD WITH STEPPER */}
        <AnimatePresence>
          {uploadProgress !== null && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-panel border border-violet-500/20 rounded-xl p-6 bg-gradient-to-r from-violet-950/10 to-zinc-950 space-y-5 relative overflow-hidden shadow-xl"
            >
              {/* Top info */}
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-violet-400 animate-ping" />
                  <span className="font-semibold text-white truncate max-w-sm">{uploadFileName}</span>
                </div>
                <span className="font-bold text-violet-400 font-mono">{uploadProgress}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Animated Progress Stepper */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                {STEPS.map((step, idx) => {
                  const isDone = activeStep > idx;
                  const isActive = activeStep === idx;

                  return (
                    <div key={idx} className="flex sm:flex-col items-start gap-3 sm:gap-1.5">
                      <div className="flex items-center gap-2 sm:w-full">
                        {/* Circle step index */}
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                          isDone 
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                            : isActive 
                            ? "bg-violet-500/20 border-violet-500 text-violet-300 animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.15)]" 
                            : "bg-zinc-900 border-zinc-800 text-zinc-500"
                        }`}>
                          {isDone ? <CheckCircle size={12} /> : idx + 1}
                        </div>
                        {/* Connecting Line for desktop */}
                        {idx < 3 && (
                          <div className={`hidden sm:block flex-1 h-[1px] ${
                            isDone ? "bg-emerald-500/30" : isActive ? "bg-violet-500/20 animate-pulse" : "bg-zinc-900"
                          }`} />
                        )}
                      </div>
                      
                      {/* Step Labels */}
                      <div className="space-y-0.5">
                        <p className={`text-xs font-bold transition-colors ${
                          isDone ? "text-emerald-400" : isActive ? "text-violet-300" : "text-zinc-500"
                        }`}>
                          {step.label}
                        </p>
                        <p className="text-[10px] text-zinc-600 hidden sm:block max-w-[130px] leading-tight">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* UPLOADED FILES SECTION */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Database size={16} className="text-zinc-500" />
            <h3 className="text-sm uppercase tracking-wider font-bold text-zinc-400 font-mono">Knowledge Inventory</h3>
          </div>

          {/* Files Table */}
          <div className="rounded-xl border border-white/5 bg-zinc-950/40 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-zinc-950 text-[10px] text-zinc-500 uppercase tracking-wider font-bold font-mono">
                    <th className="p-4 sm:p-5">Title</th>
                    <th className="p-4 sm:p-5">Pages</th>
                    <th className="p-4 sm:p-5">Words</th>
                    <th className="p-4 sm:p-5">Status</th>
                    <th className="p-4 sm:p-5">Created Date</th>
                    <th className="p-4 sm:p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence initial={false}>
                    {files.map((file) => (
                      <motion.tr 
                        key={file.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="hover:bg-white/[0.01] transition-colors"
                      >
                        {/* Title */}
                        <td className="p-4 sm:p-5 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
                              <FileText size={16} className="text-violet-400" />
                            </div>
                            <div className="flex flex-col truncate">
                              <Link 
                                href={`/documents/${file.id}`}
                                className="truncate font-semibold text-zinc-100 hover:text-violet-400 hover:underline transition-colors max-w-xs md:max-w-md block"
                              >
                                {file.title || file.filename}
                              </Link>
                              <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{formatBytes(file.file_size)}</span>
                            </div>
                          </div>
                        </td>
                        {/* Pages */}
                        <td className="p-4 sm:p-5 text-zinc-400 font-medium">
                          {file.page_count !== null ? `${file.page_count} pgs` : "—"}
                        </td>
                        {/* Words */}
                        <td className="p-4 sm:p-5 text-zinc-400 font-medium">
                          {file.word_count !== undefined ? file.word_count.toLocaleString() : "—"}
                        </td>
                        {/* Status */}
                        <td className="p-4 sm:p-5">
                          {getStatusBadge(file.processing_status)}
                        </td>
                        {/* Created Date */}
                        <td className="p-4 sm:p-5 text-zinc-500">
                          {new Date(file.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        {/* Action buttons */}
                        <td className="p-4 sm:p-5 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Link href={`/documents/${file.id}`}>
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="h-8 px-3 text-[11px] border border-zinc-800 hover:border-zinc-700/50 flex items-center gap-1 text-zinc-300"
                              >
                                <Eye size={12} />
                                View Details
                              </Button>
                            </Link>
                            {file.processing_status === "completed" && (
                              <Link href={`/learn?id=${file.id}`}>
                                <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  className="h-8 px-3 text-[11px] border border-zinc-800 hover:border-zinc-700/50"
                                  rightIcon={<ChevronRight size={10} />}
                                >
                                  Learn
                                </Button>
                              </Link>
                            )}
                            <button 
                              onClick={() => handleDeleteFile(file.id)}
                              className="h-8 w-8 rounded-lg bg-zinc-900 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-zinc-500 hover:text-red-400 flex items-center justify-center cursor-pointer transition-colors"
                              title="Delete Document"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Empty block fallback */}
            {!loadingFiles && files.length === 0 && (
              <div className="p-12 text-center text-zinc-500 text-xs sm:text-sm">
                No documents found in knowledge catalog. Drag files above to build modules.
              </div>
            )}

            {/* Loading block fallback */}
            {loadingFiles && files.length === 0 && (
              <div className="p-12 text-center text-zinc-500 text-xs sm:text-sm flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-violet-400" />
                Loading inventory catalog...
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
