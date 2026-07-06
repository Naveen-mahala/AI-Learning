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
  file_name: string;
  file_url: string;
  cloudinary_public_id: string;
  file_size: number;
  page_count: number | null;
  upload_status: "idle" | "uploading" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
}

interface SuccessData {
  title: string;
  pageCount: number;
}

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadStatusMsg, setUploadStatusMsg] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<Document[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Poll processing document status if any
  useEffect(() => {
    if (!processingDocId) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      // Stop polling after 5 minutes (safety net)
      if (attempts > 200) {
        clearInterval(interval);
        setUploadError("Processing timed out. Please check the document list below.");
        setUploadProgress(null);
        setProcessingDocId(null);
        fetchDocuments();
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/documents/${processingDocId}`);
        if (!res.ok) throw new Error("Failed to check status");
        
        const data = await res.json();
        
        // Update log messages for UI feedback
        if (data.logs && data.logs.length > 0) {
          const latestLog = data.logs[data.logs.length - 1];
          setUploadStatusMsg(latestLog.message);
        }

        if (data.upload_status === "completed") {
          clearInterval(interval);
          setUploadProgress(100);
          setUploadStatusMsg("Text compilation complete!");
          
          setTimeout(() => {
            // Trigger confetti
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.8 },
              colors: ["#8b5cf6", "#6366f1", "#10b981"]
            });

            setSuccessData({
              title: data.file_name,
              pageCount: data.page_count || 0
            });
            
            // Clean up States
            setUploadProgress(null);
            setUploadFileName("");
            setProcessingDocId(null);
            fetchDocuments();
          }, 800);

        } else if (data.upload_status === "failed") {
          clearInterval(interval);
          const errorLog = data.logs.find((l: any) => l.status === "failed")?.message || "PDF parsing failed.";
          setUploadError(errorLog);
          setUploadProgress(null);
          setUploadFileName("");
          setProcessingDocId(null);
          fetchDocuments();
        }

      } catch (err: any) {
        console.error("Polling error:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [processingDocId]);

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
    setUploadError(null);
    setSuccessData(null);
    setUploadStatusMsg("Validating document properties...");

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

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Track network upload progress
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            // Cap upload bar at 95% until server returns created document_id
            setUploadProgress(Math.min(percentComplete, 95));
            setUploadStatusMsg(`Uploading file chunk to server (${percentComplete}%)...`);
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

        xhr.open("POST", `${API_URL}/api/documents/upload`);
        xhr.send(formData);
      });

      const result = await uploadPromise;

      // Transition to processing state
      setUploadProgress(95);
      setUploadStatusMsg("Initial upload saved. Cloudinary storage registered.");
      setProcessingDocId(result.document_id);

    } catch (err: any) {
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
      if (processingDocId === id) {
        setProcessingDocId(null);
        setUploadProgress(null);
      }
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
              Content Library
            </h1>
            <p className="text-zinc-500 text-xs sm:text-sm">Upload learning resources.</p>
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
              className="glass-panel border border-emerald-500/20 rounded-xl p-6 bg-gradient-to-r from-emerald-950/15 to-zinc-950/80 space-y-4 relative overflow-hidden"
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
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle size={20} />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-base font-bold text-white">Document Uploaded Successfully</h3>
                  <div className="text-xs text-zinc-400 space-y-1">
                    <p className="font-semibold text-zinc-300 truncate max-w-lg">{successData.title}</p>
                    <div className="grid grid-cols-2 gap-2 mt-3 max-w-xs font-mono text-[10px]">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Pages Extracted: <span className="font-bold text-white">{successData.pageCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Content Stored: <span className="font-bold text-white">True</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 col-span-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Ready For AI Processing: <span className="font-bold text-white">True</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
              accept=".pdf" 
              className="hidden" 
              onChange={handleFileChange}
            />

            <div className="h-14 w-14 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 transition-transform duration-300">
              <UploadCloud size={24} className="text-violet-400" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm sm:text-base font-bold text-white">Drag and drop PDF here, or click to browse</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Supported File Types: PDF only. Maximum file size: 25MB.
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

              <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
                <Loader2 size={10} className="animate-spin text-violet-400 shrink-0" />
                <span>{uploadStatusMsg}</span>
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
                    <th className="p-4 sm:p-5">Document Name</th>
                    <th className="p-4 sm:p-5">Pages</th>
                    <th className="p-4 sm:p-5">Size</th>
                    <th className="p-4 sm:p-5">Status</th>
                    <th className="p-4 sm:p-5">Uploaded Date</th>
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
                            {file.file_url ? (
                              <a 
                                href={file.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="truncate max-w-xs hover:text-violet-400 hover:underline transition-colors"
                              >
                                {file.file_name}
                              </a>
                            ) : (
                              <span className="truncate max-w-xs">{file.file_name}</span>
                            )}
                          </div>
                        </td>
                        {/* Pages */}
                        <td className="p-4 sm:p-5 text-zinc-400">
                          {file.upload_status === "completed" 
                            ? `${file.page_count} pages` 
                            : file.upload_status === "processing" 
                            ? "Extracting..." 
                            : "N/A"}
                        </td>
                        {/* Size */}
                        <td className="p-4 sm:p-5 text-zinc-400">{formatBytes(file.file_size)}</td>
                        {/* Status */}
                        <td className="p-4 sm:p-5">
                          {getStatusBadge(file.upload_status)}
                        </td>
                        {/* Uploaded Date */}
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
                            {file.upload_status === "completed" && (
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
