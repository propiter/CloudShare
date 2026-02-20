"use client";

import React, { useState, useCallback } from "react";
import { useDropzone, FileRejection, DropEvent } from "react-dropzone";
import { UploadCloud, File, X, CheckCircle, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onUploadComplete?: () => void;
}

const RETENTION_OPTIONS = [
  { label: "1 Día", value: "1d/" },
  { label: "1 Semana", value: "7d/" },
  { label: "15 Días", value: "15d/" },
  { label: "1 Mes", value: "1m/" },
  { label: "3 Meses", value: "3m/" },
  { label: "6 Meses", value: "6m/" },
  { label: "1 Año", value: "1y/" },
  { label: "Permanente", value: "" },
];

export function Dropzone({ onUploadComplete }: DropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [retention, setRetention] = useState("1d/");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const removeFile = (fileToRemove: File) => {
    setFiles((prev) => prev.filter((file) => file !== fileToRemove));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);
    let completedCount = 0;

    try {
      // Subir archivos secuencialmente o en paralelo limitado
      const uploadPromises = files.map(async (file) => {
        try {
          // Intentar subida directa primero
          try {
            // 1. Obtener URL prefirmada
            const res = await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                filename: file.name,
                contentType: file.type,
                prefix: retention,
              }),
            });

            if (!res.ok) throw new Error("Error getting upload URL");

            const { uploadUrl, key } = await res.json();

            // 2. Subir archivo a R2
            const uploadRes = await fetch(uploadUrl, {
              method: "PUT",
              body: file,
              headers: {
                "Content-Type": file.type,
              },
            });

            if (!uploadRes.ok) throw new Error("Error uploading file directly");

            completedCount++;
            setProgress((completedCount / files.length) * 100);
            return { status: "success", file, key };
          } catch (directError) {
            console.warn("Direct upload failed, trying proxy upload...", directError);
            
            // Fallback: Subida vía Proxy
            const formData = new FormData();
            formData.append("file", file);
            formData.append("prefix", retention);

            const proxyRes = await fetch("/api/proxy-upload", {
              method: "POST",
              body: formData,
            });

            if (!proxyRes.ok) throw new Error("Proxy upload failed");
            
            const { key } = await proxyRes.json();
            
            completedCount++;
            setProgress((completedCount / files.length) * 100);
            return { status: "success", file, key };
          }
        } catch (error) {
          console.error("Upload error:", error);
          return { status: "error", file, error };
        }
      });

      const results = await Promise.all(uploadPromises);
      
      const errors = results.filter((r) => r.status === "error");
      
      if (errors.length > 0) {
        toast.error(`Failed to upload ${errors.length} files`);
      } else {
        toast.success("All files uploaded successfully!");
        setFiles([]);
        if (onUploadComplete) onUploadComplete();
      }
    } catch (error) {
      console.error("Global upload error:", error);
      toast.error("Something went wrong during upload");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
           <h3 className="text-lg font-medium text-gray-700">Subir Archivos</h3>
           <div className="flex items-center gap-2">
             <Clock className="w-4 h-4 text-gray-500" />
             <select
               value={retention}
               onChange={(e) => setRetention(e.target.value)}
               className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 py-1 pl-2 pr-8"
               disabled={uploading}
             >
               {RETENTION_OPTIONS.map((option) => (
                 <option key={option.value} value={option.value}>
                   {option.label}
                 </option>
               ))}
             </select>
           </div>
        </div>

        <div
          {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors duration-200 ease-in-out",
          isDragActive
            ? "border-blue-500 bg-blue-50/50"
            : "border-gray-300 hover:border-gray-400 bg-gray-50/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2 text-gray-600">
          <UploadCloud className="h-10 w-10 text-gray-400" />
          <p className="text-sm font-medium">
            {isDragActive
              ? "Drop the files here..."
              : "Drag & drop files here, or click to select files"}
          </p>
          <p className="text-xs text-gray-400">
            Supports images, videos, documents, and more
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Selected Files ({files.length})
            </h3>
            <button
              onClick={() => setFiles([])}
              className="text-xs text-red-500 hover:text-red-600"
              disabled={uploading}
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-white border rounded-md shadow-sm"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <File className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {uploading && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={uploadFiles}
            disabled={uploading}
            className={cn(
              "w-full py-2 px-4 rounded-md text-white font-medium transition-colors",
              uploading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-md"
            )}
          >
            {uploading ? (
              <span className="flex items-center justify-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading... {Math.round(progress)}%</span>
              </span>
            ) : (
              "Upload Files"
            )}
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
