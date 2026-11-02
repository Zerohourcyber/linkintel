"use client";

import { useState, useCallback, useMemo } from "react";
import {
    Target,
    PenTool,
    Copy,
    Check,
    Loader2,
    RefreshCw,
    Sparkles,
    ArrowRight,
    Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import { useRouter } from "next/navigation";
import type { RoleTarget } from "@/lib/advisorEngine";
import { generatePostViaAPI } from "@/lib/openaiClient";

export default function AdvisorPage() {
    const { data, targetRole, setTargetRole } = useData();
    const router = useRouter();

    const [targetTitle, setTargetTitle] = useState(targetRole?.title || "");
    const [targetIndustry, setTargetIndustry] = useState(targetRole?.industry || "");
    const [targetKeywordsRaw, setTargetKeywordsRaw] = useState(targetRole?.keywords?.join(", ") || "");
    const [roleSet, setRoleSet] = useState(!!targetRole);

    const [postTopic, setPostTopic] = useState("");
    const [postTone, setPostTone] = useState("professional");
    const [generatedPost, setGeneratedPost] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const targetRoleLocal: RoleTarget | undefined = useMemo(() => {
        if (!roleSet || !targetTitle) return undefined;
        return {
            title: targetTitle,
            industry: targetIndustry || "General",
            keywords: targetKeywordsRaw
                ? targetKeywordsRaw
                    .split(",")
                    .map((k) => k.trim())
                    .filter(Boolean)
                : targetTitle.toLowerCase().split(" "),
        };
    }, [roleSet, targetTitle, targetIndustry, targetKeywordsRaw]);


    // Generate smart topic suggestions from career data
    const suggestedTopics = useMemo(() => {
        if (!data) return [];
        const topics: string[] = [];

        // From positions
        if (data.positions.length > 0) {
            const currentPos = data.positions.find((p) => p.isCurrent);
            if (currentPos) {
                topics.push(`Lessons from my role as ${currentPos.title}`);
            }
            if (data.positions.length > 1) {
                topics.push(
                    `My career journey: ${data.positions.map((p) => p.title).slice(0, 3).join(" → ")}`
                );
            }
        }

        // From skills
        if (data.skills.length > 0) {
            const topSkills = data.skills.slice(0, 3).map((s) => s.name);
            topics.push(`Why ${topSkills[0]} matters in today's job market`);
            if (topSkills.length > 1) {
                topics.push(`How ${topSkills[0]} and ${topSkills[1]} intersect`);
            }
        }

        // From certifications
        if (data.certifications.length > 0) {
            topics.push(
                `How getting ${data.certifications[0].name} changed my career`
            );
        }

        // Transition-specific
        if (data.positions.some((p) => /military|air force|army|navy/i.test(p.companyName))) {
            topics.push("What I learned transitioning from military to civilian");
            topics.push("5 military skills that translate to the private sector");
        }

        // Target role specific
        if (targetRoleLocal) {
            topics.push(`Why I'm excited about the ${targetRoleLocal.title} space`);
            topics.push(`What companies should look for in a ${targetRoleLocal.title}`);
        }

        // Network-based
        topics.push(`Building a network of ${data.connections.length}+ professionals`);

        return topics.slice(0, 6);
    }, [data, targetRoleLocal]);

    const handleSetRole = useCallback(() => {
        if (targetTitle.trim()) {
            setRoleSet(true);
            // Sync to global store
            setTargetRole({
                title: targetTitle.trim(),
                industry: targetIndustry.trim() || "General",
                keywords: targetKeywordsRaw
                    ? targetKeywordsRaw.split(",").map((k) => k.trim()).filter(Boolean)
                    : targetTitle.toLowerCase().split(" "),
            });
        }
    }, [targetTitle, targetIndustry, targetKeywordsRaw, setTargetRole]);

    const handleGeneratePost = useCallback(async () => {
        if (!data || !postTopic.trim()) return;
        setIsGenerating(true);
        setGeneratedPost("");
        try {
            const post = await generatePostViaAPI(
                postTopic,
                postTone,
                data,
                targetRoleLocal
            );
            setGeneratedPost(post);
        } catch (err) {
            setGeneratedPost(
                `Error: ${err instanceof Error ? err.message : "Unknown error"}`
            );
        } finally {
            setIsGenerating(false);
        }
    }, [data, postTopic, postTone, targetRoleLocal]);

    const handleCopyPost = useCallback(() => {
        navigator.clipboard.writeText(generatedPost);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [generatedPost]);

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
        <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Brand Buddy
                        </h1>
                        <p className="text-sm text-zinc-400 mt-1">
                            Build your personal brand, generate content, and position yourself
                            for your target role.
                        </p>
                    </div>
                </div>

                {/* Target Role Card */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                        <Target className="h-5 w-5 text-indigo-400" />
                        Target Role
                    </h2>
                    {roleSet && targetRoleLocal ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-indigo-600/10 border border-indigo-500/20 px-5 py-3">
                                    <p className="text-base font-semibold text-indigo-400">
                                        {targetRoleLocal.title}
                                    </p>
                                    <p className="text-xs text-zinc-400 mt-0.5">
                                        {targetRoleLocal.industry} •{" "}
                                        {targetRoleLocal.keywords.join(", ")}
                                    </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-zinc-600" />
                                <p className="text-sm text-zinc-400">
                                    All AI advice is tailored to this role
                                </p>
                            </div>
                            <button
                                onClick={() => setRoleSet(false)}
                                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                Change
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            <input
                                type="text"
                                value={targetTitle}
                                onChange={(e) => setTargetTitle(e.target.value)}
                                placeholder="Role title, e.g. GRC Analyst"
                                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                            />
                            <input
                                type="text"
                                value={targetIndustry}
                                onChange={(e) =>
                                    setTargetIndustry(e.target.value)
                                }
                                placeholder="Industry, e.g. Cybersecurity"
                                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                            />
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={targetKeywordsRaw}
                                    onChange={(e) =>
                                        setTargetKeywordsRaw(e.target.value)
                                    }
                                    placeholder="Keywords: GRC, compliance, risk"
                                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                                />
                                <button
                                    onClick={handleSetRole}
                                    disabled={!targetTitle.trim()}
                                    className="px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors whitespace-nowrap"
                                >
                                    Set
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Post Generator */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                        <PenTool className="h-5 w-5 text-amber-400" />
                        LinkedIn Post Generator
                    </h2>

                    <div className="space-y-4">
                        {/* Suggested Topics */}
                        {suggestedTopics.length > 0 && !postTopic && (
                            <div>
                                <label className="text-xs text-zinc-500 mb-2 block uppercase tracking-wider flex items-center gap-1.5">
                                    <Lightbulb className="h-3 w-3 text-amber-400" />
                                    Suggested Topics (from your career)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedTopics.map((topic, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPostTopic(topic)}
                                            className="text-[12px] px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all text-left"
                                        >
                                            {topic}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-xs text-zinc-500 mb-1.5 block uppercase tracking-wider">
                                Topic
                            </label>
                            <input
                                type="text"
                                value={postTopic}
                                onChange={(e) => setPostTopic(e.target.value)}
                                placeholder="e.g., Lessons from my military-to-tech transition"
                                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-zinc-500 mb-1.5 block uppercase tracking-wider">
                                Tone
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    "professional",
                                    "inspirational",
                                    "educational",
                                    "conversational",
                                    "thought-leader",
                                ].map((tone) => (
                                    <button
                                        key={tone}
                                        onClick={() => setPostTone(tone)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all",
                                            postTone === tone
                                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                                                : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500"
                                        )}
                                    >
                                        {tone}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGeneratePost}
                            disabled={!postTopic.trim() || isGenerating}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-medium hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 disabled:hover:from-amber-600 disabled:hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
                        >
                            {isGenerating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <PenTool className="h-4 w-4" />
                            )}
                            {isGenerating ? "Generating..." : "Generate Post"}
                        </button>
                    </div>

                    {generatedPost && (
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                    Your Post
                                </span>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCopyPost}
                                        className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="h-3.5 w-3.5" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-3.5 w-3.5" />{" "}
                                                Copy
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleGeneratePost}
                                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" />{" "}
                                        Regenerate
                                    </button>
                                </div>
                            </div>
                            <div className="rounded-xl bg-zinc-800/80 border border-zinc-700/50 p-5 text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                                {generatedPost}
                            </div>
                        </div>
                    )}
                </div>

                {/* Brand Checklist */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
                    <h2 className="text-base font-semibold text-white">
                        ✅ Brand Building Checklist
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            {
                                label: "Professional headshot",
                                tip: "2.5x more profile views",
                            },
                            {
                                label: "Custom headline",
                                tip: data.profile?.headline
                                    ? `Current: "${data.profile.headline.substring(0, 30)}..."`
                                    : "Not just your job title — your value prop",
                            },
                            {
                                label: "Compelling About section",
                                tip: data.profile?.summary
                                    ? `${data.profile.summary.length} chars — ${data.profile.summary.length > 200 ? "looks good!" : "needs more detail"}`
                                    : "Tell your story with a CTA",
                            },
                            {
                                label: "Featured section",
                                tip: "Pin your best work and articles",
                            },
                            {
                                label: "3+ recommendations",
                                tip: "Social proof from credible contacts",
                            },
                            {
                                label: "Skills section optimized",
                                tip: data.skills.length > 0
                                    ? `${data.skills.length} skills listed — add more for ${targetRole?.title || "target role"}`
                                    : `Add skills for ${targetRole?.title || "target role"}`,
                            },
                            {
                                label: "Post 2-3x per week",
                                tip: "Consistency over virality",
                            },
                            {
                                label: "Engage daily",
                                tip: "5+ thoughtful comments per day",
                            },
                        ].map((item, i) => (
                            <label
                                key={i}
                                className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/30 cursor-pointer transition-all group"
                            >
                                <input
                                    type="checkbox"
                                    className="mt-0.5 rounded border-zinc-600 bg-zinc-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                                />
                                <div>
                                    <span className="text-sm text-zinc-200 group-hover:text-white">
                                        {item.label}
                                    </span>
                                    <span className="block text-[11px] text-zinc-500 mt-0.5">
                                        {item.tip}
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
