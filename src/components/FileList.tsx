"use client";

import React, { useEffect, useState } from "react";
import { FileIcon, ImageIcon, FilmIcon, FileTextIcon, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FileItem {
  key: string;
  lastModified: string;
  size: number;
  url: string;
}

interface FileListProps {
  refreshTrigger: number;
}

export function FileList({ refreshTrigger }: FileListProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "image" | "video" | "document">("all");

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/files");
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      setFiles(data);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!");
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (["mp4", "webm", "mov"].includes(ext || "")) return <FilmIcon className="h-5 w-5 text-purple-500" />;
    if (["pdf", "doc", "docx", "txt"].includes(ext || "")) return <FileTextIcon className="h-5 w-5 text-orange-500" />;
    return <FileIcon className="h-5 w-5 text-gray-500" />;
  };

  const getFileType = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) return "image";
    if (["mp4", "webm", "mov"].includes(ext || "")) return "video";
    if (["pdf", "doc", "docx", "txt"].includes(ext || "")) return "document";
    return "other";
  };

  const filteredFiles = files.filter((file) => {
    if (filter === "all") return true;
    return getFileType(file.key) === filter;
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Uploaded Files</h2>
        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
          {(["all", "image", "video", "document"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                filter === type
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}s
            </button>
          ))}
        </div>
        <button
          onClick={fetchFiles}
          className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
          title="Refresh list"
        >
          <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <p className="text-gray-400">No files found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.key}
              className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                {getFileType(file.key) === "image" ? (
                  <img
                    src={file.url}
                    alt={file.key}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    {getFileIcon(file.key)}
                    <span className="text-xs mt-2 uppercase">{file.key.split(".").pop()}</span>
                  </div>
                )}
                
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                  <button
                    onClick={() => copyToClipboard(file.url)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-700 transition-transform hover:scale-110"
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-700 transition-transform hover:scale-110"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
              
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 truncate" title={file.key}>
                  {file.key.split("-").slice(1).join("-") || file.key}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(file.lastModified).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
