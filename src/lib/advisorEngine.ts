"use client";

import type { Connection, ParsedData } from "./types";

export interface AdvisorMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
}

export interface RoleTarget {
    title: string;
    industry: string;
    keywords: string[];
}

/**
 * Rule-based advisor engine.
 * Provides structured answers when no OpenAI key is available.
 */
export function generateRuleBasedResponse(
    question: string,
    data: ParsedData,
    targetRole?: RoleTarget
): string {
    const q = question.toLowerCase();

    // --- Networking / Who to connect with ---
    if (
        q.includes("network with") ||
        q.includes("connect with") ||
        q.includes("who should i") ||
        q.includes("who can help") ||
        q.includes("reach out")
    ) {
        return handleNetworkingQuestion(q, data, targetRole);
    }

    // --- Job targeting ---
    if (
        q.includes("job") ||
        q.includes("role") ||
        q.includes("position") ||
        q.includes("apply") ||
        q.includes("career") ||
        q.includes("transition")
    ) {
        return handleJobTargetingQuestion(q, data, targetRole);
    }

    // --- Brand / LinkedIn profile ---
    if (
        q.includes("brand") ||
        q.includes("profile") ||
        q.includes("headline") ||
        q.includes("summary") ||
        q.includes("about section") ||
        q.includes("positioning")
    ) {
        return handleBrandQuestion(q, data, targetRole);
    }

    // --- Post / Content ---
    if (
        q.includes("post") ||
        q.includes("content") ||
        q.includes("write") ||
        q.includes("publish") ||
        q.includes("share")
    ) {
        return handleContentQuestion(q, data, targetRole);
    }

    // --- Recruiter ---
    if (q.includes("recruiter") || q.includes("talent")) {
        return handleRecruiterQuestion(data);
    }

    // --- Stats / Data ---
    if (
        q.includes("how many") ||
        q.includes("total") ||
        q.includes("stats") ||
        q.includes("summary")
    ) {
        return handleStatsQuestion(data);
    }

    // Default response
    return getDefaultResponse(data, targetRole);
}

function handleNetworkingQuestion(
    q: string,
    data: ParsedData,
    targetRole?: RoleTarget
): string {
    const { connections } = data;
    let relevantConnections: Connection[] = [];

    if (targetRole) {
        // Find connections relevant to the target role
        relevantConnections = connections.filter((c) => {
            const combined = `${c.position} ${c.company}`.toLowerCase();
            return targetRole.keywords.some((kw) => combined.includes(kw.toLowerCase()));
        });
    }

    const recruiters = connections.filter((c) =>
        /recruiter|talent|staffing|hiring/i.test(c.position)
    );

    let response = "## 🤝 Networking Strategy\n\n";

    if (targetRole) {
        response += `**Target Role:** ${targetRole.title}\n\n`;

        if (relevantConnections.length > 0) {
            response += `You have **${relevantConnections.length}** connections relevant to your target.\n\n`;
            response += "**Key contacts to engage:**\n";
            relevantConnections.slice(0, 5).forEach((c) => {
                response += `- **${c.fullName}** — ${c.position} at ${c.company}\n`;
            });
            response +=
                "\n💡 *Start with a personalized message referencing their work. Don't ask for a job directly — ask for insights about the role/industry.*\n";
        } else {
            response += `You don't have direct connections in "${targetRole.title}" yet.\n\n`;
            response += "**Action items:**\n";
            response += "1. Search LinkedIn for people in this role at your target companies\n";
            response += "2. Join relevant LinkedIn groups in this space\n";
            response += "3. Comment on posts from leaders in this field\n";
            response += "4. Attend virtual events in this industry\n";
        }
    }

    if (recruiters.length > 0) {
        response += `\n**Recruiters in your network (${recruiters.length}):**\n`;
        recruiters.slice(0, 5).forEach((r) => {
            response += `- **${r.fullName}** — ${r.position} at ${r.company}\n`;
        });
        response += "\n💡 *Reach out to these recruiters with a clear value proposition and your target role.*\n";
    }

    return response;
}

function handleJobTargetingQuestion(
    q: string,
    data: ParsedData,
    targetRole?: RoleTarget
): string {
    const { connections } = data;

    // Company analysis
    const companyMap = new Map<string, number>();
    connections.forEach((c) => {
        if (c.company && c.company !== "Unknown") {
            companyMap.set(c.company, (companyMap.get(c.company) || 0) + 1);
        }
    });
    const topCompanies = [...companyMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    let response = "## 🎯 Job Targeting Intelligence\n\n";

    if (targetRole) {
        response += `**Target:** ${targetRole.title} in ${targetRole.industry}\n\n`;
    }

    response += "**Companies where you have the most leverage:**\n";
    topCompanies.forEach(([company, count]) => {
        response += `- **${company}** — ${count} connections (referral potential)\n`;
    });

    response += "\n**Strategy:**\n";
    response += "1. Prioritize companies where you already have 3+ connections\n";
    response += "2. Ask for informational interviews, not job applications\n";
    response += "3. Get internal referrals — they increase your chances 10x\n";
    response += "4. Research the hiring manager and find mutual connections\n";

    if (targetRole) {
        const relevantCount = connections.filter((c) =>
            targetRole.keywords.some((kw) =>
                `${c.position} ${c.company}`.toLowerCase().includes(kw.toLowerCase())
            )
        ).length;
        response += `\n📊 *${relevantCount} of your ${connections.length} connections are relevant to "${targetRole.title}"*\n`;
    }

    return response;
}

function handleBrandQuestion(
    q: string,
    data: ParsedData,
    targetRole?: RoleTarget
): string {
    let response = "## 🏆 Personal Brand Strategy\n\n";

    if (targetRole) {
        response += `**Positioning for:** ${targetRole.title}\n\n`;
        response += "**Headline formula:**\n";
        response += `> ${targetRole.title} | [Your Key Skill] | Helping [Who] achieve [What]\n\n`;
        response += "**About section framework:**\n";
        response += "1. **Hook** — Start with a bold statement about your mission\n";
        response += `2. **Bridge** — Connect your background to ${targetRole.industry}\n`;
        response += "3. **Proof** — 2-3 specific achievements with numbers\n";
        response += "4. **CTA** — What you're looking for and how to reach you\n\n";
    } else {
        response += "**Set a target role first** to get personalized brand advice.\n\n";
        response += "**General brand principles:**\n";
    }

    response += "**Key actions:**\n";
    response += "- 📸 Professional headshot (2.5x more profile views)\n";
    response += "- ✍️ Custom headline (not just your job title)\n";
    response += "- 🎯 About section that tells your story\n";
    response += "- 🏅 Get 3+ recommendations from credible contacts\n";
    response += "- 📌 Feature your best work in the Featured section\n";
    response += `- 🔗 Engage with your ${data.connections.length} connections consistently\n`;

    return response;
}

function handleContentQuestion(
    q: string,
    data: ParsedData,
    targetRole?: RoleTarget
): string {
    let response = "## 📝 Content Strategy\n\n";

    if (targetRole) {
        response += `**Content pillars for "${targetRole.title}":**\n\n`;
        response += `1. **Industry Insights** — Share observations about ${targetRole.industry}\n`;
        response += "2. **Lessons Learned** — Translate your military/past experience to civilian value\n";
        response += "3. **Skill Showcases** — Demonstrate relevant competencies through stories\n";
        response += "4. **Network Engagement** — Amplify others' content and add your take\n\n";
    }

    response += "**Posting schedule:**\n";
    response += "- 2-3 posts per week (consistency > volume)\n";
    response += "- Best times: Tue-Thu, 8-10 AM your local time\n";
    response += "- Mix: 40% insights, 30% stories, 20% engagement, 10% asks\n\n";

    response += "**Post formats that perform well:**\n";
    response += "- Personal transition stories (high engagement)\n";
    response += "- \"X things I learned...\" lists\n";
    response += "- Contrarian takes on industry topics\n";
    response += "- Behind-the-scenes of your transition journey\n";

    return response;
}

function handleRecruiterQuestion(data: ParsedData): string {
    const recruiters = data.connections.filter((c) =>
        /recruiter|talent|staffing|hiring|hr partner/i.test(c.position)
    );

    let response = `## 🔍 Recruiter Intelligence\n\nYou have **${recruiters.length}** recruiters/talent professionals in your network.\n\n`;

    if (recruiters.length > 0) {
        response += "**Your recruiter connections:**\n";
        recruiters.slice(0, 10).forEach((r) => {
            response += `- **${r.fullName}** — ${r.position} at ${r.company}\n`;
        });
        response += "\n**How to engage recruiters:**\n";
        response += "1. Send a direct message with your target role and key skills\n";
        response += "2. Share your updated resume proactively\n";
        response += "3. Comment on their job postings (visibility)\n";
        response += "4. Ask about market trends — builds relationship\n";
    } else {
        response += "**No recruiters found.** Add 5-10 recruiters in your target space.\n";
    }

    return response;
}

function handleStatsQuestion(data: ParsedData): string {
    const { connections, messages } = data;
    const companyMap = new Map<string, number>();
    connections.forEach((c) => {
        if (c.company && c.company !== "Unknown")
            companyMap.set(c.company, (companyMap.get(c.company) || 0) + 1);
    });
    const topCompanies = [...companyMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    let response = "## 📊 Network Summary\n\n";
    response += `- **Total Connections:** ${connections.length}\n`;
    response += `- **Messages:** ${messages.length}\n`;
    response += `- **Companies represented:** ${companyMap.size}\n\n`;
    response += "**Top companies:**\n";
    topCompanies.forEach(([name, count]) => {
        response += `- ${name}: ${count}\n`;
    });

    return response;
}

function getDefaultResponse(data: ParsedData, targetRole?: RoleTarget): string {
    let response = "## 💡 How I Can Help\n\n";
    response += `I have your LinkedIn data loaded (${data.connections.length} connections). Here's what I can help with:\n\n`;
    response += "**Ask me about:**\n";
    response += '- 🤝 "Who should I network with for [role]?"\n';
    response += '- 🎯 "How should I target [company/role]?"\n';
    response += '- 🏆 "How do I build my brand for [industry]?"\n';
    response += '- 📝 "Write a post about [topic]"\n';
    response += '- 🔍 "Show me recruiters in my network"\n';
    response += '- 📊 "Give me my network stats"\n';

    if (targetRole) {
        response += `\n*Currently targeting: **${targetRole.title}** in ${targetRole.industry}*\n`;
    } else {
        response +=
            "\n💡 *Set a target role using the panel on the right for personalized advice.*\n";
    }

    return response;
}

/**
 * Build a system context prompt from the user's LinkedIn data.
 * Includes ALL connections and career data so the AI can give personalized advice.
 */
export function buildDataContext(
    data: ParsedData,
    targetRole?: RoleTarget
): string {
    const { connections, messages, positions, skills, education, certifications, profile, companyFollows } = data;

    const companyMap = new Map<string, number>();
    connections.forEach((c) => {
        if (c.company && c.company !== "Unknown")
            companyMap.set(c.company, (companyMap.get(c.company) || 0) + 1);
    });
    const topCompanies = [...companyMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

    const recruiters = connections.filter((c) =>
        /recruiter|talent|staffing|hiring/i.test(c.position)
    );

    const militaryConns = connections.filter((c) =>
        /military|army|navy|air force|marine|coast guard|dod|defense|veteran/i.test(
            `${c.position} ${c.company}`
        )
    );

    // Build the full connections list (up to 500 to stay within token limits)
    const connectionsList = connections
        .slice(0, 500)
        .map(
            (c) =>
                // Email addresses are deliberately NOT sent. They add nothing to
                // career advice and are the most sensitive field in the export —
                // and they belong to third parties who never agreed to this.
                `- ${c.fullName} | ${c.position} | ${c.company}`
        )
        .join("\n");

    let context = `You are LinkIntel Advisor, an expert career coach and LinkedIn strategist embedded in a network intelligence app.

CRITICAL RULES:
- You have access to the user's COMPLETE LinkedIn profile, career history, skills, certifications, AND connections list.
- When the user asks about networking, targeting roles, or who to connect with, you MUST reference SPECIFIC PEOPLE BY THEIR REAL NAME from the connections list.
- NEVER use placeholders like "[Name of Connection]" or "[Contact Name]". Always use the actual name from the data.
- Reference the user's actual job titles, certifications, and skills when giving advice.
- If no relevant connections exist for a query, say so explicitly.
`;

    // Profile
    if (profile) {
        context += `
USER'S PROFILE:
- Name: ${profile.firstName} ${profile.lastName}
- Headline: ${profile.headline}
- Industry: ${profile.industry}
- Location: ${profile.geoLocation}
${profile.summary ? `- Summary: ${profile.summary.substring(0, 500)}` : ""}
`;
    }

    // Work history
    if (positions.length > 0) {
        context += `\nCAREER HISTORY (${positions.length} positions):\n`;
        positions.forEach((p) => {
            context += `- ${p.title} at ${p.companyName} (${p.startedOn}${p.finishedOn ? ` – ${p.finishedOn}` : " – Present"})`;
            if (p.location) context += ` [${p.location}]`;
            context += "\n";
            if (p.description) {
                context += `  Description: ${p.description.substring(0, 300)}\n`;
            }
        });
    }

    // Skills
    if (skills.length > 0) {
        context += `\nSKILLS (${skills.length}):\n${skills.map((s) => s.name).join(", ")}\n`;
    }

    // Certifications
    if (certifications.length > 0) {
        context += `\nCERTIFICATIONS (${certifications.length}):\n`;
        certifications.forEach((c) => {
            context += `- ${c.name} by ${c.authority} (${c.startedOn}${c.finishedOn ? ` – expires ${c.finishedOn}` : ""})\n`;
        });
    }

    // Education
    if (education.length > 0) {
        context += `\nEDUCATION:\n`;
        education.forEach((e) => {
            context += `- ${e.degreeName} from ${e.schoolName} (${e.startDate} – ${e.endDate})\n`;
        });
    }

    // Company follows
    if (companyFollows.length > 0) {
        context += `\nCOMPANIES USER FOLLOWS (${companyFollows.length}):\n${companyFollows.slice(0, 30).map((f) => f.organization).join(", ")}\n`;
    }

    // Network summary
    context += `
NETWORK SUMMARY:
- Total connections: ${connections.length}
- Total messages: ${messages.length}
- Top companies: ${topCompanies.map(([n, c]) => `${n} (${c})`).join(", ")}
- Recruiters in network: ${recruiters.length}
- Military/defense connections: ${militaryConns.length}
- Civilian connections: ${connections.length - militaryConns.length}

COMPLETE CONNECTIONS LIST (Name | Position | Company):
${connectionsList}
${connections.length > 500 ? `\n... and ${connections.length - 500} more connections.` : ""}
`;

    if (recruiters.length > 0) {
        context += `\nRECRUITERS IN NETWORK:\n`;
        context += recruiters
            .map((r) => `- ${r.fullName}: ${r.position} at ${r.company}`)
            .join("\n");
        context += "\n";
    }

    if (targetRole) {
        const relevantConns = connections.filter((c) =>
            targetRole.keywords.some((kw) =>
                `${c.position} ${c.company}`.toLowerCase().includes(kw.toLowerCase())
            )
        );
        context += `
TARGET ROLE: ${targetRole.title}
TARGET INDUSTRY: ${targetRole.industry}
CONNECTIONS MATCHING TARGET (${relevantConns.length}):
${relevantConns
                .map((c) => `- ${c.fullName}: ${c.position} at ${c.company}`)
                .join("\n")}
`;
    }

    context += `
INSTRUCTIONS:
- Help the user with career transition, networking strategy, personal brand building, and LinkedIn optimization.
- ALWAYS reference their actual connections BY NAME when making networking suggestions.
- When the user asks about targeting a specific role, search their connections list for relevant people and list them by name.
- Reference their actual job titles, skills, and certifications when making recommendations.
- Generate actionable LinkedIn posts when asked, referencing their real career experience.
- Provide specific, tailored advice based on their actual network data.
- Be direct and strategic. No fluff.
- Format responses with markdown headers, bullets, and bold text.
- When writing posts, make them authentic, professional, and engagement-optimized.
`;

    return context;
}

