"use client";

import { useState } from "react";
import {
    Shield,
    Building2,
    UserSearch,
    TrendingUp,
    GitBranch,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Wrench,
    Award,
    Eye,
    GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InsightCard as InsightCardType } from "@/lib/types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    Shield,
    Building2,
    UserSearch,
    TrendingUp,
    GitBranch,
    AlertTriangle,
    Wrench,
    Award,
    Eye,
    GraduationCap,
};

interface InsightCardProps {
    insight: InsightCardType;
}

export default function InsightCard({ insight }: InsightCardProps) {
    const [expanded, setExpanded] = useState(false);
    const Icon = ICON_MAP[insight.icon] || Shield;

    const priorityColors = {
        high: "border-red-500/30 bg-red-500/5",
        medium: "border-amber-500/30 bg-amber-500/5",
        low: "border-emerald-500/30 bg-emerald-500/5",
    };

    const priorityIconColors = {
        high: "text-red-400",
        medium: "text-amber-400",
        low: "text-emerald-400",
    };

    const priorityBadge = {
        high: "bg-red-500/20 text-red-400",
        medium: "bg-amber-500/20 text-amber-400",
        low: "bg-emerald-500/20 text-emerald-400",
    };

    return (
        <div
            className={cn(
                "rounded-xl border p-5 transition-all duration-300 hover:border-zinc-600 cursor-pointer",
                priorityColors[insight.priority]
            )}
            onClick={() => setExpanded(!expanded)}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/80 flex-shrink-0">
                        <Icon className={cn("h-5 w-5", priorityIconColors[insight.priority])} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-white">
                                {insight.title}
                            </h3>
                            <span
                                className={cn(
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                                    priorityBadge[insight.priority]
                                )}
                            >
                                {insight.priority}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-400">{insight.description}</p>
                    </div>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(!expanded);
                    }}
                    className="ml-2 flex-shrink-0 p-1 rounded-md hover:bg-zinc-800 transition-colors"
                >
                    {expanded ? (
                        <ChevronUp className="h-4 w-4 text-zinc-400" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-zinc-400" />
                    )}
                </button>
            </div>

            {expanded && insight.details.length > 0 && (
                <div className="mt-4 space-y-2 pl-[52px] animate-in fade-in duration-200">
                    {insight.details.map((detail, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-2 text-sm text-zinc-300"
                        >
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                            {detail}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
