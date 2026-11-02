"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Users,
    Building2,
    Briefcase,
    CalendarDays,
    Heart,
    Clock,
    Award,
    GraduationCap,
    Wrench,
    MapPin,
    Download,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import MetricCard from "@/components/MetricCard";
import { useData } from "@/lib/store";
import { generateBriefingStats, generateInsights, generateActions } from "@/lib/insightEngine";

export default function BriefingPage() {
    const { data } = useData();
    const router = useRouter();

    const stats = useMemo(() => {
        if (!data) return null;
        return generateBriefingStats(data.connections, data.messages);
    }, [data]);

    if (!data || !stats) {
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

    const { positions, skills, certifications, education, profile } = data;

    const handleExportReport = useCallback(() => {
        if (!data || !stats) return;

        const insights = generateInsights(data);
        const actions = generateActions(data);
        const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>LinkIntel Network Briefing</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a2e; line-height: 1.6; padding: 48px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 28px; font-weight: 700; color: #1a1a2e; border-bottom: 3px solid #6366f1; padding-bottom: 12px; margin-bottom: 8px; }
  .subtitle { font-size: 13px; color: #64748b; margin-bottom: 32px; }
  h2 { font-size: 18px; font-weight: 600; color: #1a1a2e; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  h3 { font-size: 14px; font-weight: 600; color: #4f46e5; margin: 16px 0 8px; }
  .profile-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .profile-card .name { font-size: 18px; font-weight: 600; }
  .profile-card .headline { font-size: 13px; color: #6366f1; margin-top: 2px; }
  .profile-card .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
  .stat-card .value { font-size: 24px; font-weight: 700; color: #4f46e5; }
  .stat-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; font-size: 13px; }
  th { text-align: left; padding: 8px 12px; background: #f1f5f9; border: 1px solid #e2e8f0; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
  td { padding: 8px 12px; border: 1px solid #e2e8f0; }
  .skills-list { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 16px; }
  .skill-tag { background: #eef2ff; color: #4f46e5; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 500; }
  .timeline-item { padding: 8px 0 8px 20px; border-left: 2px solid #e2e8f0; margin-left: 8px; }
  .timeline-item.current { border-left-color: #22c55e; }
  .timeline-title { font-weight: 600; font-size: 14px; }
  .timeline-company { font-size: 13px; color: #6366f1; }
  .timeline-date { font-size: 11px; color: #94a3b8; }
  .insight { padding: 12px; margin: 8px 0; border-radius: 8px; border-left: 4px solid; }
  .insight.high { background: #fef2f2; border-color: #ef4444; }
  .insight.medium { background: #fffbeb; border-color: #f59e0b; }
  .insight-title { font-weight: 600; font-size: 14px; }
  .insight-desc { font-size: 13px; color: #475569; margin-top: 4px; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 24px; } .stats-grid { break-inside: avoid; } h2 { break-after: avoid; } .insight { break-inside: avoid; } }
</style></head><body>

<h1>LinkIntel Network Briefing</h1>
<div class="subtitle">Generated ${date} • All data processed client-side</div>

${profile ? `<div class="profile-card">
  <div class="name">${profile.firstName} ${profile.lastName}</div>
  ${profile.headline ? `<div class="headline">${profile.headline}</div>` : ""}
  <div class="meta">${[profile.industry, profile.geoLocation].filter(Boolean).join(" • ")}</div>
</div>` : ""}

<div class="stats-grid">
  <div class="stat-card"><div class="value">${stats.totalConnections}</div><div class="label">Connections</div></div>
  <div class="stat-card"><div class="value">${skills.length}</div><div class="label">Skills</div></div>
  <div class="stat-card"><div class="value">${certifications.length}</div><div class="label">Certifications</div></div>
  <div class="stat-card"><div class="value">${positions.length}</div><div class="label">Roles</div></div>
</div>

${stats.topCompanies.length > 0 ? `<h2>Top Companies in Network</h2>
<table>
  <tr><th>#</th><th>Company</th><th>Connections</th></tr>
  ${stats.topCompanies.map((c, i) => `<tr><td>${i + 1}</td><td>${c.company}</td><td>${c.count}</td></tr>`).join("")}
</table>` : ""}

${positions.length > 0 ? `<h2>Career Timeline</h2>
${positions.map((p) => `<div class="timeline-item${p.isCurrent ? " current" : ""}">
  <div class="timeline-title">${p.title}</div>
  <div class="timeline-company">${p.companyName}</div>
  <div class="timeline-date">${p.startedOn}${p.finishedOn ? ` – ${p.finishedOn}` : " – Present"}${p.location ? ` • ${p.location}` : ""}</div>
</div>`).join("")}` : ""}

${skills.length > 0 ? `<h2>Skills</h2>
<div class="skills-list">${skills.map((s) => `<span class="skill-tag">${s.name}</span>`).join("")}</div>` : ""}

${certifications.length > 0 ? `<h2>Certifications</h2>
<table>
  <tr><th>Certification</th><th>Authority</th><th>Issued</th><th>Expires</th></tr>
  ${certifications.map((c) => `<tr><td>${c.name}</td><td>${c.authority}</td><td>${c.startedOn || "—"}</td><td>${c.finishedOn || "—"}</td></tr>`).join("")}
</table>` : ""}

${insights.filter((i) => i.priority === "high" || i.priority === "medium").length > 0 ? `<h2>Key Insights</h2>
${insights.filter((i) => i.priority === "high" || i.priority === "medium").map((i) => `<div class="insight ${i.priority}">
  <div class="insight-title">${i.title}</div>
  <div class="insight-desc">${i.description}</div>
</div>`).join("")}` : ""}

${actions.filter((a) => a.priority === "high").length > 0 ? `<h2>Recommended Actions</h2>
${actions.filter((a) => a.priority === "high").map((a) => `<div class="insight medium">
  <div class="insight-title">${a.title}</div>
  <div class="insight-desc">${a.description}</div>
</div>`).join("")}` : ""}

<div class="footer">Generated by LinkIntel • ${new Date().toISOString().split("T")[0]} • linkintel.vercel.app</div>

</body></html>`;

        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.onload = () => {
                setTimeout(() => printWindow.print(), 300);
            };
        }
    }, [data, stats, profile, positions, skills, certifications]);

    return (
        <div className="p-8 space-y-8">
            {/* Header with profile info */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Network Briefing</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Intelligence summary of your LinkedIn network
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleExportReport}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-all"
                    >
                        <Download className="h-4 w-4" />
                        Export PDF
                    </button>
                    {profile && (
                        <div className="text-right">
                            <p className="text-sm font-medium text-white">
                                {profile.firstName} {profile.lastName}
                            </p>
                            <p className="text-xs text-indigo-400 max-w-xs truncate">
                                {profile.headline}
                            </p>
                            {profile.geoLocation && (
                                <p className="text-[11px] text-zinc-500 flex items-center justify-end gap-1 mt-0.5">
                                    <MapPin className="h-3 w-3" />
                                    {profile.geoLocation}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Total Connections"
                    value={stats.totalConnections}
                    icon={Users}
                />
                <MetricCard
                    label="Top Company"
                    value={stats.topCompanies.length > 0 ? stats.topCompanies[0].company : "N/A"}
                    subtitle={`${stats.topCompanies[0]?.count || 0} connections`}
                    icon={Building2}
                />
                <MetricCard
                    label="Skills"
                    value={skills.length}
                    subtitle={skills.length > 0 ? skills.slice(0, 3).map((s) => s.name).join(", ") : "None listed"}
                    icon={Wrench}
                />
                <MetricCard
                    label="Certifications"
                    value={certifications.length}
                    subtitle={certifications.length > 0 ? certifications[0].name : "None listed"}
                    icon={Award}
                />
            </div>

            {/* Career Timeline + Skills */}
            {(positions.length > 0 || skills.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Career Timeline */}
                    {positions.length > 0 && (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                            <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-indigo-400" />
                                Career Timeline
                            </h3>
                            <div className="space-y-4">
                                {positions.map((pos, i) => (
                                    <div key={i} className="relative pl-6">
                                        {/* Timeline line */}
                                        {i < positions.length - 1 && (
                                            <div className="absolute left-[9px] top-6 bottom-0 w-px bg-zinc-800" />
                                        )}
                                        {/* Dot */}
                                        <div
                                            className={`absolute left-0 top-1.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${pos.isCurrent
                                                ? "border-emerald-400 bg-emerald-400/20"
                                                : "border-zinc-600 bg-zinc-800"
                                                }`}
                                        >
                                            <div
                                                className={`w-2 h-2 rounded-full ${pos.isCurrent ? "bg-emerald-400" : "bg-zinc-600"
                                                    }`}
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">
                                                {pos.title}
                                            </p>
                                            <p className="text-xs text-indigo-400">
                                                {pos.companyName}
                                            </p>
                                            <p className="text-[11px] text-zinc-500 mt-0.5">
                                                {pos.startedOn}
                                                {pos.finishedOn
                                                    ? ` – ${pos.finishedOn}`
                                                    : " – Present"}
                                                {pos.location ? ` • ${pos.location}` : ""}
                                            </p>
                                            {pos.description && (
                                                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                                                    {pos.description.substring(0, 150)}
                                                    {pos.description.length > 150 ? "..." : ""}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Skills + Certs + Education */}
                    <div className="space-y-6">
                        {/* Skills */}
                        {skills.length > 0 && (
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                                <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-indigo-400" />
                                    Skills ({skills.length})
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((skill, i) => (
                                        <span
                                            key={i}
                                            className="text-xs px-2.5 py-1 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-300"
                                        >
                                            {skill.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Certifications */}
                        {certifications.length > 0 && (
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                                <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                                    <Award className="h-4 w-4 text-amber-400" />
                                    Certifications ({certifications.length})
                                </h3>
                                <div className="space-y-2">
                                    {certifications.map((cert, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2"
                                        >
                                            <div>
                                                <p className="text-sm text-zinc-200">
                                                    {cert.name}
                                                </p>
                                                <p className="text-xs text-zinc-500">
                                                    {cert.authority}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] text-zinc-500">
                                                    {cert.startedOn}
                                                </p>
                                                {cert.finishedOn && (
                                                    <p className="text-[11px] text-amber-400/80">
                                                        Exp: {cert.finishedOn}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education */}
                        {education.length > 0 && (
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                                <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-indigo-400" />
                                    Education
                                </h3>
                                <div className="space-y-2">
                                    {education.map((edu, i) => (
                                        <div key={i} className="rounded-lg bg-zinc-800/50 px-3 py-2">
                                            <p className="text-sm text-zinc-200">
                                                {edu.degreeName || "Degree"}
                                            </p>
                                            <p className="text-xs text-indigo-400">
                                                {edu.schoolName}
                                            </p>
                                            <p className="text-[11px] text-zinc-500">
                                                {edu.startDate} – {edu.endDate}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Connections by year */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-indigo-400" />
                        Connections by Year
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.connectionsByYear}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis
                                    dataKey="year"
                                    tick={{ fill: "#71717a", fontSize: 12 }}
                                    axisLine={{ stroke: "#3f3f46" }}
                                />
                                <YAxis
                                    tick={{ fill: "#71717a", fontSize: 12 }}
                                    axisLine={{ stroke: "#3f3f46" }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#18181b",
                                        border: "1px solid #3f3f46",
                                        borderRadius: "8px",
                                        color: "#fff",
                                        fontSize: "12px",
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#6366f1"
                                    radius={[4, 4, 0, 0]}
                                    name="Connections"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top companies */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-indigo-400" />
                        Top Companies in Network
                    </h3>
                    <div className="space-y-3">
                        {stats.topCompanies.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="w-5 text-xs text-zinc-600 font-mono text-right">
                                    {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-zinc-200 truncate">
                                            {item.company}
                                        </span>
                                        <span className="text-xs text-zinc-500 ml-2">
                                            {item.count}
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                                            style={{
                                                width: `${(item.count / stats.topCompanies[0].count) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Strong ties */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-indigo-400" />
                    Strong Ties (Frequent Contacts)
                </h3>
                {stats.strongTies.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {stats.strongTies.slice(0, 12).map((conn, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 rounded-lg bg-zinc-800/50 px-3 py-2"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold">
                                    {conn.firstName[0]}
                                    {conn.lastName[0]}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-zinc-200 truncate">
                                        {conn.fullName}
                                    </p>
                                    <p className="text-xs text-zinc-500 truncate">
                                        {conn.position} at {conn.company}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-20 text-sm text-zinc-500">
                        {data.hasMessages
                            ? "No strong ties identified"
                            : "Upload Messages.csv for strong-tie analysis"}
                    </div>
                )}
            </div>
        </div>
    );
}
