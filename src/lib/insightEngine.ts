import type {
    Connection,
    Message,
    ParsedData,
    InsightCard,
    ActionItem,
    BriefingStats,
    CompanyCount,
    YearCount,
} from "./types";
import type { RoleTarget } from "./advisorEngine";

const MILITARY_KEYWORDS = [
    "air force", "army", "navy", "marine", "coast guard",
    "military", "veteran", "usaf", "usmc", "dod",
    "department of defense", "national guard", "reserves",
    "special forces", "special operations", "jber", "jblm",
    "fort", "camp", "base", "squadron", "battalion",
    "officer", "enlisted", "nco", "commissioned",
];

const RECRUITER_KEYWORDS = [
    "recruiter", "recruiting", "talent acquisition",
    "talent sourcing", "headhunter", "staffing",
    "hr partner", "people operations",
];

/**
 * Generate briefing statistics from parsed data.
 */
export function generateBriefingStats(
    connections: Connection[],
    messages: Message[]
): BriefingStats {
    const companyMap = new Map<string, number>();
    for (const c of connections) {
        const company = c.company || "Unknown";
        companyMap.set(company, (companyMap.get(company) || 0) + 1);
    }
    const topCompanies: CompanyCount[] = [...companyMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([company, count]) => ({ company, count }));

    const industryMap = new Map<string, number>();
    for (const c of connections) {
        const industry = inferIndustry(c.position, c.company);
        industryMap.set(industry, (industryMap.get(industry) || 0) + 1);
    }
    const topIndustries: CompanyCount[] = [...industryMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([company, count]) => ({ company, count }));

    const yearMap = new Map<string, number>();
    for (const c of connections) {
        if (c.connectedOn) {
            const year = c.connectedOn.getFullYear().toString();
            yearMap.set(year, (yearMap.get(year) || 0) + 1);
        }
    }
    const connectionsByYear: YearCount[] = [...yearMap.entries()]
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .map(([year, count]) => ({ year, count }));

    const messageCounts = new Map<string, number>();
    for (const m of messages) {
        if (m.from) messageCounts.set(m.from, (messageCounts.get(m.from) || 0) + 1);
    }
    const strongTieNames = new Set(
        [...messageCounts.entries()]
            .filter(([, count]) => count >= 3)
            .map(([name]) => name.toLowerCase())
    );
    const strongTies = connections.filter((c) =>
        strongTieNames.has(c.fullName.toLowerCase())
    );

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const recentConnections = connections.filter(
        (c) => c.connectedOn && c.connectedOn >= oneYearAgo
    );

    const dated = connections.filter((c) => c.connectedOn !== null);
    dated.sort(
        (a, b) => (a.connectedOn as Date).getTime() - (b.connectedOn as Date).getTime()
    );

    return {
        totalConnections: connections.length,
        topCompanies,
        topIndustries,
        connectionsByYear,
        strongTies,
        recentConnections,
        oldestConnection: dated[0] ?? null,
        newestConnection: dated[dated.length - 1] ?? null,
    };
}

/**
 * Score how relevant a connection is to the target role.
 */
function scoreConnectionRelevance(conn: Connection, target: RoleTarget): number {
    const combined = `${conn.position} ${conn.company}`.toLowerCase();
    let score = 0;
    for (const kw of target.keywords) {
        if (combined.includes(kw.toLowerCase())) score += 2;
    }
    if (combined.includes(target.title.toLowerCase())) score += 3;
    if (combined.includes(target.industry.toLowerCase())) score += 1;
    return score;
}

/**
 * Generate transition intelligence insights using full ParsedData.
 * When targetRole is provided, insights are tailored to that career goal.
 */
export function generateInsights(data: ParsedData, targetRole?: RoleTarget | null): InsightCard[] {
    const { connections, messages, positions, skills, certifications, education, companyFollows } = data;
    const insights: InsightCard[] = [];

    // TARGET ROLE: Role-Relevant Connections
    if (targetRole) {
        const relevantConnections = connections
            .map((c) => ({ conn: c, score: scoreConnectionRelevance(c, targetRole) }))
            .filter((r) => r.score > 0)
            .sort((a, b) => b.score - a.score);

        const nonRelevant = connections.length - relevantConnections.length;

        insights.push({
            id: "role-relevant",
            title: `Connections Relevant to ${targetRole.title}`,
            description: `${relevantConnections.length} of ${connections.length} connections align with your target role.`,
            category: "action",
            priority: relevantConnections.length < 10 ? "high" : "medium",
            details: [
                `${relevantConnections.length} connections match "${targetRole.title}" in ${targetRole.industry}`,
                ...relevantConnections.slice(0, 8).map(
                    (r) => `${r.conn.fullName} — ${r.conn.position} at ${r.conn.company} (match score: ${r.score})`
                ),
                relevantConnections.length < 10
                    ? `Only ${relevantConnections.length} relevant connections — you need to actively build connections in the ${targetRole.industry} space.`
                    : `Strong alignment — engage these connections for referrals and informational interviews.`,
            ],
            icon: "TrendingUp",
        });

        // Gap analysis: connections NOT relevant
        if (nonRelevant > relevantConnections.length) {
            insights.push({
                id: "network-gap",
                title: `Network Gap for ${targetRole.title}`,
                description: `${Math.round((nonRelevant / connections.length) * 100)}% of your network doesn't align with your target role.`,
                category: "network",
                priority: "high",
                details: [
                    `${nonRelevant} connections are outside your target area`,
                    `Focus networking efforts on ${targetRole.industry} professionals`,
                    `Join LinkedIn groups related to: ${targetRole.keywords.join(", ")}`,
                    `Search for "${targetRole.title}" on LinkedIn and send 3-5 connection requests per week`,
                ],
                icon: "AlertTriangle",
            });
        }
    }

    // 1. Military vs civilian split
    const militaryConnections = connections.filter((c) =>
        isMilitary(c.position, c.company)
    );
    const civilianConnections = connections.filter(
        (c) => !isMilitary(c.position, c.company)
    );

    insights.push({
        id: "mil-civil-split",
        title: "Military vs. Civilian Network Balance",
        description: `Your network is ${Math.round((civilianConnections.length / connections.length) * 100)}% civilian and ${Math.round((militaryConnections.length / connections.length) * 100)}% military-affiliated.`,
        category: "military",
        priority: militaryConnections.length > civilianConnections.length ? "high" : "medium",
        details: [
            `${militaryConnections.length} connections with military/defense backgrounds`,
            `${civilianConnections.length} connections in civilian sectors`,
            militaryConnections.length > civilianConnections.length
                ? "Consider expanding your civilian network for transition readiness."
                : "Strong civilian representation — good positioning for transition.",
        ],
        icon: "Shield",
    });

    // 2. Top companies for targeting
    const companyMap = new Map<string, Connection[]>();
    for (const c of connections) {
        const co = c.company || "Unknown";
        if (!companyMap.has(co)) companyMap.set(co, []);
        companyMap.get(co)!.push(c);
    }
    const topCompanies = [...companyMap.entries()]
        .filter(([name]) => name !== "Unknown")
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 10);

    insights.push({
        id: "target-companies",
        title: "Companies to Target Based on Network Strength",
        description: `You have the strongest representation at ${topCompanies[0]?.[0] || "N/A"} with ${topCompanies[0]?.[1]?.length || 0} connections.`,
        category: "company",
        priority: "high",
        details: topCompanies.map(
            ([name, conns]) => `${name}: ${conns.length} connections`
        ),
        icon: "Building2",
    });

    // 3. Recruiters in network
    const recruiters = connections.filter((c) => isRecruiter(c.position));
    insights.push({
        id: "recruiters",
        title: "Recruiters & Talent Professionals in Your Network",
        description: `You have ${recruiters.length} recruiters or talent professionals in your network.`,
        category: "recruiter",
        priority: recruiters.length > 0 ? "high" : "low",
        details:
            recruiters.length > 0
                ? recruiters
                    .slice(0, 10)
                    .map((r) => `${r.fullName} — ${r.position} at ${r.company}`)
                : ["No recruiters found. Consider connecting with talent professionals."],
        icon: "UserSearch",
    });

    // 4. Skills-to-network alignment
    if (skills.length > 0) {
        const skillNames = skills.map((s) => s.name.toLowerCase());
        const skillMatchConnections = connections.filter((c) =>
            skillNames.some(
                (skill) =>
                    c.position.toLowerCase().includes(skill) ||
                    c.company.toLowerCase().includes(skill)
            )
        );

        const matchingSkills = skillNames.filter((skill) =>
            connections.some(
                (c) =>
                    c.position.toLowerCase().includes(skill) ||
                    c.company.toLowerCase().includes(skill)
            )
        );

        insights.push({
            id: "skills-alignment",
            title: "Skills-to-Network Alignment",
            description: `${skillMatchConnections.length} connections align with your ${skills.length} listed skills.`,
            category: "network",
            priority: skillMatchConnections.length < 10 ? "high" : "medium",
            details: [
                `Skills with network matches: ${matchingSkills.join(", ") || "None found"}`,
                `${skillMatchConnections.length} of ${connections.length} connections match your skill areas`,
                skillMatchConnections.length < 10
                    ? "Build connections in your skill areas — join relevant LinkedIn groups and engage with content in these spaces."
                    : "Good alignment between your skills and network composition.",
            ],
            icon: "Wrench",
        });
    }

    // 5. Certification advantage
    if (certifications.length > 0) {
        const certDetails: string[] = [];
        const now = new Date();

        certifications.forEach((cert) => {
            let status = `✅ ${cert.name} (${cert.authority})`;
            if (cert.finishedOn) {
                const expDate = new Date(cert.finishedOn);
                if (!isNaN(expDate.getTime())) {
                    const monthsUntilExpiry = Math.round(
                        (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
                    );
                    if (monthsUntilExpiry < 0) {
                        status = `❌ ${cert.name} — EXPIRED (${cert.finishedOn})`;
                    } else if (monthsUntilExpiry < 6) {
                        status = `⚠️ ${cert.name} — Expiring soon (${cert.finishedOn})`;
                    } else {
                        status = `✅ ${cert.name} — Valid until ${cert.finishedOn}`;
                    }
                }
            }
            certDetails.push(status);
        });

        // Find connections at companies that value these certs
        const certKeywords = certifications.map((c) =>
            c.name.toLowerCase().replace(/comptia\s*/i, "")
        );
        const certRelevantConns = connections.filter((c) =>
            certKeywords.some(
                (kw) =>
                    c.position.toLowerCase().includes(kw) ||
                    c.position.toLowerCase().includes("security") ||
                    c.position.toLowerCase().includes("compliance") ||
                    c.position.toLowerCase().includes("risk")
            )
        );

        certDetails.push(
            `${certRelevantConns.length} connections work in fields that value these certifications`
        );

        insights.push({
            id: "cert-advantage",
            title: "Certification Competitive Advantage",
            description: `You hold ${certifications.length} certifications — leverage them in your transition.`,
            category: "action",
            priority: certDetails.some((d) => d.includes("EXPIRED") || d.includes("Expiring"))
                ? "high"
                : "medium",
            details: certDetails,
            icon: "Award",
        });
    }

    // 6. Career trajectory analysis
    if (positions.length > 0) {
        const currentPos = positions.find((p) => p.isCurrent);
        const yearsExperience = positions.length;
        const uniqueCompanies = new Set(positions.map((p) => p.companyName)).size;

        const posDetails = [
            `${yearsExperience} positions across ${uniqueCompanies} organization${uniqueCompanies > 1 ? "s" : ""}`,
            currentPos
                ? `Current: ${currentPos.title} at ${currentPos.companyName}`
                : "No current position listed",
        ];

        // Look for leadership keywords in positions
        const leadershipPositions = positions.filter((p) =>
            /director|manager|lead|chief|head|senior|supervisor|commander/i.test(p.title)
        );
        if (leadershipPositions.length > 0) {
            posDetails.push(
                `${leadershipPositions.length} leadership-level positions — highlight this management experience`
            );
        }

        // Analyze position descriptions for transferable skills
        const allDescriptions = positions.map((p) => p.description).join(" ").toLowerCase();
        const transferableSkills: string[] = [];
        const skillChecks = [
            ["budget/financial management", ["budget", "financial", "cost", "revenue"]],
            ["team leadership", ["team", "led", "managed", "supervised", "personnel"]],
            ["project management", ["project", "program", "initiative", "delivered"]],
            ["strategic planning", ["strategic", "strategy", "planning", "roadmap"]],
            ["risk management", ["risk", "compliance", "governance", "audit"]],
            ["cybersecurity", ["cyber", "security", "threat", "vulnerability"]],
        ] as const;

        for (const [skill, keywords] of skillChecks) {
            if (keywords.some((kw) => allDescriptions.includes(kw))) {
                transferableSkills.push(skill);
            }
        }

        if (transferableSkills.length > 0) {
            posDetails.push(
                `Transferable skills identified: ${transferableSkills.join(", ")}`
            );
        }

        insights.push({
            id: "career-trajectory",
            title: "Career Trajectory Analysis",
            description: `${yearsExperience} positions analyzed — strong foundation for transition.`,
            category: "action",
            priority: "medium",
            details: posDetails,
            icon: "TrendingUp",
        });
    }

    // 7. Company follow gap analysis
    if (companyFollows.length > 0) {
        const followedCompanies = companyFollows.map((f) => f.organization.toLowerCase());
        const companiesWithConnections = new Set(
            connections.map((c) => c.company.toLowerCase())
        );

        const followedButNoConnections = companyFollows.filter(
            (f) => !companiesWithConnections.has(f.organization.toLowerCase())
        );

        if (followedButNoConnections.length > 0) {
            insights.push({
                id: "follow-gap",
                title: "Companies You Follow Without Connections",
                description: `You follow ${followedButNoConnections.length} companies where you have no connections — networking opportunity.`,
                category: "company",
                priority: "medium",
                details: [
                    ...followedButNoConnections.slice(0, 8).map(
                        (f) => `${f.organization} — no connections yet, search for people here`
                    ),
                    "Following a company but having no connections there is a gap. Send connection requests to people at these companies.",
                ],
                icon: "Eye",
            });
        }
    }

    // 8. Education leverage
    if (education.length > 0) {
        const alumniConnections = connections.filter((c) =>
            education.some(
                (e) =>
                    c.company.toLowerCase().includes(e.schoolName.toLowerCase()) ||
                    c.position.toLowerCase().includes("alumni")
            )
        );

        insights.push({
            id: "education-leverage",
            title: "Education & Alumni Network",
            description: `Leverage your ${education.length} educational institution${education.length > 1 ? "s" : ""} for networking.`,
            category: "network",
            priority: "medium",
            details: [
                ...education.map((e) => `${e.degreeName} — ${e.schoolName} (${e.startDate}–${e.endDate})`),
                `${alumniConnections.length} connections appear connected to your schools`,
                "Search LinkedIn for alumni at target companies — shared education is a strong conversation starter.",
            ],
            icon: "GraduationCap",
        });
    }

    // 9. Recent connections
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const recentConnections = connections.filter(
        (c) => c.connectedOn && c.connectedOn >= oneYearAgo
    );
    insights.push({
        id: "recent-growth",
        title: "Network Growth — Last 12 Months",
        description: `You added ${recentConnections.length} connections in the past year.`,
        category: "network",
        priority:
            recentConnections.length < 20
                ? "high"
                : recentConnections.length < 50
                    ? "medium"
                    : "low",
        details: [
            `${recentConnections.length} new connections in the last 12 months`,
            recentConnections.length < 20
                ? "Your networking pace is below average. Aim for 3-5 targeted connections per week."
                : "Healthy networking pace. Focus on quality engagement with new contacts.",
        ],
        icon: "TrendingUp",
    });

    // 10. DoD concentration risk
    const dodConnections = connections.filter(
        (c) =>
            c.company.toLowerCase().includes("dod") ||
            c.company.toLowerCase().includes("department of defense") ||
            c.company.toLowerCase().includes("defense") ||
            isMilitary(c.position, c.company)
    );
    if (dodConnections.length > connections.length * 0.3) {
        insights.push({
            id: "dod-concentration",
            title: "Defense/DoD Network Concentration Risk",
            description: `${Math.round((dodConnections.length / connections.length) * 100)}% of your network is DoD/defense-related.`,
            category: "military",
            priority: "high",
            details: [
                `${dodConnections.length} of ${connections.length} connections are in defense/military`,
                "High concentration in one sector limits transition options.",
                "Diversify by connecting with professionals in tech, consulting, and private sector.",
            ],
            icon: "AlertTriangle",
        });
    }

    return insights;
}

/**
 * Generate action items using full ParsedData.
 * When targetRole is provided, actions are prioritized for that career goal.
 */
export function generateActions(data: ParsedData, targetRole?: RoleTarget | null): ActionItem[] {
    const { connections, messages, positions, skills, certifications, companyFollows, profile } = data;
    const actions: ActionItem[] = [];

    const uniqueMessageContacts = new Set(messages.map((m) => m.from));
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const recentConnections = connections.filter(
        (c) => c.connectedOn && c.connectedOn >= oneYearAgo
    );

    // Build user context for personalized templates
    const currentTitle = positions.find((p) => p.isCurrent)?.title || "professional";
    const topSkillsList = skills.slice(0, 3).map((s) => s.name).join(", ") || "my field";
    const userName = profile ? `${profile.firstName}` : "";

    // TARGET ROLE: Connect with role-relevant professionals
    if (targetRole) {
        const roleRelevant = connections
            .map((c) => ({ ...c, relevance: scoreConnectionRelevance(c, targetRole) }))
            .filter((c) => c.relevance > 0 && !isMilitary(c.position, c.company))
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, 5);

        if (roleRelevant.length > 0) {
            actions.push({
                id: "target-role-connect",
                title: `Connect with ${targetRole.title} Professionals`,
                description: `These ${roleRelevant.length} connections are most relevant to your target role — reach out now.`,
                category: "networking",
                priority: "high",
                contacts: roleRelevant.map((c) => ({
                    firstName: c.firstName,
                    lastName: c.lastName,
                    fullName: c.fullName,
                    company: c.company,
                    position: c.position,
                })),
                template: `Hi [Name],\n\nI'm reaching out because I'm currently transitioning into a ${targetRole.title} role in the ${targetRole.industry} space. I noticed your work at [Company] and would love to learn about your experience.\n\nAs a ${currentTitle} with skills in ${topSkillsList}, I'm looking to connect with professionals who can share insights about the ${targetRole.title} path.\n\nWould you be open to a brief conversation?${userName ? `\n\nBest,\n${userName}` : ""}`,
            });
        }

        // Recruiter outreach for target role
        const recruiters = connections
            .filter((c) => isRecruiter(c.position))
            .slice(0, 5);

        if (recruiters.length > 0) {
            actions.push({
                id: "target-recruiter-outreach",
                title: `Inform Recruiters About ${targetRole.title} Goal`,
                description: `Let your ${recruiters.length} recruiter connections know you're targeting ${targetRole.title} roles.`,
                category: "networking",
                priority: "high",
                contacts: recruiters.map((c) => ({
                    firstName: c.firstName,
                    lastName: c.lastName,
                    fullName: c.fullName,
                    company: c.company,
                    position: c.position,
                })),
                template: `Hi [Name],\n\nI hope you're doing well! I wanted to reach out because I'm actively targeting ${targetRole.title} positions in the ${targetRole.industry} sector.\n\nMy background includes experience as a ${currentTitle}, with certifications and skills in ${topSkillsList}. I'd love to be on your radar for any ${targetRole.title} or related opportunities.\n\nWould you have a moment to chat about what you're seeing in the market?${userName ? `\n\nThanks,\n${userName}` : ""}`,
            });
        }
    }

    // 1. Messaging activity gap
    if (messages.length > 0) {
        const messagedRecent = recentConnections.filter((c) =>
            uniqueMessageContacts.has(c.fullName)
        );
        actions.push({
            id: "messaging-gap",
            title: "Messaging Activity Gap",
            description: `You added ${recentConnections.length} connections this year but only messaged ${messagedRecent.length} of them.`,
            category: "messaging",
            priority: "high",
            template: `Hi [Name],\n\nWe connected on LinkedIn recently, and I'd love to learn more about your work at [Company]. I'm a ${currentTitle} with expertise in ${topSkillsList}, currently exploring new opportunities.\n\nWould you have 15 minutes for a quick virtual coffee chat?\n\nBest regards${userName ? `,\n${userName}` : ""}`,
        });
    }

    // 2. Dormant connections
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const dormant = connections
        .filter((c) => c.connectedOn && c.connectedOn < twoYearsAgo)
        .filter((c) => !uniqueMessageContacts.has(c.fullName))
        .sort((a, b) => {
            if (a.company !== "Unknown" && b.company === "Unknown") return -1;
            if (a.company === "Unknown" && b.company !== "Unknown") return 1;
            return 0;
        })
        .slice(0, 5);

    if (dormant.length > 0) {
        actions.push({
            id: "dormant-reconnect",
            title: "Dormant Connections to Reactivate",
            description:
                "These connections could be valuable but haven't been engaged recently.",
            category: "reconnect",
            priority: "medium",
            contacts: dormant,
            template: `Hi [Name],\n\nIt's been a while since we connected! I noticed you're at [Company] — impressive work.\n\nI'm currently transitioning from my role as ${currentTitle} and exploring opportunities in the private sector. I'd love to reconnect and hear about your experience.\n\nBest regards${userName ? `,\n${userName}` : ""}`,
        });
    }

    // 3. Recruiter outreach
    const recruiters = connections.filter((c) => isRecruiter(c.position));
    if (recruiters.length > 0) {
        actions.push({
            id: "recruiter-outreach",
            title: "Engage Recruiters in Your Network",
            description: `You have ${recruiters.length} recruiters. Share your goals with them.`,
            category: "outreach",
            priority: "high",
            contacts: recruiters.slice(0, 5),
            template: `Hi [Name],\n\nI see you specialize in [Their Focus Area] recruiting. I'm a ${currentTitle} with experience in ${topSkillsList}, actively exploring new opportunities.\n\nI hold ${certifications.length > 0 ? certifications.map((c) => c.name).join(", ") : "relevant"} certification${certifications.length !== 1 ? "s" : ""} and am looking for roles in cybersecurity, GRC, or AI governance.\n\nI'd love to connect about any roles that might be a good fit.\n\nBest regards${userName ? `,\n${userName}` : ""}`,
        });
    }

    // 4. Certification renewal actions
    if (certifications.length > 0) {
        const now = new Date();
        const expiringSoon = certifications.filter((cert) => {
            if (!cert.finishedOn) return false;
            const expDate = new Date(cert.finishedOn);
            if (isNaN(expDate.getTime())) return false;
            const monthsLeft = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
            return monthsLeft > 0 && monthsLeft < 12;
        });

        const expired = certifications.filter((cert) => {
            if (!cert.finishedOn) return false;
            const expDate = new Date(cert.finishedOn);
            return !isNaN(expDate.getTime()) && expDate < now;
        });

        if (expiringSoon.length > 0 || expired.length > 0) {
            actions.push({
                id: "cert-renewal",
                title: "Certification Renewal Required",
                description: `${expired.length} expired, ${expiringSoon.length} expiring within 12 months.`,
                category: "outreach",
                priority: "high",
            });
        }
    }

    // 5. Skills-based connection opportunities
    if (skills.length > 0) {
        const skillNames = skills.map((s) => s.name.toLowerCase());
        const skillAlignedConnections = connections.filter((c) =>
            skillNames.some(
                (skill) =>
                    c.position.toLowerCase().includes(skill) ||
                    c.company.toLowerCase().includes(skill)
            )
        );

        if (skillAlignedConnections.length > 0 && skillAlignedConnections.length < 20) {
            actions.push({
                id: "skill-networking",
                title: "Expand Your Skills-Aligned Network",
                description: `Only ${skillAlignedConnections.length} connections match your skill areas. Here are people to engage:`,
                category: "outreach",
                priority: "medium",
                contacts: skillAlignedConnections.slice(0, 5),
                template: `Hi [Name],\n\nI noticed we share a professional interest in ${topSkillsList}. I'm currently a ${currentTitle} exploring opportunities where these skills are valued.\n\nI'd appreciate any insights on the industry landscape and would love to connect.\n\nBest regards${userName ? `,\n${userName}` : ""}`,
            });
        }
    }

    // 6. Company follow-to-connection actions
    if (companyFollows.length > 0) {
        const companiesWithConnections = new Set(
            connections.map((c) => c.company.toLowerCase())
        );
        const followedButNoConnections = companyFollows.filter(
            (f) => !companiesWithConnections.has(f.organization.toLowerCase())
        );

        if (followedButNoConnections.length > 0) {
            actions.push({
                id: "follow-to-connect",
                title: "Convert Company Follows to Connections",
                description: `You follow ${followedButNoConnections.length} companies with zero connections. Start building relationships there.`,
                category: "outreach",
                priority: "medium",
                template: `Hi [Name],\n\nI follow ${followedButNoConnections[0]?.organization || "[Company]"} on LinkedIn and have been impressed by the team's work. I'm a ${currentTitle} with expertise in ${topSkillsList}.\n\nI'd love to connect and learn more about what it's like working there.\n\nBest regards${userName ? `,\n${userName}` : ""}`,
            });
        }
    }

    // 7. DoD diversification
    const dodConnections = connections.filter(
        (c) => isMilitary(c.position, c.company)
    );
    if (dodConnections.length > connections.length * 0.3) {
        actions.push({
            id: "diversify-network",
            title: "Diversify Beyond Defense",
            description: `You are over-indexed in defense/military (${Math.round((dodConnections.length / connections.length) * 100)}%). Target adjacent sectors.`,
            category: "diversify",
            priority: "high",
            template: `Hi [Name],\n\nI came across your profile while researching opportunities in [Industry]. I'm a ${currentTitle} transitioning from the defense sector, bringing experience in ${topSkillsList}.\n\nI'd appreciate any advice on breaking into the private sector. Would you have time for a brief conversation?\n\nThank you${userName ? `,\n${userName}` : ""}`,
        });
    }

    // 8. Networking velocity
    if (recentConnections.length < 20) {
        actions.push({
            id: "increase-velocity",
            title: "Increase Your Networking Pace",
            description: `Only ${recentConnections.length} new connections in the past year. Aim for 3-5 targeted connections per week.`,
            category: "outreach",
            priority: "medium",
        });
    }

    // 9. Profile optimization
    if (profile) {
        const profileIssues: string[] = [];
        if (!profile.headline || profile.headline.length < 20) {
            profileIssues.push("Your headline is too short — optimize it with your target role and key skills");
        }
        if (!profile.summary || profile.summary.length < 100) {
            profileIssues.push("Your About section needs more detail — aim for 200+ words highlighting your transition story");
        }

        if (profileIssues.length > 0) {
            actions.push({
                id: "profile-optimization",
                title: "Optimize Your LinkedIn Profile",
                description: `${profileIssues.length} improvement${profileIssues.length > 1 ? "s" : ""} identified for your profile.`,
                category: "outreach",
                priority: "high",
            });
        }
    }

    return actions;
}

// --- Helper functions ---

function isMilitary(position: string, company: string): boolean {
    const combined = `${position} ${company}`.toLowerCase();
    return MILITARY_KEYWORDS.some((kw) => combined.includes(kw));
}

function isRecruiter(position: string): boolean {
    const lower = position.toLowerCase();
    return RECRUITER_KEYWORDS.some((kw) => lower.includes(kw));
}

function inferIndustry(position: string, company: string): string {
    const combined = `${position} ${company}`.toLowerCase();

    const industries: [string, string[]][] = [
        ["Technology", ["software", "engineer", "developer", "tech", "IT", "data", "cloud", "cyber", "AI", "machine learning"]],
        ["Defense & Military", ["military", "army", "navy", "air force", "marine", "defense", "dod"]],
        ["Consulting", ["consult", "advisory", "strateg"]],
        ["Finance", ["finance", "bank", "invest", "capital", "financial"]],
        ["Healthcare", ["health", "medical", "pharma", "clinical", "hospital"]],
        ["Education", ["education", "university", "school", "professor", "teacher", "academia"]],
        ["Government", ["government", "federal", "state", "public sector", "agency"]],
        ["Sales & Marketing", ["sales", "marketing", "account executive", "business development"]],
        ["Operations", ["operations", "logistics", "supply chain", "project manager"]],
        ["Human Resources", ["hr", "human resources", "people", "talent", "recruiting"]],
    ];

    for (const [industry, keywords] of industries) {
        if (keywords.some((kw) => combined.includes(kw.toLowerCase()))) {
            return industry;
        }
    }
    return "Other";
}
