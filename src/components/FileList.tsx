"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  FileIcon, 
  ImageIcon, 
  FilmIcon, 
  FileTextIcon, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  Calendar, 
  Filter, 
  Clock, 
  ArrowUpDown,
  HardDrive
} from "lucide-react";
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

type DateFilter = "all" | "today" | "week" | "month";
type FileTypeFilter = "all" | "image" | "video" | "document";
type SortOrder = "date-desc" | "date-asc" | "name-asc" | "name-desc" | "size-desc" | "size-asc";

export function FileList({ refreshTrigger }: FileListProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("date-desc");

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
    toast.success("Enlace copiado al portapapeles");
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (["mp4", "webm", "mov"].includes(ext || "")) return <FilmIcon className="h-8 w-8 text-purple-500" />;
    if (["pdf", "doc", "docx", "txt"].includes(ext || "")) return <FileTextIcon className="h-8 w-8 text-orange-500" />;
    return <FileIcon className="h-8 w-8 text-gray-400" />;
  };

  const getFileType = (filename: string): FileTypeFilter => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) return "image";
    if (["mp4", "webm", "mov"].includes(ext || "")) return "video";
    if (["pdf", "doc", "docx", "txt"].includes(ext || "")) return "document";
    return "all"; 
  };

  const getCleanFilename = (key: string) => {
    const filename = key.split("/").pop() || key;
    return filename
      .replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-/, "") 
      .replace(/^\d{6}-[a-z0-9]{5}-/, "") || filename; 
  };

  const getExpirationInfo = (key: string, lastModified: string) => {
    const prefix = key.includes("/") ? key.split("/")[0] : "";
    if (!prefix) return null; 

    const daysMap: Record<string, number> = {
      "1d": 1, "7d": 7, "15d": 15, "1m": 30, "3m": 90, "6m": 180, "1y": 365
    };

    const days = daysMap[prefix];
    if (!days) return null;

    const uploadDate = new Date(lastModified);
    const expirationDate = new Date(uploadDate.getTime() + days * 24 * 60 * 60 * 1000);
    const now = new Date();
    const timeDiff = expirationDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysLeft < 0) return { label: "Expirado", color: "text-red-600 bg-red-50", days: 0 };
    if (daysLeft === 0) return { label: "Expira hoy", color: "text-red-600 bg-red-50", days: 0 };
    if (daysLeft === 1) return { label: "1 día restante", color: "text-orange-600 bg-orange-50", days: 1 };
    if (daysLeft <= 3) return { label: `${daysLeft} días restantes`, color: "text-orange-600 bg-orange-50", days: daysLeft };
    
    return { label: `${daysLeft} días`, color: "text-blue-600 bg-blue-50", days: daysLeft };
  };

  const filteredAndSortedFiles = useMemo(() => {
    let result = files.filter((file) => {
      // 1. Filter by Search Term
      const filename = getCleanFilename(file.key).toLowerCase();
      if (searchTerm && !filename.includes(searchTerm.toLowerCase())) return false;

      // 2. Filter by Type
      const fileType = getFileType(file.key);
      if (typeFilter !== "all" && fileType !== typeFilter) {
        const isDoc = ["pdf", "doc", "docx", "txt"].includes(file.key.split(".").pop()?.toLowerCase() || "");
        if (typeFilter === "document" && !isDoc) return false;
        if (typeFilter !== "document" && fileType !== typeFilter) return false;
      }

      // 3. Filter by Date
      const fileDate = new Date(file.lastModified);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (dateFilter === "today") {
        if (fileDate < today) return false;
      } else if (dateFilter === "week") {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (fileDate < weekAgo) return false;
      } else if (dateFilter === "month") {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (fileDate < monthAgo) return false;
      }

      return true;
    });

    // 4. Sort
    result.sort((a, b) => {
      switch (sortOrder) {
        case "date-desc":
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
        case "date-asc":
          return new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
        case "name-asc":
          return getCleanFilename(a.key).localeCompare(getCleanFilename(b.key));
        case "name-desc":
          return getCleanFilename(b.key).localeCompare(getCleanFilename(a.key));
        case "size-desc":
          return b.size - a.size;
        case "size-asc":
          return a.size - b.size;
        default:
          return 0;
      }
    });

    return result;
  }, [files, searchTerm, dateFilter, typeFilter, sortOrder]);

  const totalSize = useMemo(() => {
    return filteredAndSortedFiles.reduce((acc, file) => acc + file.size, 0);
  }, [filteredAndSortedFiles]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              Archivos Subidos
              <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {filteredAndSortedFiles.length}
              </span>
            </h2>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
              <HardDrive className="h-4 w-4" />
              <span>{formatSize(totalSize)}</span>
            </div>
          </div>
          
          <button
            onClick={fetchFiles}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md"
            title="Actualizar lista"
          >
            <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4">
          
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar archivos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
             {/* Type Filters */}
            <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg overflow-x-auto">
              {(["all", "image", "video", "document"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                    typeFilter === type
                      ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {type === "all" ? "Todos" : type.charAt(0).toUpperCase() + type.slice(1) + "s"}
                </button>
              ))}
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 hover:border-gray-300 transition-colors">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="text-sm border-none bg-transparent focus:ring-0 text-gray-600 cursor-pointer p-0 pr-6"
              >
                <option value="all">Cualquier fecha</option>
                <option value="today">Hoy</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 hover:border-gray-300 transition-colors">
              <ArrowUpDown className="h-4 w-4 text-gray-400" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="text-sm border-none bg-transparent focus:ring-0 text-gray-600 cursor-pointer p-0 pr-6"
              >
                <option value="date-desc">Más recientes</option>
                <option value="date-asc">Más antiguos</option>
                <option value="name-asc">Nombre (A-Z)</option>
                <option value="name-desc">Nombre (Z-A)</option>
                <option value="size-desc">Tamaño (Mayor)</option>
                <option value="size-asc">Tamaño (Menor)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-gray-400 animate-pulse">Cargando archivos...</p>
        </div>
      ) : filteredAndSortedFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="p-4 bg-white rounded-full shadow-sm mb-4">
            <Search className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No se encontraron archivos</h3>
          <p className="text-gray-500 text-sm mt-1">Prueba a ajustar tus filtros de búsqueda</p>
          <button 
            onClick={() => {setSearchTerm(""); setDateFilter("all"); setTypeFilter("all");}}
            className="mt-4 text-blue-600 text-sm font-medium hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedFiles.map((file) => {
            const expiration = getExpirationInfo(file.key, file.lastModified);
            const isImage = getFileType(file.key) === "image";
            const cleanName = getCleanFilename(file.key);

            return (
              <div
                key={file.key}
                className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Preview Area */}
                <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden group-hover:bg-gray-100 transition-colors">
                  {isImage ? (
                    <img
                      src={file.url}
                      alt={cleanName}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="transform group-hover:scale-110 transition-transform duration-300">
                        {getFileIcon(file.key)}
                      </div>
                    </div>
                  )}

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                    <button
                      onClick={() => copyToClipboard(file.url)}
                      className="p-2.5 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-lg transform hover:scale-110 transition-all duration-200"
                      title="Copiar enlace"
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-white/90 hover:bg-white text-blue-600 rounded-full shadow-lg transform hover:scale-110 transition-all duration-200"
                      title="Abrir archivo"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  </div>

                  {/* Expiration Badge */}
                  {expiration && (
                    <div className={cn(
                      "absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1",
                      expiration.color
                    )}>
                      <Clock className="h-3 w-3" />
                      {expiration.label}
                    </div>
                  )}
                </div>

                {/* Info Area */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-800 text-sm truncate w-full" title={cleanName}>
                      {cleanName}
                    </h3>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(file.lastModified).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-md text-gray-500 font-medium">
                      {formatSize(file.size)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
