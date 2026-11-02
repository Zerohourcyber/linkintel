"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Brain,
    AlertTriangle,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { useData } from "@/lib/store";
import { generateInsights } from "@/lib/insightEngine";
import InsightCardComponent from "@/components/InsightCard";
import TargetRoleBanner from "@/components/TargetRoleBanner";

export default function IntelPage() {
    const { data, targetRole } = useData();
    const router = useRouter();

    const insights = useMemo(() => {
        if (!data) return [];
        return generateInsights(data, targetRole);
    }, [data, targetRole]);

    const highCount = insights.filter((i) => i.priority === "high").length;
    const mediumCount = insights.filter((i) => i.priority === "medium").length;
    const lowCount = insights.filter((i) => i.priority === "low").length;

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <p className="text-zinc-400">No data loaded.</p>
                    <button
                        onClick={() => router.push("/upload")}
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors"
                    >
                        Upload Data
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <TargetRoleBanner />
            <div className="p-8 space-y-8">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Brain className="h-6 w-6 text-indigo-400" />
                            Transition Intelligence
                        </h1>
                        <p className="text-sm text-zinc-400 mt-1">
                            {targetRole
                                ? `Insights tailored for your ${targetRole.title} goal`
                                : "Strategic insights for your professional transition"}
                        </p>
                    </div>

                    {/* Summary counts */}
                    <div className="flex items-center gap-3">
                        {highCount > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                                <span className="text-sm font-medium text-red-400">{highCount}</span>
                                <span className="text-[10px] text-red-400/70">High</span>
                            </div>
                        )}
                        {mediumCount > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                                <span className="text-sm font-medium text-amber-400">{mediumCount}</span>
                                <span className="text-[10px] text-amber-400/70">Med</span>
                            </div>
                        )}
                        {lowCount > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-sm font-medium text-emerald-400">{lowCount}</span>
                                <span className="text-[10px] text-emerald-400/70">Info</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Insight grid */}
                {insights.length > 0 ? (
                    <div className="space-y-4">
                        {highCount > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-xs font-medium uppercase tracking-wider text-red-400">
                                    ⚠️ High Priority
                                </h2>
                                {insights
                                    .filter((i) => i.priority === "high")
                                    .map((insight) => (
                                        <InsightCardComponent key={insight.id} insight={insight} />
                                    ))}
                            </div>
                        )}

                        {mediumCount > 0 && (
                            <div className="space-y-3 mt-6">
                                <h2 className="text-xs font-medium uppercase tracking-wider text-amber-400">
                                    📋 Medium Priority
                                </h2>
                                {insights
                                    .filter((i) => i.priority === "medium")
                                    .map((insight) => (
                                        <InsightCardComponent key={insight.id} insight={insight} />
                                    ))}
                            </div>
                        )}

                        {lowCount > 0 && (
                            <div className="space-y-3 mt-6">
                                <h2 className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                                    ✅ Informational
                                </h2>
                                {insights
                                    .filter((i) => i.priority === "low")
                                    .map((insight) => (
                                        <InsightCardComponent key={insight.id} insight={insight} />
                                    ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-64 rounded-xl border border-zinc-800 bg-zinc-900/50">
                        <p className="text-zinc-500">No insights available yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
