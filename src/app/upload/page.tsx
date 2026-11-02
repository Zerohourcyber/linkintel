"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Shield,
    Lock,
    Eye,
    Server,
    Users,
    MessageSquare,
    Briefcase,
    Wrench,
    GraduationCap,
    Award,
    User,
    Building2,
    CheckCircle2,
} from "lucide-react";
import UploadZone from "@/components/UploadZone";
import { useData } from "@/lib/store";
import { extractFromZip } from "@/lib/zipParser";
import {
    parseConnections,
    parseMessages,
    parsePositions,
    parseSkills,
    parseEducation,
    parseCertifications,
    parseProfile,
    parseCompanyFollows,
} from "@/lib/csvParser";

interface ParseSummary {
    connections: number;
    messages: number;
    positions: number;
    skills: number;
    education: number;
    certifications: number;
    companyFollows: number;
    profileName: string | null;
}

export default function UploadPage() {
    const router = useRouter();
    const { setData, setLoading, setError } = useData();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setLocalError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [summary, setSummary] = useState<ParseSummary | null>(null);

    const handleFileSelected = useCallback(
        async (file: File) => {
            setIsProcessing(true);
            setLocalError(null);
            setLoading(true);

            try {
                const extracted = await extractFromZip(file);
                const connections = parseConnections(extracted.connectionsCSV);

                if (connections.length === 0) {
                    throw new Error(
                        "No valid connections found in Connections.csv. The file may be empty or in an unexpected format."
                    );
                }

                const messages = extracted.messagesCSV
                    ? parseMessages(extracted.messagesCSV)
                    : [];
                const positions = extracted.positionsCSV
                    ? parsePositions(extracted.positionsCSV)
                    : [];
                const skills = extracted.skillsCSV
                    ? parseSkills(extracted.skillsCSV)
                    : [];
                const education = extracted.educationCSV
                    ? parseEducation(extracted.educationCSV)
                    : [];
                const certifications = extracted.certificationsCSV
                    ? parseCertifications(extracted.certificationsCSV)
                    : [];
                const profile = extracted.profileCSV
                    ? parseProfile(extracted.profileCSV)
                    : null;
                const companyFollows = extracted.companyFollowsCSV
                    ? parseCompanyFollows(extracted.companyFollowsCSV)
                    : [];

                setData({
                    connections,
                    messages,
                    hasMessages: messages.length > 0,
                    positions,
                    skills,
                    education,
                    certifications,
                    profile,
                    companyFollows,
                });

                setSummary({
                    connections: connections.length,
                    messages: messages.length,
                    positions: positions.length,
                    skills: skills.length,
                    education: education.length,
                    certifications: certifications.length,
                    companyFollows: companyFollows.length,
                    profileName: profile
                        ? `${profile.firstName} ${profile.lastName}`
                        : null,
                });

                setSuccess(true);
                setIsProcessing(false);

                // Longer delay to show the summary
                setTimeout(() => {
                    router.push("/briefing");
                }, 3500);
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "An unexpected error occurred.";
                setLocalError(errorMessage);
                setError(errorMessage);
                setIsProcessing(false);
                setLoading(false);
            }
        },
        [router, setData, setLoading, setError]
    );

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600">
                        <Shield className="h-7 w-7 text-white" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                    LinkIntel
                </h1>
                <p className="mt-2 text-zinc-400 text-lg">
                    LinkedIn Network Intelligence for Transitioning Professionals
                </p>
            </div>

            {/* Upload zone OR Results summary */}
            {success && summary ? (
                <div className="w-full max-w-2xl mx-auto animate-in fade-in duration-500">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    Data Loaded Successfully
                                </h2>
                                {summary.profileName && (
                                    <p className="text-sm text-emerald-400">
                                        Welcome, {summary.profileName}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <SummaryStat
                                icon={Users}
                                value={summary.connections}
                                label="Connections"
                            />
                            <SummaryStat
                                icon={MessageSquare}
                                value={summary.messages}
                                label="Messages"
                            />
                            <SummaryStat
                                icon={Briefcase}
                                value={summary.positions}
                                label="Positions"
                            />
                            <SummaryStat
                                icon={Wrench}
                                value={summary.skills}
                                label="Skills"
                            />
                            <SummaryStat
                                icon={Award}
                                value={summary.certifications}
                                label="Certifications"
                            />
                            <SummaryStat
                                icon={GraduationCap}
                                value={summary.education}
                                label="Education"
                            />
                            <SummaryStat
                                icon={Building2}
                                value={summary.companyFollows}
                                label="Following"
                            />
                            <SummaryStat
                                icon={User}
                                value={summary.profileName ? 1 : 0}
                                label="Profile"
                            />
                        </div>

                        <div className="mt-6 flex items-center justify-center">
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Redirecting to your briefing...
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <UploadZone
                    onFileSelected={handleFileSelected}
                    isProcessing={isProcessing}
                    error={error}
                    success={false}
                />
            )}

            {/* Privacy assurance */}
            {!success && (
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
                    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                        <Lock className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-xs text-zinc-400">
                            Data processed locally in your browser
                        </span>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                        <Eye className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-xs text-zinc-400">
                            Nothing is stored or transmitted
                        </span>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                        <Server className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-xs text-zinc-400">
                            Zero server-side processing
                        </span>
                    </div>
                </div>
            )}

            {/* Instructions */}
            {!success && (
                <div className="mt-10 max-w-lg text-center">
                    <h3 className="text-sm font-medium text-zinc-300 mb-3">
                        How to get your LinkedIn data:
                    </h3>
                    <ol className="space-y-2 text-xs text-zinc-500 text-left">
                        <li className="flex gap-2">
                            <span className="text-indigo-400 font-mono">1.</span>
                            Go to LinkedIn → Settings → Data Privacy → Get a copy of your data
                        </li>
                        <li className="flex gap-2">
                            <span className="text-indigo-400 font-mono">2.</span>
                            Select &quot;Want something in particular?&quot; and check all boxes
                        </li>
                        <li className="flex gap-2">
                            <span className="text-indigo-400 font-mono">3.</span>
                            Download the ZIP file and upload it here
                        </li>
                    </ol>
                </div>
            )}
        </div>
    );
}

function SummaryStat({
    icon: Icon,
    value,
    label,
}: {
    icon: React.ComponentType<{ className?: string }>;
    value: number;
    label: string;
}) {
    return (
        <div className="rounded-lg bg-zinc-900/50 border border-zinc-800 p-3 text-center">
            <Icon className="h-4 w-4 text-indigo-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{value}</p>
            <p className="text-[11px] text-zinc-500">{label}</p>
        </div>
    );
}
