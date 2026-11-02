"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import * as d3 from "d3";
import type { NetworkNode, NetworkLink, NetworkGraph as NetworkGraphType } from "@/lib/types";
import { Search, X } from "lucide-react";

interface NetworkGraphProps {
    graph: NetworkGraphType;
    width?: number;
    height?: number;
}

export default function NetworkGraph({ graph }: NetworkGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const simulationRef = useRef<d3.Simulation<NetworkNode, NetworkLink> | null>(null);
    const [tooltip, setTooltip] = useState<{
        x: number;
        y: number;
        node: NetworkNode;
    } | null>(null);
    const [filterCompany, setFilterCompany] = useState<string>("");
    const [filterYear, setFilterYear] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Get unique companies (top 20) and years for filters
    const companies = useMemo(() => {
        const map = new Map<string, number>();
        for (const n of graph.nodes) {
            const c = n.company || "Unknown";
            map.set(c, (map.get(c) || 0) + 1);
        }
        return [...map.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([name]) => name);
    }, [graph.nodes]);

    const years = useMemo(() => {
        const set = new Set<string>();
        for (const n of graph.nodes) {
            if (n.connectedOn) set.add(n.connectedOn.getFullYear().toString());
        }
        return [...set].sort((a, b) => parseInt(b) - parseInt(a));
    }, [graph.nodes]);

    // Filter nodes
    const filteredNodeIds = useMemo(() => {
        const ids = new Set<string>();
        for (const n of graph.nodes) {
            let match = true;
            if (filterCompany && n.company !== filterCompany) match = false;
            if (filterYear && n.connectedOn?.getFullYear().toString() !== filterYear)
                match = false;
            if (
                searchTerm &&
                !n.fullName.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !n.company.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !n.position.toLowerCase().includes(searchTerm.toLowerCase())
            )
                match = false;
            if (match) ids.add(n.id);
        }
        return ids;
    }, [graph.nodes, filterCompany, filterYear, searchTerm]);

    const clearFilters = useCallback(() => {
        setFilterCompany("");
        setFilterYear("");
        setSearchTerm("");
    }, []);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Clean up previous simulation
        if (simulationRef.current) {
            simulationRef.current.stop();
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        svg.attr("width", width).attr("height", height);

        // Create main group for zoom
        const g = svg.append("g");

        // Zoom behavior
        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 5])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });
        svg.call(zoom);

        // Clone data to avoid mutation
        const nodes: NetworkNode[] = graph.nodes.map((n) => ({ ...n }));
        const links: NetworkLink[] = graph.links.map((l) => ({ ...l }));

        // Force simulation
        const simulation = d3
            .forceSimulation<NetworkNode>(nodes)
            .force(
                "link",
                d3
                    .forceLink<NetworkNode, NetworkLink>(links)
                    .id((d) => d.id)
                    .distance(80)
                    .strength(0.2)
            )
            .force("charge", d3.forceManyBody().strength(-30).distanceMax(300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(8))
            .alphaDecay(0.02);

        simulationRef.current = simulation;

        // Draw links
        const link = g
            .append("g")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke", "#374151")
            .attr("stroke-opacity", 0.3)
            .attr("stroke-width", 0.5);

        // Draw nodes
        const node = g
            .append("g")
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", 5)
            .attr("fill", (d) => d.clusterColor)
            .attr("stroke", "#000")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.85)
            .attr("cursor", "pointer")
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr("r", 9)
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 2);

                setTooltip({
                    x: event.clientX,
                    y: event.clientY,
                    node: d,
                });
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr("r", 5)
                    .attr("stroke", "#000")
                    .attr("stroke-width", 0.5);

                setTooltip(null);
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .call(
                d3
                    .drag<any, NetworkNode>()
                    .on("start", (event, d) => {
                        if (!event.active) simulation.alphaTarget(0.3).restart();
                        d.fx = d.x;
                        d.fy = d.y;
                    })
                    .on("drag", (event, d) => {
                        d.fx = event.x;
                        d.fy = event.y;
                    })
                    .on("end", (event, d) => {
                        if (!event.active) simulation.alphaTarget(0);
                        d.fx = null;
                        d.fy = null;
                    }) as any
            );

        // Tick handler
        simulation.on("tick", () => {
            link
                .attr("x1", (d) => (d.source as NetworkNode).x ?? 0)
                .attr("y1", (d) => (d.source as NetworkNode).y ?? 0)
                .attr("x2", (d) => (d.target as NetworkNode).x ?? 0)
                .attr("y2", (d) => (d.target as NetworkNode).y ?? 0);

            node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
        });

        // Initial zoom to fit
        svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(0.9));

        return () => {
            simulation.stop();
        };
    }, [graph]);

    // Update node visibility based on filters
    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        const hasFilters = filterCompany || filterYear || searchTerm;

        svg.selectAll<SVGCircleElement, NetworkNode>("circle").attr("opacity", (d) =>
            hasFilters ? (filteredNodeIds.has(d.id) ? 1 : 0.08) : 0.85
        );
    }, [filteredNodeIds, filterCompany, filterYear, searchTerm]);

    return (
        <div className="relative w-full h-full">
            {/* Filters bar */}
            <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search name, company, title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 w-64 rounded-lg border border-zinc-700 bg-zinc-900/90 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none backdrop-blur-sm"
                    />
                </div>

                {/* Company filter */}
                <select
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                    className="h-9 rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none backdrop-blur-sm"
                >
                    <option value="">All Companies</option>
                    {companies.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>

                {/* Year filter */}
                <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="h-9 rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none backdrop-blur-sm"
                >
                    <option value="">All Years</option>
                    {years.map((y) => (
                        <option key={y} value={y}>
                            {y}
                        </option>
                    ))}
                </select>

                {/* Clear */}
                {(filterCompany || filterYear || searchTerm) && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 h-9 rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors backdrop-blur-sm"
                    >
                        <X className="h-3 w-3" />
                        Clear
                    </button>
                )}

                {/* Node count */}
                <span className="ml-auto text-xs text-zinc-500 bg-zinc-900/90 px-2 py-1 rounded backdrop-blur-sm">
                    {filteredNodeIds.size} / {graph.nodes.length} nodes
                </span>
            </div>

            {/* Graph */}
            <div ref={containerRef} className="w-full h-full">
                <svg ref={svgRef} className="w-full h-full" />
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="fixed z-50 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl pointer-events-none"
                    style={{
                        left: tooltip.x + 12,
                        top: tooltip.y - 12,
                    }}
                >
                    <p className="text-sm font-semibold text-white">
                        {tooltip.node.fullName}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        {tooltip.node.position}
                    </p>
                    <p className="text-xs text-indigo-400">
                        {tooltip.node.company}
                    </p>
                    {tooltip.node.connectedOn && (
                        <p className="text-xs text-zinc-500 mt-1">
                            Connected{" "}
                            {tooltip.node.connectedOn.toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                            })}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
