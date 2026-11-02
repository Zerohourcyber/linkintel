"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Network,
    Users,
    Building2,
    Shield,
    UserSearch,
    Download,
} from "lucide-react";
import { useData } from "@/lib/store";
import { buildNetworkGraph } from "@/lib/networkBuilder";
import NetworkGraphComponent from "@/components/NetworkGraph";

export default function NetworkPage() {
    const { data } = useData();
    const router = useRouter();
    const [showStats, setShowStats] = useState(true);

    const graph = useMemo(() => {
        if (!data) return null;
        return buildNetworkGraph(data.connections);
    }, [data]);

    const stats = useMemo(() => {
        if (!data) return null;

        const uniqueCompanies = new Set(
            data.connections.map((c) => c.company).filter(Boolean)
        ).size;

        const militaryCount = data.connections.filter((c) => {
            const combined = `${c.position} ${c.company}`.toLowerCase();
            return ["military", "air force", "army", "navy", "marine", "dod", "defense"].some(
                (kw) => combined.includes(kw)
            );
        }).length;

        const recruiterCount = data.connections.filter((c) =>
            /recruiter|recruiting|talent acquisition|staffing/i.test(c.position)
        ).length;

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const recentCount = data.connections.filter(
            (c) => c.connectedOn && c.connectedOn >= oneYearAgo
        ).length;

        return {
            total: data.connections.length,
            companies: uniqueCompanies,
            military: militaryCount,
            civilian: data.connections.length - militaryCount,
            recruiters: recruiterCount,
            recent: recentCount,
        };
    }, [data]);

    if (!data || !graph) {
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
        <div className="h-screen w-full bg-zinc-950 flex flex-col">
            {/* Stats bar */}
            {showStats && stats && (
                <div className="flex-shrink-0 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Network className="h-5 w-5 text-indigo-400" />
                            <h1 className="text-base font-semibold text-white">
                                Network Graph
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <StatBadge icon={Users} value={stats.total} label="Connections" />
                            <StatBadge icon={Building2} value={stats.companies} label="Companies" />
                            <StatBadge icon={Shield} value={stats.military} label="Military" />
                            <StatBadge icon={UserSearch} value={stats.recruiters} label="Recruiters" />
                            <div className="h-6 w-px bg-zinc-800" />
                            <button
                                onClick={() => setShowStats(false)}
                                className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                            >
                                Hide
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Graph */}
            <div className="flex-1 relative">
                <NetworkGraphComponent graph={graph} />

                {/* Show stats button when hidden */}
                {!showStats && (
                    <button
                        onClick={() => setShowStats(true)}
                        className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                        Show Stats
                    </button>
                )}
            </div>
        </div>
    );
}

function StatBadge({
    icon: Icon,
    value,
    label,
}: {
    icon: React.ComponentType<{ className?: string }>;
    value: number;
    label: string;
}) {
    return (
        <div className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-sm font-medium text-white">{value}</span>
            <span className="text-[10px] text-zinc-600">{label}</span>
        </div>
    );
}
