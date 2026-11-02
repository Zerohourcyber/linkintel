export interface Connection {
    firstName: string;
    lastName: string;
    fullName: string;
    emailAddress: string;
    company: string;
    position: string;
    connectedOn: Date | null;
    connectedOnRaw: string;
    url?: string;
}

export interface Message {
    from: string;
    to: string;
    date: Date | null;
    subject: string;
    content: string;
    conversationId: string;
    folder: string;
}

export interface Position {
    companyName: string;
    title: string;
    description: string;
    location: string;
    startedOn: string;
    finishedOn: string;
    isCurrent: boolean;
}

export interface Skill {
    name: string;
}

export interface Education {
    schoolName: string;
    startDate: string;
    endDate: string;
    degreeName: string;
    notes: string;
    activities: string;
}

export interface Certification {
    name: string;
    url: string;
    authority: string;
    startedOn: string;
    finishedOn: string;
    licenseNumber: string;
}

export interface UserProfile {
    firstName: string;
    lastName: string;
    headline: string;
    summary: string;
    industry: string;
    zipCode: string;
    geoLocation: string;
    websites: string;
}

export interface CompanyFollow {
    organization: string;
    followedOn: string;
}

export interface ParsedData {
    connections: Connection[];
    messages: Message[];
    hasMessages: boolean;
    positions: Position[];
    skills: Skill[];
    education: Education[];
    certifications: Certification[];
    profile: UserProfile | null;
    companyFollows: CompanyFollow[];
}

export interface NetworkNode {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    company: string;
    position: string;
    connectedOn: Date | null;
    cluster: string;
    clusterColor: string;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

export interface NetworkLink {
    source: string | NetworkNode;
    target: string | NetworkNode;
    strength: number;
}

export interface NetworkGraph {
    nodes: NetworkNode[];
    links: NetworkLink[];
}

export interface InsightCard {
    id: string;
    title: string;
    description: string;
    category: "military" | "recruiter" | "company" | "network" | "action";
    priority: "high" | "medium" | "low";
    details: string[];
    icon: string;
}

export interface ContactInfo {
    firstName: string;
    lastName: string;
    fullName: string;
    company: string;
    position: string;
}

export interface ActionItem {
    id: string;
    title: string;
    description: string;
    category: "reconnect" | "diversify" | "outreach" | "messaging" | "networking";
    priority: "high" | "medium" | "low";
    contacts?: ContactInfo[];
    template?: string;
}

export interface CompanyCount {
    company: string;
    count: number;
}

export interface YearCount {
    year: string;
    count: number;
}

export interface BriefingStats {
    totalConnections: number;
    topCompanies: CompanyCount[];
    topIndustries: CompanyCount[];
    connectionsByYear: YearCount[];
    strongTies: Connection[];
    recentConnections: Connection[];
    oldestConnection: Connection | null;
    newestConnection: Connection | null;
}
