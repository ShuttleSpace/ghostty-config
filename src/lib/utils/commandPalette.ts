// Parse/serialize `command-palette-entry` values.
// Format (Ghostty): comma-separated `field:value` pairs, e.g.
//   title:Reset Font Style, action:csi:0m
// Values containing commas/quotes are wrapped in Zig string literals.

export interface CommandPaletteEntry {
    title: string;
    action: string;
    description?: string;
}

// Special values that are not buildable entries.
export const COMMAND_PALETTE_CLEAR = "clear";

function splitFields(raw: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuote = false;

    for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        if (ch === "\\" && inQuote) {
            // Keep the escape pair together so a \" does not flip quote state.
            current += ch + (raw[i + 1] ?? "");
            i++;
        }
 else if (ch === "\"") {
            inQuote = !inQuote;
            current += ch;
        }
 else if (ch === "," && !inQuote) {
            fields.push(current);
            current = "";
        }
 else {
            current += ch;
        }
    }
    fields.push(current);

    return fields.map((field) => field.trim()).filter(Boolean);
}

function unquote(value: string): string {
    if (value.length < 2 || !value.startsWith("\"") || !value.endsWith("\"")) return value;
    return value.slice(1, -1).replace(/\\(.)/g, (_, char: string) => {
        switch (char) {
            case "n":
                return "\n";
            case "t":
                return "\t";
            case "r":
                return "\r";
            default:
                return char;
        }
    });
}

function quote(value: string): string {
    if (value === "") return "\"\"";
    if (!/[,"\n\t]/.test(value) && value === value.trim()) return value;
    const escaped = value
        .replace(/\\/g, "\\\\")
        .replace(/"/g, "\\\"")
        .replace(/\n/g, "\\n")
        .replace(/\t/g, "\\t");
    return `"${escaped}"`;
}

/** Returns null for empty/`clear` entries that cannot be built in the UI. */
export function parseCommandPaletteEntry(raw: string): CommandPaletteEntry | null {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === COMMAND_PALETTE_CLEAR) return null;

    const entry: Partial<CommandPaletteEntry> = {};
    for (const field of splitFields(trimmed)) {
        const separator = field.indexOf(":");
        if (separator < 0) continue;
        const key = field.slice(0, separator).trim().toLowerCase();
        const value = unquote(field.slice(separator + 1).trim());
        if (key === "title") entry.title = value;
        else if (key === "action") entry.action = value;
        else if (key === "description") entry.description = value;
    }

    if (!entry.title && !entry.action) return null;
    return {title: entry.title ?? "", action: entry.action ?? "", description: entry.description};
}

export function serializeCommandPaletteEntry(entry: CommandPaletteEntry): string {
    const parts = [`title:${quote(entry.title)}`];
    if (entry.description) parts.push(`description:${quote(entry.description)}`);
    parts.push(`action:${quote(entry.action)}`);
    return parts.join(", ");
}

/** A title is required; the action must be non-empty. */
export function validateCommandPaletteEntry(entry: CommandPaletteEntry): boolean {
    return entry.title.trim().length > 0 && entry.action.trim().length > 0;
}
