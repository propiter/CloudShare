"use client";

import { useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { FileList } from "@/components/FileList";
import { Cloud } from "lucide-react";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Cloud className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            CloudShare
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload images, videos, documents, and more. Get a shareable link instantly.
            Secure, fast, and easy.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Upload Files
          </h2>
          <Dropzone onUploadComplete={handleUploadComplete} />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-10">
          <FileList refreshTrigger={refreshTrigger} />
        </div>

        <footer className="text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} CloudShare. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
