"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  Trash2, 
  ChevronRight, 
  Database,
  AlertTriangle
} from "lucide-react";
import confetti from "canvas-confetti";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

interface UploadedFile {
  id: string;
  title: string;
  type: string;
  size: string;
  status: "Processed" | "Analyzing..." | "Failed";
  updatedAt: string;
  url?: string;
}

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadStatusMsg, setUploadStatusMsg] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [hasLoadedSavedFiles, setHasLoadedSavedFiles] = useState(false);

  // Load files from local storage on mount to prevent hydration mismatch
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ai-learning-uploaded-files");
      if (saved) {
        try {
          setFiles(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved files", e);
        }
      } else {
        const initialMock: UploadedFile[] = [
          {
            id: "file-1",
            title: "Intro_to_Deep_Learning.pdf",
            type: "PDF Document",
            size: "4.8 MB",
            status: "Processed",
            updatedAt: "2 hours ago",
          },
          {
            id: "file-2",
            title: "Linear_Regression_Notes.docx",
            type: "Word Document",
            size: "1.2 MB",
            status: "Processed",
            updatedAt: "Yesterday",
          },
          {
            id: "file-3",
            title: "Database_Normal_Forms.ppt",
            type: "PowerPoint Presentation",
            size: "8.5 MB",
            status: "Processed",
            updatedAt: "3 days ago",
          },
        ];
        setFiles(initialMock);
        localStorage.setItem("ai-learning-uploaded-files", JSON.stringify(initialMock));
      }
      setHasLoadedSavedFiles(true);
    }
  }, []);

  // Save files to local storage when state changes
  useEffect(() => {
    if (hasLoadedSavedFiles && typeof window !== "undefined") {
      localStorage.setItem("ai-learning-uploaded-files", JSON.stringify(files));
    }
  }, [files, hasLoadedSavedFiles]);

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
    setUploadError(null);
    setUploadStatusMsg("Initializing secure Cloudinary upload connection...");

    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(1) + " MB";

    try {
      const formData = new FormData();
      formData.append("file", file);

      // XMLHttp Request to track exact upload progress
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(Math.min(percentComplete, 90)); // cap at 90% until server finishes processing
            if (percentComplete < 50) {
              setUploadStatusMsg("Uploading file buffer to Cloudinary...");
            } else {
              setUploadStatusMsg("Processing asset and extracting document structures...");
            }
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(new Error("Invalid response format from upload server."));
            }
          } else {
            try {
              const errData = JSON.parse(xhr.responseText);
              reject(new Error(errData.error || "Upload failed"));
            } catch {
              reject(new Error(`Server error (${xhr.status})`));
            }
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network upload error")));
        xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      });

      const result = await uploadPromise;

      setUploadProgress(100);
      setUploadStatusMsg("Optimized compiling complete!");

      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.8 },
          colors: ["#8b5cf6", "#6366f1", "#10b981"]
        });

        const newFile: UploadedFile = {
          id: result.publicId || `file-${Date.now()}`,
          title: result.title || file.name,
          type: (result.title || file.name).split(".").pop()?.toUpperCase() + " Document" || "Text Document",
          size: sizeFormatted,
          status: "Processed",
          updatedAt: "Just now",
          url: result.url,
        };

        setFiles((prev) => [newFile, ...prev]);
        setUploadProgress(null);
        setUploadFileName("");
      }, 850);

    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "An unexpected error occurred during upload");
      setUploadProgress(null);
      setUploadFileName("");
    }
  };

  const handleDeleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col md:flex-row">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar activeItem="upload" />

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 space-y-8 overflow-y-auto max-h-screen">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <UploadCloud className="text-violet-400" size={24} />
              Material Compiler
            </h1>
            <p className="text-zinc-500 text-xs sm:text-sm">Compress textbooks, slides, and files into AI-guided summaries.</p>
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

        {/* UPLOAD BOX CARD */}
        <Card interactive={false} className="border-white/5">
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center space-y-4 ${
              dragActive 
                ? "border-violet-500/40 bg-violet-500/5 shadow-[0_0_20px_-5px_rgba(139,92,246,0.15)] scale-[1.01]" 
                : "border-white/5 bg-zinc-950/40 hover:border-violet-500/20 hover:bg-zinc-950/80"
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pdf,.docx,.ppt,.pptx,.txt" 
              className="hidden" 
              onChange={handleFileChange}
            />

            <div className="h-14 w-14 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:scale-105 transition-transform duration-300">
              <UploadCloud size={24} className="text-violet-400" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm sm:text-base font-bold text-white">Drag and drop file here, or click to browse</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Supports PDF, DOCX, PPT, or TXT. Maximum file size 25MB.
              </p>
            </div>
          </div>
        </Card>

        {/* UPLOAD PROGRESS POPUP CARD */}
        <AnimatePresence>
          {uploadProgress !== null && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-panel border border-violet-500/20 rounded-xl p-5 bg-gradient-to-r from-violet-950/10 to-zinc-950 space-y-3 relative overflow-hidden"
            >
              {/* Shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none" />
              
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-violet-400 animate-ping" />
                  <span className="font-semibold text-white truncate max-w-xs">{uploadFileName}</span>
                </div>
                <span className="font-bold text-violet-400">{uploadProgress}%</span>
              </div>

              {/* Progress track */}
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              <div className="text-[10px] text-zinc-500 font-mono">
                {uploadStatusMsg}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* UPLOADED FILES SECTION */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Database size={16} className="text-zinc-500" />
            <h3 className="text-sm uppercase tracking-wider font-bold text-zinc-400">Knowledge Inventory</h3>
          </div>

          {/* Files Table */}
          <div className="rounded-xl border border-white/5 bg-zinc-950/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-zinc-950 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                    <th className="p-4 sm:p-5">Title</th>
                    <th className="p-4 sm:p-5">Format</th>
                    <th className="p-4 sm:p-5">Status</th>
                    <th className="p-4 sm:p-5">Compiled</th>
                    <th className="p-4 sm:p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence initial={false}>
                    {files.map((file) => (
                      <motion.tr 
                        key={file.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        {/* File Name */}
                        <td className="p-4 sm:p-5 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
                              <FileText size={16} className="text-violet-400" />
                            </div>
                            {file.url ? (
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="truncate max-w-xs hover:text-violet-400 hover:underline transition-colors"
                              >
                                {file.title}
                              </a>
                            ) : (
                              <span className="truncate max-w-xs">{file.title}</span>
                            )}
                          </div>
                        </td>
                        {/* Format / Type */}
                        <td className="p-4 sm:p-5 text-zinc-400">{file.type}</td>
                        {/* Status */}
                        <td className="p-4 sm:p-5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold">
                            <CheckCircle size={10} />
                            {file.status}
                          </span>
                        </td>
                        {/* Compiled Date */}
                        <td className="p-4 sm:p-5 text-zinc-500">{file.updatedAt}</td>
                        {/* Action buttons */}
                        <td className="p-4 sm:p-5 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Link href="/learn">
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="h-8 px-3 text-[11px] border border-zinc-800 hover:border-zinc-700/50"
                                rightIcon={<ChevronRight size={10} />}
                              >
                                Learn
                              </Button>
                            </Link>
                            <button 
                              onClick={() => handleDeleteFile(file.id)}
                              className="h-8 w-8 rounded-lg bg-zinc-900 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-zinc-500 hover:text-red-400 flex items-center justify-center cursor-pointer transition-colors"
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
            {files.length === 0 && (
              <div className="p-12 text-center text-zinc-500 text-xs sm:text-sm">
                No documents found in knowledge catalog. Drag files above to build modules.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
