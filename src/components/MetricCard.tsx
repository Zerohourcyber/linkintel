import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    subtitle?: string;
    trend?: "up" | "down" | "neutral";
    className?: string;
}

export default function MetricCard({
    label,
    value,
    icon: Icon,
    subtitle,
    trend,
    className,
}: MetricCardProps) {
    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/80",
                className
            )}
        >
            {/* Subtle gradient glow */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                        {label}
                    </p>
                    <p className="text-2xl font-bold text-white tabular-nums">
                        {typeof value === "number" ? value.toLocaleString() : value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-zinc-400">{subtitle}</p>
                    )}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/80">
                    <Icon className="h-5 w-5 text-indigo-400" />
                </div>
            </div>

            {trend && (
                <div className="mt-3 flex items-center gap-1">
                    <span
                        className={cn(
                            "text-xs font-medium",
                            trend === "up" && "text-emerald-400",
                            trend === "down" && "text-red-400",
                            trend === "neutral" && "text-zinc-400"
                        )}
                    >
                        {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
                    </span>
                </div>
            )}
        </div>
    );
}
