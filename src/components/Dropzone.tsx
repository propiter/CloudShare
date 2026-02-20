"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDropzone, FileRejection, DropEvent } from "react-dropzone";
import { UploadCloud, File, X, CheckCircle, Loader2, Clock, Image as ImageIcon, Film, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onUploadComplete?: () => void;
}

const RETENTION_OPTIONS = [
  { label: "1 Día", value: "1d/", desc: "Expira mañana" },
  { label: "1 Semana", value: "7d/", desc: "Expira en 7 días" },
  { label: "15 Días", value: "15d/", desc: "Expira en 15 días" },
  { label: "1 Mes", value: "1m/", desc: "Expira en 30 días" },
  { label: "3 Meses", value: "3m/", desc: "Larga duración" },
  { label: "6 Meses", value: "6m/", desc: "Semestral" },
  { label: "1 Año", value: "1y/", desc: "Anual" },
  { label: "Permanente", value: "", desc: "Nunca expira" },
];

export function Dropzone({ onUploadComplete }: DropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [retention, setRetention] = useState("1d/");
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    
    // Create previews for images
    acceptedFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(file);
        setPreviews(prev => ({ ...prev, [file.name]: objectUrl }));
      }
    });
  }, []);

  // Cleanup previews
  useEffect(() => {
    return () => {
      Object.values(previews).forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const removeFile = (fileToRemove: File) => {
    setFiles((prev) => prev.filter((file) => file !== fileToRemove));
    if (previews[fileToRemove.name]) {
      URL.revokeObjectURL(previews[fileToRemove.name]);
      setPreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[fileToRemove.name];
        return newPreviews;
      });
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);
    let completedCount = 0;

    try {
      const uploadPromises = files.map(async (file) => {
        try {
          try {
            // 1. Get Presigned URL
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

            // 2. Upload to R2
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
            
            // Fallback: Proxy Upload
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
        toast.error(`Error al subir ${errors.length} archivos`);
      } else {
        toast.success("¡Archivos subidos correctamente!");
        setFiles([]);
        setPreviews({});
        if (onUploadComplete) onUploadComplete();
      }
    } catch (error) {
      console.error("Global upload error:", error);
      toast.error("Ocurrió un error inesperado");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (file.type.startsWith('video/')) return <Film className="h-5 w-5 text-purple-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div>
             <h3 className="text-lg font-semibold text-gray-800">Subir Archivos</h3>
             <p className="text-sm text-gray-500">Arrastra archivos o selecciona para subir</p>
           </div>
           
           <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
             <Clock className="w-4 h-4 text-gray-500 ml-2" />
             <select
               value={retention}
               onChange={(e) => setRetention(e.target.value)}
               className="text-sm border-none bg-transparent focus:ring-0 text-gray-700 font-medium cursor-pointer py-1 pl-2 pr-8"
               disabled={uploading}
               title="Tiempo de vida del archivo"
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
            "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ease-in-out relative overflow-hidden group",
            isDragActive
              ? "border-blue-500 bg-blue-50/50 scale-[0.99]"
              : "border-gray-200 hover:border-blue-400 hover:bg-gray-50/50"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-4 relative z-10">
            <div className={cn(
              "p-4 rounded-full transition-colors duration-300",
              isDragActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500"
            )}>
              <UploadCloud className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700">
                {isDragActive
                  ? "Suelta los archivos aquí..."
                  : "Haz clic o arrastra archivos aquí"}
              </p>
              <p className="text-xs text-gray-400">
                Soporta imágenes, videos, documentos y más
              </p>
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Archivos seleccionados ({files.length})
              </h3>
              <button
                onClick={() => setFiles([])}
                className="text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                disabled={uploading}
              >
                Limpiar todo
              </button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {files.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="h-10 w-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-200 flex items-center justify-center">
                      {previews[file.name] ? (
                        <img src={previews[file.name]} alt={file.name} className="h-full w-full object-cover" />
                      ) : (
                        getFileIcon(file)
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-gray-800 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  {!uploading ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                      title="Eliminar archivo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  )}
                </div>
              ))}
            </div>
            
            <button
              onClick={uploadFiles}
              disabled={uploading}
              className={cn(
                "w-full py-2.5 px-4 rounded-xl text-white font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]",
                uploading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-500/30"
              )}
            >
              {uploading ? (
                <span className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Subiendo... {Math.round(progress)}%</span>
                </span>
              ) : (
                "Subir Archivos"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
