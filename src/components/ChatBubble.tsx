"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
    MessageCircle,
    X,
    Send,
    Bot,
    User,
    Loader2,
    Sparkles,
    Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import type { AdvisorMessage, RoleTarget } from "@/lib/advisorEngine";
import { generateRuleBasedResponse } from "@/lib/advisorEngine";
import { sendChatMessage } from "@/lib/openaiClient";
import { renderMarkdown } from "@/lib/markdownRenderer";

// Page context names
const pageContextMap: Record<string, string> = {
    "/briefing": "Briefing Dashboard — network stats and charts",
    "/network": "Network Graph — D3 visualization of connections",
    "/intel": "Transition Intelligence — insights and analysis",
    "/actions": "Action Center — recommendations and outreach",
    "/advisor": "Brand Buddy — brand building and post generation",
    "/upload": "Upload — data import",
};

export default function ChatBubble() {
    const { data, targetRole } = useData();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<AdvisorMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const pageContext = pageContextMap[pathname] || "General";

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when opening
    useEffect(() => {
        if (isOpen && !isMinimized) {
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [isOpen, isMinimized]);

    // Initialize with welcome message on first open
    const handleOpen = useCallback(() => {
        if (messages.length === 0 && data) {
            setMessages([
                {
                    id: "welcome",
                    role: "assistant",
                    content: `Hey! I'm your LinkIntel advisor. I have your network data loaded (${data.connections.length} connections). Ask me anything — who to network with, career strategy, brand advice, or help writing a post. 🎯`,
                    timestamp: new Date(),
                },
            ]);
        }
        setIsOpen(true);
        setIsMinimized(false);
        setHasNewMessage(false);
    }, [messages.length, data]);

    const handleSend = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading || !data) return;

        const userMessage: AdvisorMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: trimmed,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            let response: string;
            try {
                response = await sendChatMessage(
                    [...messages, userMessage],
                    data,
                    targetRole || undefined,
                    pageContext
                );
            } catch {
                // Fallback to rule-based
                response = generateRuleBasedResponse(trimmed, data, undefined);
            }

            const assistantMessage: AdvisorMessage = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: response,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);

            if (isMinimized) {
                setHasNewMessage(true);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: `error-${Date.now()}`,
                    role: "assistant",
                    content:
                        "Sorry, something went wrong. Please try again.",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages, data, pageContext, isMinimized]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend]
    );

    // Don't show on upload page or when no data
    if (!data || pathname === "/" || pathname === "/upload") return null;

    const quickPrompts = [
        "Who should I network with?",
        "Help me build my brand",
        "Write a post about my transition",
        "Show me my network stats",
    ];

    return (
        <>
            {/* Chat Panel */}
            <div
                className={cn(
                    "fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out",
                    isOpen
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 translate-y-4 pointer-events-none"
                )}
            >
                <div
                    className={cn(
                        "flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden transition-all duration-300",
                        isMinimized
                            ? "w-80 h-14"
                            : "w-[420px] h-[560px]"
                    )}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600/20 via-purple-600/10 to-transparent border-b border-zinc-800 cursor-pointer"
                        onClick={() =>
                            isMinimized ? setIsMinimized(false) : null
                        }
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-zinc-950" />
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-white">
                                    LinkIntel AI
                                </span>
                                <span className="block text-[10px] text-zinc-500 leading-none">
                                    {isLoading
                                        ? "Thinking..."
                                        : `On ${pathname.slice(1) || "home"}`}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMinimized(!isMinimized);
                                }}
                                className="p-1.5 rounded-lg hover:bg-zinc-800/80 transition-colors"
                            >
                                <Minus className="h-3.5 w-3.5 text-zinc-400" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                }}
                                className="p-1.5 rounded-lg hover:bg-zinc-800/80 transition-colors"
                            >
                                <X className="h-3.5 w-3.5 text-zinc-400" />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex gap-2.5",
                                            msg.role === "user"
                                                ? "justify-end"
                                                : "justify-start"
                                        )}
                                    >
                                        {msg.role === "assistant" && (
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Bot className="h-3.5 w-3.5 text-indigo-400" />
                                            </div>
                                        )}
                                        <div
                                            className={cn(
                                                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                                                msg.role === "user"
                                                    ? "bg-indigo-600 text-white rounded-br-md"
                                                    : "bg-zinc-800/80 text-zinc-200 border border-zinc-700/30 rounded-bl-md"
                                            )}
                                        >
                                            <div className="space-y-1.5 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-1 [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_h4]:text-[13px] [&_h4]:font-semibold [&_h4]:mt-1.5 [&_h4]:mb-0.5 [&_strong]:text-white [&_li]:text-zinc-300">
                                                {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                                            </div>
                                        </div>
                                        {msg.role === "user" && (
                                            <div className="w-7 h-7 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <User className="h-3.5 w-3.5 text-zinc-300" />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex gap-2.5 justify-start">
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                                            <Bot className="h-3.5 w-3.5 text-indigo-400" />
                                        </div>
                                        <div className="bg-zinc-800/80 border border-zinc-700/30 rounded-2xl rounded-bl-md px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Quick prompts when empty */}
                            {messages.length <= 1 && (
                                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                                    {quickPrompts.map((prompt) => (
                                        <button
                                            key={prompt}
                                            onClick={() => {
                                                setInput(prompt);
                                                setTimeout(
                                                    () =>
                                                        inputRef.current?.focus(),
                                                    50
                                                );
                                            }}
                                            className="text-[11px] px-2.5 py-1 rounded-full border border-zinc-700/50 bg-zinc-800/30 text-zinc-400 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Input */}
                            <div className="border-t border-zinc-800 p-3">
                                <div className="flex items-end gap-2">
                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) =>
                                            setInput(e.target.value)
                                        }
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask anything about your network..."
                                        rows={1}
                                        className="flex-1 resize-none rounded-xl border border-zinc-700/50 bg-zinc-900 px-3.5 py-2.5 text-[13px] text-white placeholder:text-zinc-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                        style={{
                                            minHeight: "40px",
                                            maxHeight: "100px",
                                        }}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={
                                            !input.trim() || isLoading
                                        }
                                        className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                                            input.trim() && !isLoading
                                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                                                : "bg-zinc-800 text-zinc-600"
                                        )}
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Floating Bubble */}
            {!isOpen && (
                <button
                    onClick={handleOpen}
                    className="fixed bottom-6 right-6 z-50 group"
                >
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-200 active:scale-95">
                            <MessageCircle className="h-6 w-6 text-white" />
                        </div>
                        {/* Online indicator */}
                        <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-zinc-950 shadow-sm" />
                        {/* New message badge */}
                        {hasNewMessage && (
                            <div className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                                <span className="text-[10px] font-bold text-white">
                                    !
                                </span>
                            </div>
                        )}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Ask LinkIntel AI
                    </div>
                </button>
            )}
        </>
    );
}
