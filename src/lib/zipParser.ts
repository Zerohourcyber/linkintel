import JSZip from "jszip";

export interface ExtractedFiles {
    connectionsCSV: string;
    messagesCSV: string | null;
    positionsCSV: string | null;
    skillsCSV: string | null;
    educationCSV: string | null;
    certificationsCSV: string | null;
    profileCSV: string | null;
    companyFollowsCSV: string | null;
}

/** Map of known filenames (lowercase) to their ExtractedFiles key */
const FILE_MAP: Record<string, keyof Omit<ExtractedFiles, "connectionsCSV">> = {
    "messages.csv": "messagesCSV",
    "positions.csv": "positionsCSV",
    "skills.csv": "skillsCSV",
    "education.csv": "educationCSV",
    "certifications.csv": "certificationsCSV",
    "profile.csv": "profileCSV",
    "company follows.csv": "companyFollowsCSV",
};

/**
 * Extract CSV files from a LinkedIn data export ZIP.
 * Requires Connections.csv; all others are optional.
 */
export async function extractFromZip(file: File): Promise<ExtractedFiles> {
    const zip = await JSZip.loadAsync(file);

    let connectionsCSV: string | null = null;
    const optionalFiles: Partial<Record<keyof ExtractedFiles, string | null>> = {};

    const fileEntries = Object.entries(zip.files);

    for (const [path, zipEntry] of fileEntries) {
        if (zipEntry.dir) continue;

        const name = path.split("/").pop()?.toLowerCase() ?? "";

        if (name === "connections.csv") {
            connectionsCSV = await zipEntry.async("string");
        } else if (FILE_MAP[name]) {
            optionalFiles[FILE_MAP[name]] = await zipEntry.async("string");
        }
    }

    if (!connectionsCSV) {
        throw new Error(
            "Invalid LinkedIn export: Connections.csv not found in the ZIP file. " +
            "Please make sure you uploaded the correct LinkedIn data export."
        );
    }

    console.log(
        "[LinkIntel] Extracted files:",
        ["Connections.csv", ...Object.keys(optionalFiles).filter((k) => optionalFiles[k as keyof typeof optionalFiles])].join(", ")
    );

    return {
        connectionsCSV,
        messagesCSV: (optionalFiles.messagesCSV as string) ?? null,
        positionsCSV: (optionalFiles.positionsCSV as string) ?? null,
        skillsCSV: (optionalFiles.skillsCSV as string) ?? null,
        educationCSV: (optionalFiles.educationCSV as string) ?? null,
        certificationsCSV: (optionalFiles.certificationsCSV as string) ?? null,
        profileCSV: (optionalFiles.profileCSV as string) ?? null,
        companyFollowsCSV: (optionalFiles.companyFollowsCSV as string) ?? null,
    };
}
