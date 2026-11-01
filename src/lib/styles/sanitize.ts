/**
 * Sanitizer for remote style configs (ghostty.style and anything else fetched over the wire).
 *
 * Ghostty themes may set *any* config option, including ones that execute commands or pull in
 * other files. A community style is untrusted input, so these keys are stripped before the
 * config ever reaches the import preview. Keep this module dependency-free: the sync script
 * imports it directly, outside the SvelteKit app.
 */

export const UNSAFE_CONFIG_KEYS: ReadonlySet<string> = new Set([
    "command",
    "initial-command",
    "config-file",
    "config-default-files",
    "env",
    "shell-integration",
    "shell-integration-features",
    "auto-update",
    "auto-update-channel",
    "keybind"
]);

/**
 * Strip an inline comment from a config value.
 *
 * Ghostty only supports whole-line comments; `font-size = 13 # bigger` makes everything after
 * `=` part of the value. Walk ` #` occurrences and skip ones that start a hex color token
 * (`#RRGGBB` / `#RGB`), so `background = #0a0a0a` survives.
 */
export function stripInlineComment(value: string): string {
    let searchFrom = 0;
    while (searchFrom < value.length) {
        const index = value.indexOf(" #", searchFrom);
        if (index === -1) break;

        const afterHash = value.slice(index + 2);
        const hexMatch = afterHash.match(/^([0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?)(?:\s|$)/);
        if (hexMatch) {
            searchFrom = index + 2 + hexMatch[1].length;
            continue;
        }

        return value.slice(0, index).trimEnd();
    }
    return value;
}

function unquote(value: string): string {
    if (
        (value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))
    ) {
        return value.slice(1, -1);
    }
    return value;
}

/**
 * Normalize a remote config to `key = value` lines:
 * - drop whole-line comments
 * - drop unsafe keys (returned so the UI can tell the user)
 * - drop inline comments and surrounding quotes
 * - collapse blank lines
 *
 * The output is what gets stored on a `Style` and fed to the import pipeline, so applying a
 * style never re-introduces a key that was stripped during sync.
 */
export function sanitizeRemoteConfig(raw: string): {text: string; strippedKeys: string[]} {
    const stripped = new Set<string>();
    const lines: string[] = [];
    let previousBlank = false;

    for (const rawLine of raw.split("\n")) {
        const line = rawLine.trim();

        if (!line || line.startsWith("#")) {
            if (!line && !previousBlank && lines.length > 0) lines.push("");
            previousBlank = !line;
            continue;
        }
        previousBlank = false;

        const eqIndex = line.indexOf("=");
        if (eqIndex === -1) continue;

        const key = line.slice(0, eqIndex).trim().toLowerCase();
        if (!key) continue;

        if (UNSAFE_CONFIG_KEYS.has(key)) {
            stripped.add(key);
            continue;
        }

        const value = unquote(stripInlineComment(line.slice(eqIndex + 1).trim()));
        if (!value) continue;

        lines.push(`${key} = ${value}`);
    }

    while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

    return {
        text: lines.length > 0 ? `${lines.join("\n")}\n` : "",
        strippedKeys: [...stripped].sort()
    };
}
