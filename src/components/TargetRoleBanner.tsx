"use client";

import { useState } from "react";
import { Target, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import type { RoleTarget } from "@/lib/advisorEngine";

export default function TargetRoleBanner() {
    const { targetRole, setTargetRole, data } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(targetRole?.title || "");
    const [industry, setIndustry] = useState(targetRole?.industry || "");
    const [keywordsRaw, setKeywordsRaw] = useState(targetRole?.keywords?.join(", ") || "");
    const [collapsed, setCollapsed] = useState(false);

    if (!data) return null;

    const handleSave = () => {
        if (!title.trim()) return;
        const role: RoleTarget = {
            title: title.trim(),
            industry: industry.trim() || "General",
            keywords: keywordsRaw
                ? keywordsRaw.split(",").map((k) => k.trim()).filter(Boolean)
                : title.toLowerCase().split(" "),
        };
        setTargetRole(role);
        setIsEditing(false);
    };

    const handleClear = () => {
        setTargetRole(null);
        setTitle("");
        setIndustry("");
        setKeywordsRaw("");
        setIsEditing(false);
    };

    // If set and collapsed, show mini bar
    if (targetRole && collapsed) {
        return (
            <div className="flex items-center justify-between px-6 py-2 bg-indigo-600/10 border-b border-indigo-500/20">
                <div className="flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-xs text-indigo-300">
                        Targeting: <strong>{targetRole.title}</strong> in {targetRole.industry}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCollapsed(false)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300"
                    >
                        Expand
                    </button>
                    <button
                        onClick={() => { setIsEditing(true); setCollapsed(false); }}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300"
                    >
                        Change
                    </button>
                </div>
            </div>
        );
    }

    // If set and not editing, show active banner
    if (targetRole && !isEditing) {
        return (
            <div className="px-6 py-3 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-transparent border-b border-indigo-500/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20">
                            <Target className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">
                                {targetRole.title}
                            </p>
                            <p className="text-[11px] text-zinc-400">
                                {targetRole.industry} • {targetRole.keywords.join(", ")}
                            </p>
                        </div>
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                            ACTIVE TARGET
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCollapsed(true)}
                            className="p-1 rounded hover:bg-zinc-800"
                        >
                            <ChevronUp className="h-3.5 w-3.5 text-zinc-500" />
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                        >
                            Change
                        </button>
                        <button
                            onClick={handleClear}
                            className="text-xs text-zinc-600 hover:text-red-400 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Editing or no target set
    return (
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-transparent border-b border-indigo-500/20">
            <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 flex-shrink-0 mt-0.5">
                    <Target className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-white mb-1">
                        {targetRole ? "Update your target role" : "Set your career target"}
                    </p>
                    <p className="text-[11px] text-zinc-500 mb-3">
                        All insights, actions, and recommendations will be tailored to this goal.
                    </p>
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-1">
                                Target Role
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., GRC Analyst, Security Engineer"
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-1">
                                Industry
                            </label>
                            <input
                                type="text"
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                placeholder="e.g., Cybersecurity, Tech"
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-1">
                                Keywords
                            </label>
                            <input
                                type="text"
                                value={keywordsRaw}
                                onChange={(e) => setKeywordsRaw(e.target.value)}
                                placeholder="GRC, compliance, risk"
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                            />
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={!title.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors whitespace-nowrap"
                        >
                            <Check className="h-3.5 w-3.5" />
                            Set Target
                        </button>
                        {targetRole && (
                            <button
                                onClick={() => setIsEditing(false)}
                                className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                            >
                                <X className="h-3.5 w-3.5 text-zinc-500" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
