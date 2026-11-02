import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { topic, tone, systemPrompt } = body;

        if (!topic) {
            return NextResponse.json(
                { error: "Topic is required" },
                { status: 400 }
            );
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        systemPrompt ||
                        "You are an expert LinkedIn content strategist.",
                },
                {
                    role: "user",
                    content: `Write a LinkedIn post about: "${topic}"

Tone: ${tone || "professional"}

Requirements:
- Hook in the first line (pattern interrupt)
- Professional but authentic voice
- Include a call to action
- Use line breaks for readability
- 150-300 words
- Include 3-5 relevant hashtags at the end
- Do NOT use emojis excessively (1-2 max)`,
                },
            ],
            max_tokens: 800,
            temperature: 0.8,
        });

        return NextResponse.json({
            content:
                response.choices[0]?.message?.content ||
                "Could not generate post.",
        });
    } catch (err) {
        console.error("[LinkIntel API] Post error:", err);
        const message =
            err instanceof Error ? err.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
