"use client";

/**
 * Simple markdown renderer for chat messages.
 * Converts markdown syntax to React elements without external dependencies.
 */
export function renderMarkdown(text: string): React.ReactNode[] {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    let inList = false;
    let key = 0;

    const formatInline = (line: string): React.ReactNode[] => {
        const parts: React.ReactNode[] = [];
        let remaining = line;
        let partKey = 0;

        // Bold: **text** or __text__
        while (remaining.length > 0) {
            const boldMatch = remaining.match(/\*\*(.+?)\*\*|__(.+?)__/);
            if (boldMatch && boldMatch.index !== undefined) {
                if (boldMatch.index > 0) {
                    parts.push(
                        <span key={`t-${partKey++}`}>
                            {remaining.slice(0, boldMatch.index)}
                        </span>
                    );
                }
                parts.push(
                    <strong key={`b-${partKey++}`} className="text-white font-semibold">
                        {boldMatch[1] || boldMatch[2]}
                    </strong>
                );
                remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
            } else {
                parts.push(<span key={`t-${partKey++}`}>{remaining}</span>);
                break;
            }
        }

        return parts;
    };

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${key++}`} className="space-y-1 pl-1">
                    {listItems}
                </ul>
            );
            listItems = [];
        }
        inList = false;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Blank line
        if (!trimmed) {
            flushList();
            continue;
        }

        // Headers
        if (trimmed.startsWith("### ")) {
            flushList();
            elements.push(
                <h4 key={`h3-${key++}`} className="text-[13px] font-semibold text-white mt-2 mb-1">
                    {formatInline(trimmed.slice(4))}
                </h4>
            );
            continue;
        }
        if (trimmed.startsWith("## ")) {
            flushList();
            elements.push(
                <h3 key={`h2-${key++}`} className="text-[13px] font-semibold text-white mt-2 mb-1">
                    {formatInline(trimmed.slice(3))}
                </h3>
            );
            continue;
        }
        if (trimmed.startsWith("# ")) {
            flushList();
            elements.push(
                <h2 key={`h1-${key++}`} className="text-sm font-bold text-white mt-2 mb-1">
                    {formatInline(trimmed.slice(2))}
                </h2>
            );
            continue;
        }

        // Numbered list: 1. item
        if (/^\d+\.\s/.test(trimmed)) {
            inList = true;
            const content = trimmed.replace(/^\d+\.\s/, "");
            listItems.push(
                <li key={`li-${key++}`} className="flex gap-2 text-zinc-300">
                    <span className="text-indigo-400 flex-shrink-0">•</span>
                    <span>{formatInline(content)}</span>
                </li>
            );
            continue;
        }

        // Bullet list: - item or * item
        if (/^[-*]\s/.test(trimmed)) {
            inList = true;
            const content = trimmed.slice(2);
            listItems.push(
                <li key={`li-${key++}`} className="flex gap-2 text-zinc-300">
                    <span className="text-indigo-400 flex-shrink-0">•</span>
                    <span>{formatInline(content)}</span>
                </li>
            );
            continue;
        }

        // Regular paragraph
        flushList();
        elements.push(
            <p key={`p-${key++}`} className="text-zinc-300">
                {formatInline(trimmed)}
            </p>
        );
    }

    flushList();
    return elements;
}
