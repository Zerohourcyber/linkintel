"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileArchive, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
    onFileSelected: (file: File) => void;
    isProcessing: boolean;
    error: string | null;
    success: boolean;
}

export default function UploadZone({
    onFileSelected,
    isProcessing,
    error,
    success,
}: UploadZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);

            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith(".zip")) {
                setFileName(file.name);
                onFileSelected(file);
            }
        },
        [onFileSelected]
    );

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                setFileName(file.name);
                onFileSelected(file);
            }
        },
        [onFileSelected]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    "relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300",
                    isDragOver
                        ? "border-indigo-500 bg-indigo-500/10 scale-[1.02]"
                        : success
                            ? "border-emerald-500/50 bg-emerald-500/5"
                            : error
                                ? "border-red-500/50 bg-red-500/5"
                                : "border-zinc-700 bg-zinc-900/30 hover:border-zinc-500 hover:bg-zinc-900/60"
                )}
            >
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {/* State rendering */}
                {isProcessing ? (
                    <div className="space-y-4">
                        <Loader2 className="h-12 w-12 mx-auto text-indigo-400 animate-spin" />
                        <div>
                            <p className="text-lg font-medium text-white">
                                Processing your data...
                            </p>
                            <p className="mt-1 text-sm text-zinc-400">
                                Extracting and parsing {fileName}
                            </p>
                        </div>
                        <div className="mx-auto w-48 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                            <div className="h-full rounded-full bg-indigo-500 animate-pulse w-3/4" />
                        </div>
                    </div>
                ) : success ? (
                    <div className="space-y-4">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400" />
                        <div>
                            <p className="text-lg font-medium text-white">
                                Data processed successfully
                            </p>
                            <p className="mt-1 text-sm text-zinc-400">
                                Redirecting to your briefing...
                            </p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="space-y-4">
                        <AlertCircle className="h-12 w-12 mx-auto text-red-400" />
                        <div>
                            <p className="text-lg font-medium text-white">
                                Error processing file
                            </p>
                            <p className="mt-1 text-sm text-red-400">{error}</p>
                            <p className="mt-2 text-xs text-zinc-500">
                                Click to try again
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 ring-1 ring-zinc-700">
                            {isDragOver ? (
                                <FileArchive className="h-8 w-8 text-indigo-400" />
                            ) : (
                                <Upload className="h-8 w-8 text-zinc-400" />
                            )}
                        </div>
                        <div>
                            <p className="text-lg font-medium text-white">
                                {isDragOver
                                    ? "Drop your LinkedIn export here"
                                    : "Upload your LinkedIn data export"}
                            </p>
                            <p className="mt-1 text-sm text-zinc-400">
                                Drag & drop your ZIP file, or click to browse
                            </p>
                        </div>
                        <p className="text-xs text-zinc-600">
                            Accepts .zip files from LinkedIn&apos;s data export
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
