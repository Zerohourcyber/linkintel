"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Zap,
    MessageSquare,
    Users,
    BarChart3,
    Target,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import { generateActions } from "@/lib/insightEngine";
import type { ActionItem } from "@/lib/types";
import TargetRoleBanner from "@/components/TargetRoleBanner";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    reconnect: Users,
    diversify: BarChart3,
    outreach: Target,
    messaging: MessageSquare,
    networking: Users,
};

const CATEGORY_COLORS: Record<string, string> = {
    reconnect: "border-violet-500/30 bg-violet-500/5",
    diversify: "border-amber-500/30 bg-amber-500/5",
    outreach: "border-cyan-500/30 bg-cyan-500/5",
    messaging: "border-pink-500/30 bg-pink-500/5",
    networking: "border-indigo-500/30 bg-indigo-500/5",
};

function ActionCard({ action }: { action: ActionItem }) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const Icon = CATEGORY_ICONS[action.category] || Zap;

    const handleCopy = useCallback(
        (text: string) => {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        },
        []
    );

    const priorityBadge = {
        high: "bg-red-500/20 text-red-400",
        medium: "bg-amber-500/20 text-amber-400",
        low: "bg-emerald-500/20 text-emerald-400",
    };

    return (
        <div
            className={cn(
                "rounded-xl border p-5 transition-all duration-300 hover:border-zinc-600",
                CATEGORY_COLORS[action.category] || "border-zinc-800 bg-zinc-900/50"
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/80 flex-shrink-0">
                        <Icon className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-white">
                                {action.title}
                            </h3>
                            <span
                                className={cn(
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                                    priorityBadge[action.priority]
                                )}
                            >
                                {action.priority}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-400">{action.description}</p>
                    </div>
                </div>

                <button
                    onClick={() => setExpanded(!expanded)}
                    className="ml-2 flex-shrink-0 p-1 rounded-md hover:bg-zinc-800 transition-colors"
                >
                    {expanded ? (
                        <ChevronUp className="h-4 w-4 text-zinc-400" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-zinc-400" />
                    )}
                </button>
            </div>

            {expanded && (
                <div className="mt-4 pl-[52px] space-y-4">
                    {/* Per-contact personalized messages */}
                    {action.contacts && action.contacts.length > 0 && action.template ? (
                        <div className="space-y-2">
                            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                                Personalized Messages (Ready to Send)
                            </p>
                            {action.contacts.map((contact, i) => {
                                const personalized = action.template!
                                    .replace(/\[Name\]/g, contact.firstName || contact.fullName.split(" ")[0])
                                    .replace(/\[Company\]/g, contact.company)
                                    .replace(/\[Their Focus Area\]/g, contact.position)
                                    .replace(/\[Industry\/Company\]/g, contact.company)
                                    .replace(/\[Industry\]/g, contact.company);

                                return (
                                    <div
                                        key={i}
                                        className="rounded-lg bg-zinc-800/50 border border-zinc-700/30 overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/80 border-b border-zinc-700/30">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 text-[10px] font-bold">
                                                    {contact.firstName[0] || "?"}
                                                    {contact.lastName[0] || ""}
                                                </div>
                                                <div>
                                                    <span className="text-xs text-zinc-200 font-medium">
                                                        {contact.fullName}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-500 ml-1.5">
                                                        {contact.position} at {contact.company}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleCopy(personalized)}
                                                className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20"
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check className="h-2.5 w-2.5" />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-2.5 w-2.5" />
                                                        Copy Message
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <div className="px-3 py-2.5 text-[11px] text-zinc-400 whitespace-pre-line leading-relaxed max-h-24 overflow-y-auto">
                                            {personalized}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <>
                            {/* Contacts without template */}
                            {action.contacts && action.contacts.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                                        Recommended Contacts
                                    </p>
                                    {action.contacts.map((contact, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-3 rounded-lg bg-zinc-800/50 px-3 py-2"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold">
                                                {contact.firstName[0] || "?"}
                                                {contact.lastName[0] || ""}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm text-zinc-200 truncate">
                                                    {contact.fullName}
                                                </p>
                                                <p className="text-xs text-zinc-500 truncate">
                                                    {contact.position} at {contact.company}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Standalone template */}
                            {action.template && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                                            Message Template
                                        </p>
                                        <button
                                            onClick={() => handleCopy(action.template!)}
                                            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="h-3 w-3" />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-3 w-3" />
                                                    Copy
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <div className="rounded-lg bg-zinc-800/50 p-4 text-sm text-zinc-300 whitespace-pre-line font-mono text-xs leading-relaxed">
                                        {action.template}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ActionsPage() {
    const { data, targetRole } = useData();
    const router = useRouter();

    const actions = useMemo(() => {
        if (!data) return [];
        return generateActions(data, targetRole);
    }, [data, targetRole]);

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
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Zap className="h-6 w-6 text-amber-400" />
                        Action Center
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {targetRole
                            ? `Actions tailored for your ${targetRole.title} transition`
                            : "Actionable recommendations to strengthen your network"}
                    </p>
                </div>

                {/* Actions */}
                {actions.length > 0 ? (
                    <div className="space-y-4">
                        {actions.map((action) => (
                            <ActionCard key={action.id} action={action} />
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-64 rounded-xl border border-zinc-800 bg-zinc-900/50">
                        <p className="text-zinc-500">No action items generated.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
