"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Upload,
    BarChart3,
    Network,
    Brain,
    Zap,
    Shield,
    Sparkles,
    Users,
    Award,
    Wrench,
    Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";

const navItems = [
    { href: "/upload", label: "Upload", icon: Upload },
    { href: "/briefing", label: "Briefing", icon: BarChart3 },
    { href: "/network", label: "Network", icon: Network },
    { href: "/intel", label: "Intel", icon: Brain },
    { href: "/actions", label: "Actions", icon: Zap },
    { href: "/advisor", label: "Brand Buddy", icon: Sparkles },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { data } = useData();
    const hasData = data !== null;

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
                    <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white tracking-tight">
                        LinkIntel
                    </h1>
                    <p className="text-[11px] text-zinc-500 leading-none">
                        Network Intelligence
                    </p>
                </div>
            </div>

            {/* Profile card */}
            {hasData && data.profile && (
                <div className="px-4 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold flex-shrink-0">
                            {data.profile.firstName?.[0] || ""}
                            {data.profile.lastName?.[0] || ""}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate">
                                {data.profile.firstName} {data.profile.lastName}
                            </p>
                            <p className="text-[11px] text-zinc-400 truncate">
                                {data.profile.headline?.substring(0, 40) || data.profile.industry}
                                {data.profile.headline && data.profile.headline.length > 40 ? "..." : ""}
                            </p>
                        </div>
                    </div>
                    {/* Data stats */}
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                            <Users className="h-3 w-3 text-indigo-400" />
                            <span>{data.connections.length} contacts</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                            <Wrench className="h-3 w-3 text-indigo-400" />
                            <span>{data.skills.length} skills</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                            <Award className="h-3 w-3 text-amber-400" />
                            <span>{data.certifications.length} certs</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                            <Briefcase className="h-3 w-3 text-indigo-400" />
                            <span>{data.positions.length} roles</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const isDisabled = item.href !== "/upload" && !hasData;

                    return (
                        <Link
                            key={item.href}
                            href={isDisabled ? "#" : item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
                                isDisabled && "opacity-40 pointer-events-none"
                            )}
                            onClick={(e) => isDisabled && e.preventDefault()}
                        >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Data status */}
            {hasData && (
                <div className="border-t border-zinc-800 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] text-zinc-400">
                            Data loaded • Session only
                        </span>
                    </div>
                </div>
            )}

            {/* Privacy badge */}
            <div className="border-t border-zinc-800 px-4 py-3">
                <div className="flex items-center gap-2 text-[11px] text-zinc-600">
                    <Shield className="h-3 w-3" />
                    <span>100% client-side processing</span>
                </div>
            </div>
        </aside>
    );
}
