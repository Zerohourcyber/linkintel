import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, systemPrompt } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: "Messages are required" },
                { status: 400 }
            );
        }

        const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
            [
                { role: "system", content: systemPrompt || "You are a helpful assistant." },
                ...messages.map(
                    (m: { role: string; content: string }) => ({
                        role: m.role as "user" | "assistant",
                        content: m.content,
                    })
                ),
            ];

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: chatMessages,
            max_tokens: 1500,
            temperature: 0.7,
        });

        return NextResponse.json({
            content: response.choices[0]?.message?.content || "No response.",
        });
    } catch (err) {
        console.error("[LinkIntel API] Chat error:", err);
        const message =
            err instanceof Error ? err.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
