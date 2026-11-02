"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdvisorMessage, RoleTarget } from "@/lib/advisorEngine";
import { generateRuleBasedResponse } from "@/lib/advisorEngine";
import { sendChatMessage } from "@/lib/openaiClient";
import type { ParsedData } from "@/lib/types";

interface ChatInterfaceProps {
    data: ParsedData;
    targetRole?: RoleTarget;
}

export default function ChatInterface({ data, targetRole }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<AdvisorMessage[]>([
        {
            id: "welcome",
            role: "assistant",
            content: generateRuleBasedResponse("help", data, targetRole),
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSend = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

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
                    targetRole
                );
            } catch {
                // Fallback to rule-based if API fails
                response = generateRuleBasedResponse(trimmed, data, targetRole);
            }

            const assistantMessage: AdvisorMessage = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: response,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: `error-${Date.now()}`,
                    role: "assistant",
                    content: "Sorry, something went wrong. Please try again.",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages, data, targetRole]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend]
    );

    const quickPrompts = [
        "Who should I network with?",
        "How do I build my brand?",
        "Show me recruiters in my network",
        "Write a LinkedIn post about my transition",
        "What companies should I target?",
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex gap-3",
                            msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                    >
                        {msg.role === "assistant" && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 flex-shrink-0 mt-1">
                                <Bot className="h-4 w-4 text-indigo-400" />
                            </div>
                        )}
                        <div
                            className={cn(
                                "max-w-[80%] rounded-xl px-4 py-3 text-sm",
                                msg.role === "user"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-zinc-800/80 text-zinc-200 border border-zinc-700/50"
                            )}
                        >
                            <div className="whitespace-pre-wrap leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-2 [&_strong]:text-white [&_li]:text-zinc-300">
                                {msg.content}
                            </div>
                        </div>
                        {msg.role === "user" && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-700 flex-shrink-0 mt-1">
                                <User className="h-4 w-4 text-zinc-300" />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3 justify-start">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 flex-shrink-0">
                            <Bot className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Thinking...
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts */}
            {messages.length <= 1 && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                    {quickPrompts.map((prompt) => (
                        <button
                            key={prompt}
                            onClick={() => {
                                setInput(prompt);
                                setTimeout(() => inputRef.current?.focus(), 50);
                            }}
                            className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="border-t border-zinc-800 p-4">
                <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask your AI advisor anything..."
                            rows={1}
                            className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 pr-12 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                            style={{ minHeight: "44px", maxHeight: "120px" }}
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                            input.trim() && !isLoading
                                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                : "bg-zinc-800 text-zinc-600"
                        )}
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-600">
                    <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        AI-powered by LinkIntel
                    </span>
                </div>
            </div>
        </div>
    );
}
