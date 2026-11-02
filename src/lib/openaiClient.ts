"use client";

import type { AdvisorMessage, RoleTarget } from "./advisorEngine";
import { buildDataContext } from "./advisorEngine";
import type { ParsedData } from "./types";

/**
 * Everything in LinkIntel runs in the browser EXCEPT the AI Advisor, which
 * sends profile and connection details to OpenAI so it can answer questions
 * about your network by name.
 *
 * That is a real disclosure, not a formality: the names, job titles and
 * employers of up to 500 of your connections leave the browser, and those
 * people never agreed to it. So the advisor asks once, blocks until answered,
 * and remembers the answer. Both AI entry points funnel through this file, so
 * this is the only place the question has to be asked.
 */
const CONSENT_KEY = "linkintel:ai-consent";

export function hasAiConsent(): boolean {
    try {
        return localStorage.getItem(CONSENT_KEY) === "granted";
    } catch {
        return false;
    }
}

export function setAiConsent(granted: boolean): void {
    try {
        localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
    } catch {
        /* private mode — the question is simply asked again next time */
    }
}

const CONSENT_TEXT =
    "The AI Advisor sends your profile and connection details — names, job " +
    "titles and employers, up to 500 connections — to OpenAI so it can give " +
    "advice that names specific people.\n\n" +
    "Email addresses are never sent.\n\n" +
    "Everything else in LinkIntel (the graph, the briefing, the analytics) " +
    "stays in your browser and works without this.\n\n" +
    "Allow the AI Advisor to send this data to OpenAI?";

function requireAiConsent(): void {
    if (hasAiConsent()) return;
    const ok = typeof window !== "undefined" && window.confirm(CONSENT_TEXT);
    setAiConsent(ok);
    if (!ok) {
        throw new Error(
            "AI Advisor is off because sending data to OpenAI was declined. " +
            "Everything else in LinkIntel still works."
        );
    }
}

/**
 * Send chat messages to the server-side API route.
 * The API key is stored server-side — never exposed to the browser.
 */
export async function sendChatMessage(
    messages: AdvisorMessage[],
    data: ParsedData,
    targetRole?: RoleTarget,
    pageContext?: string
): Promise<string> {
    requireAiConsent();

    let systemPrompt = buildDataContext(data, targetRole);

    if (pageContext) {
        systemPrompt += `\n\nThe user is currently on the "${pageContext}" page. Tailor your responses to be relevant to what they're viewing.`;
    }

    const chatMessages = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

    const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages, systemPrompt }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `API error ${response.status}`);
    }

    const result = await response.json();
    return result.content;
}

/**
 * Generate a LinkedIn post via the server-side API route.
 */
export async function generatePostViaAPI(
    topic: string,
    tone: string,
    data: ParsedData,
    targetRole?: RoleTarget
): Promise<string> {
    requireAiConsent();

    const systemPrompt = buildDataContext(data, targetRole);

    const response = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone, systemPrompt }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `API error ${response.status}`);
    }

    const result = await response.json();
    return result.content;
}
