import type { Connection, NetworkNode, NetworkLink, NetworkGraph } from "./types";

// Curated color palette for company clusters — dark-mode optimized
const CLUSTER_COLORS = [
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#f43f5e", // rose
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#14b8a6", // teal
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#a855f7", // purple
    "#ef4444", // red
    "#84cc16", // lime
    "#0ea5e9", // sky
    "#d946ef", // fuchsia
];

const DEFAULT_COLOR = "#64748b"; // slate

/**
 * Build a network graph from connections.
 * Nodes = connections. Links = shared company (capped for performance).
 */
export function buildNetworkGraph(connections: Connection[]): NetworkGraph {
    // Count companies to find top clusters
    const companyMap = new Map<string, Connection[]>();
    for (const conn of connections) {
        const company = normalizeCompany(conn.company);
        if (!companyMap.has(company)) companyMap.set(company, []);
        companyMap.get(company)!.push(conn);
    }

    // Sort companies by size and assign colors
    const sortedCompanies = [...companyMap.entries()]
        .sort((a, b) => b[1].length - a[1].length);

    const companyColorMap = new Map<string, string>();
    sortedCompanies.forEach(([company], i) => {
        companyColorMap.set(
            company,
            i < CLUSTER_COLORS.length ? CLUSTER_COLORS[i] : DEFAULT_COLOR
        );
    });

    // Build nodes
    const nodes: NetworkNode[] = connections.map((conn, i) => {
        const company = normalizeCompany(conn.company);
        return {
            id: `node-${i}`,
            firstName: conn.firstName,
            lastName: conn.lastName,
            fullName: conn.fullName,
            company: conn.company,
            position: conn.position,
            connectedOn: conn.connectedOn,
            cluster: company,
            clusterColor: companyColorMap.get(company) ?? DEFAULT_COLOR,
        };
    });

    // Build links: connect nodes sharing the same company
    // Limit links per company for performance
    const links: NetworkLink[] = [];
    const MAX_LINKS_PER_COMPANY = 50;

    const nodesByCompany = new Map<string, NetworkNode[]>();
    for (const node of nodes) {
        const key = normalizeCompany(node.company);
        if (key === "unknown") continue;
        if (!nodesByCompany.has(key)) nodesByCompany.set(key, []);
        nodesByCompany.get(key)!.push(node);
    }

    for (const [, companyNodes] of nodesByCompany) {
        if (companyNodes.length < 2) continue;

        let linkCount = 0;
        for (let i = 0; i < companyNodes.length && linkCount < MAX_LINKS_PER_COMPANY; i++) {
            for (let j = i + 1; j < companyNodes.length && linkCount < MAX_LINKS_PER_COMPANY; j++) {
                links.push({
                    source: companyNodes[i].id,
                    target: companyNodes[j].id,
                    strength: 0.3,
                });
                linkCount++;
            }
        }
    }

    return { nodes, links };
}

/**
 * Get unique companies from connections, sorted by count.
 */
export function getUniqueCompanies(connections: Connection[]): string[] {
    const counts = new Map<string, number>();
    for (const c of connections) {
        const company = c.company || "Unknown";
        counts.set(company, (counts.get(company) || 0) + 1);
    }
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([company]) => company);
}

/**
 * Get unique years from connections.
 */
export function getUniqueYears(connections: Connection[]): string[] {
    const years = new Set<string>();
    for (const c of connections) {
        if (c.connectedOn) {
            years.add(c.connectedOn.getFullYear().toString());
        }
    }
    return [...years].sort((a, b) => parseInt(b) - parseInt(a));
}

function normalizeCompany(company: string): string {
    return (company || "Unknown").trim().toLowerCase();
}
