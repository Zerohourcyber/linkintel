import Papa from "papaparse";
import type {
    Connection,
    Message,
    Position,
    Skill,
    Education,
    Certification,
    UserProfile,
    CompanyFollow,
} from "./types";

/**
 * Strip BOM and find the real CSV header row.
 * LinkedIn exports often have note lines before the actual header.
 */
function prepareCSV(csv: string, headerKeywords: string[]): string {
    // Strip BOM
    let cleaned = csv.replace(/^\uFEFF/, "");

    // Split into lines to find the real header
    const lines = cleaned.split(/\r?\n/);

    // Find the line that looks like the actual CSV header
    let headerLineIndex = 0;
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const lineLower = lines[i].toLowerCase();
        const matches = headerKeywords.filter((kw) => lineLower.includes(kw));
        if (matches.length >= 2) {
            headerLineIndex = i;
            break;
        }
    }

    if (headerLineIndex > 0) {
        console.log(
            `[LinkIntel] Skipping ${headerLineIndex} note line(s) before CSV header`
        );
        cleaned = lines.slice(headerLineIndex).join("\n");
    }

    return cleaned;
}

/**
 * Generic CSV parser helper.
 */
function parseCSV(csv: string, headerKeywords: string[]): Record<string, string>[] {
    const cleanedCSV = prepareCSV(csv, headerKeywords);

    const result = Papa.parse<Record<string, string>>(cleanedCSV, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => String(h ?? "").trim(),
    });

    const headers = result.meta?.fields || [];
    console.log("[LinkIntel] Parsed CSV headers:", headers);
    console.log("[LinkIntel] Row count:", result.data.length);

    return result.data.filter((row) => {
        const values = Object.values(row).filter(
            (v) => v != null && String(v).trim()
        );
        return values.length > 0;
    });
}

/**
 * Find a field value from a row using multiple possible column names.
 */
function findField(
    row: Record<string, string>,
    possibleKeys: string[]
): string {
    // Exact match first
    for (const key of possibleKeys) {
        if (row[key] !== undefined && row[key] !== null) {
            return String(row[key]).trim();
        }
    }
    // Case-insensitive fallback
    const rowKeys = Object.keys(row);
    for (const possible of possibleKeys) {
        const lowerPossible = possible.toLowerCase();
        for (const rk of rowKeys) {
            if (
                rk.toLowerCase() === lowerPossible &&
                row[rk] !== undefined &&
                row[rk] !== null
            ) {
                return String(row[rk]).trim();
            }
        }
    }
    return "";
}

/**
 * Parse various date formats from LinkedIn exports.
 */
function parseDate(dateStr: string | undefined): Date | null {
    if (!dateStr) return null;
    const cleaned = String(dateStr).trim();
    if (!cleaned) return null;

    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) return parsed;

    // DD MMM YYYY format
    const dayMonthYear = cleaned.match(
        /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i
    );
    if (dayMonthYear) {
        const d = new Date(
            `${dayMonthYear[2]} ${dayMonthYear[1]}, ${dayMonthYear[3]}`
        );
        if (!isNaN(d.getTime())) return d;
    }

    return null;
}

// ─── Connections ────────────────────────────────────────

export function parseConnections(csv: string): Connection[] {
    const rows = parseCSV(csv, [
        "first name",
        "last name",
        "company",
        "position",
        "connected on",
        "email address",
        "url",
    ]);

    return rows
        .map((row) => {
            const firstName = findField(row, [
                "First Name",
                "first name",
                "FirstName",
            ]);
            const lastName = findField(row, [
                "Last Name",
                "last name",
                "LastName",
            ]);
            const company = findField(row, ["Company", "company", "Organization"]);
            const position = findField(row, [
                "Position",
                "position",
                "Title",
                "title",
            ]);
            const email = findField(row, [
                "Email Address",
                "email address",
                "Email",
                "EmailAddress",
            ]);
            const connectedOnRaw = findField(row, [
                "Connected On",
                "connected on",
                "ConnectedOn",
                "Connected on",
            ]);
            const url = findField(row, ["URL", "url", "Url", "Profile URL"]);

            const fullName = `${firstName || ""} ${lastName || ""}`.trim();
            const altName =
                fullName || findField(row, ["Name", "name", "FullName"]);

            return {
                firstName: firstName || "",
                lastName: lastName || "",
                fullName: altName,
                emailAddress: email || "",
                company: company || "Unknown",
                position: position || "Unknown",
                connectedOn: parseDate(connectedOnRaw),
                connectedOnRaw: connectedOnRaw || "",
                url: url || "",
            };
        })
        .filter((c) => c.fullName.length > 0);
}

// ─── Messages ────────────────────────────────────────

export function parseMessages(csv: string): Message[] {
    const rows = parseCSV(csv, [
        "from",
        "to",
        "date",
        "subject",
        "content",
        "conversation",
    ]);

    return rows.map((row) => ({
        from: findField(row, ["From", "from", "Sender"]) || "",
        to: findField(row, ["To", "to", "Recipient"]) || "",
        date: parseDate(
            findField(row, ["Date", "date", "Sent", "SENT DATE"])
        ),
        subject: findField(row, ["Subject", "subject", "Title"]) || "",
        content: findField(row, ["Content", "content", "Body"]) || "",
        conversationId:
            findField(row, [
                "CONVERSATION ID",
                "Conversation ID",
                "ConversationId",
            ]) || "",
        folder: findField(row, ["Folder", "folder"]) || "",
    }));
}

// ─── Positions (Work History) ────────────────────────

export function parsePositions(csv: string): Position[] {
    const rows = parseCSV(csv, [
        "company name",
        "title",
        "description",
        "location",
        "started on",
        "finished on",
    ]);

    return rows.map((row) => {
        const finishedOn = findField(row, [
            "Finished On",
            "finished on",
            "End Date",
        ]);
        return {
            companyName:
                findField(row, ["Company Name", "company name", "Company"]) ||
                "Unknown",
            title:
                findField(row, ["Title", "title", "Position"]) || "Unknown",
            description: findField(row, [
                "Description",
                "description",
                "Summary",
            ]),
            location: findField(row, [
                "Location",
                "location",
                "Geo Location",
            ]),
            startedOn: findField(row, [
                "Started On",
                "started on",
                "Start Date",
            ]),
            finishedOn: finishedOn,
            isCurrent: !finishedOn || finishedOn === "",
        };
    });
}

// ─── Skills ────────────────────────────────────────

export function parseSkills(csv: string): Skill[] {
    // Skills.csv is simple — just a "Name" column
    const cleaned = csv.replace(/^\uFEFF/, "");
    const lines = cleaned.split(/\r?\n/).filter((l) => l.trim());

    // First line is header
    return lines
        .slice(1)
        .map((line) => ({ name: line.trim() }))
        .filter((s) => s.name.length > 0);
}

// ─── Education ────────────────────────────────────────

export function parseEducation(csv: string): Education[] {
    const rows = parseCSV(csv, [
        "school name",
        "start date",
        "end date",
        "degree name",
    ]);

    return rows.map((row) => ({
        schoolName:
            findField(row, ["School Name", "school name", "School"]) ||
            "Unknown",
        startDate: findField(row, [
            "Start Date",
            "start date",
            "Started On",
        ]),
        endDate: findField(row, ["End Date", "end date", "Finished On"]),
        degreeName: findField(row, [
            "Degree Name",
            "degree name",
            "Degree",
        ]),
        notes: findField(row, ["Notes", "notes"]),
        activities: findField(row, ["Activities", "activities"]),
    }));
}

// ─── Certifications ────────────────────────────────────

export function parseCertifications(csv: string): Certification[] {
    const rows = parseCSV(csv, [
        "name",
        "authority",
        "started on",
        "finished on",
        "license number",
    ]);

    return rows.map((row) => ({
        name: findField(row, ["Name", "name"]) || "Unknown",
        url: findField(row, ["Url", "url", "URL"]),
        authority: findField(row, ["Authority", "authority", "Issuer"]),
        startedOn: findField(row, [
            "Started On",
            "started on",
            "Start Date",
        ]),
        finishedOn: findField(row, [
            "Finished On",
            "finished on",
            "End Date",
            "Expiry Date",
        ]),
        licenseNumber: findField(row, [
            "License Number",
            "license number",
            "Credential ID",
        ]),
    }));
}

// ─── Profile ────────────────────────────────────────

export function parseProfile(csv: string): UserProfile | null {
    const rows = parseCSV(csv, [
        "first name",
        "last name",
        "headline",
        "summary",
        "industry",
    ]);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
        firstName: findField(row, ["First Name", "first name"]),
        lastName: findField(row, ["Last Name", "last name"]),
        headline: findField(row, ["Headline", "headline"]),
        summary: findField(row, ["Summary", "summary"]),
        industry: findField(row, ["Industry", "industry"]),
        zipCode: findField(row, ["Zip Code", "zip code"]),
        geoLocation: findField(row, [
            "Geo Location",
            "geo location",
            "Location",
        ]),
        websites: findField(row, ["Websites", "websites"]),
    };
}

// ─── Company Follows ────────────────────────────────────

export function parseCompanyFollows(csv: string): CompanyFollow[] {
    const rows = parseCSV(csv, ["organization", "followed on"]);

    return rows.map((row) => ({
        organization:
            findField(row, ["Organization", "organization", "Company"]) ||
            "Unknown",
        followedOn: findField(row, [
            "Followed On",
            "followed on",
            "Date",
        ]),
    }));
}
