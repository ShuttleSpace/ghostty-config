#!/usr/bin/env bun
/**
 * Generates $lib/data/styles.ts from the ghostty.style catalog.
 *
 * ghostty.style is a Next.js + Supabase gallery: every row is a complete Ghostty config, not
 * just a color theme. Its seed data comes from iTerm2-Color-Schemes (which this repo already
 * syncs into themes.ts), so the sync keeps only community submissions (`is_seed = false`) by
 * default. Those are the entries that bundle fonts, opacity, padding and cursor settings —
 * the actual increment over the built-in theme list.
 *
 * Usage:
 *   bun run scripts/generate-styles.ts
 *   bun run scripts/generate-styles.ts --include-seed --featured
 *   bun run scripts/generate-styles.ts --from-fixture=./styles.json
 *
 * Flags:
 *   --include-seed        keep rows whose is_seed flag is true (the iTerm2 duplicates)
 *   --featured            only rows with is_featured = true
 *   --max-pages=N         pagination cap (default 50, 24 rows per page)
 *   --endpoint=URL        override the API base (also reads GHOSTTY_STYLE_API)
 *   --from-fixture=PATH   read a saved API response instead of hitting the network
 *   --allow-stale         exit 0 and leave the file untouched when the API is unreachable
 *   --allow-empty         write an empty catalog instead of keeping the previous one
 */

import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {sanitizeRemoteConfig} from "../src/lib/styles/sanitize";
import type {Style} from "../src/lib/styles/types";
import {isDark, type ColorScheme, type HexColor} from "../src/lib/utils/colors";

const DEFAULT_ENDPOINTS = [
    "https://ghostty.style/api/configs",
    "https://ghostty-style.vercel.app/api/configs"
];

const OUTPUT_PATH = join(import.meta.dirname, "..", "src", "lib", "data", "styles.ts");
const SUMMARY_PATH = join(import.meta.dirname, "..", "styles-diff-summary.md");
const USER_AGENT = "ghostty-config-style-sync (+https://github.com/zerebos/ghostty-config)";

const FALLBACK_PALETTE: HexColor[] = [
    "#282c34",
    "#e06c75",
    "#98c379",
    "#e5c07b",
    "#61afef",
    "#c678dd",
    "#56b6c2",
    "#abb2bf",
    "#545862",
    "#e06c75",
    "#98c379",
    "#e5c07b",
    "#61afef",
    "#c678dd",
    "#56b6c2",
    "#c8ccd4"
];

interface ApiConfig {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    rawConfig: string;
    background: string;
    foreground: string;
    cursorColor: string | null;
    cursorText: string | null;
    selectionBg: string | null;
    selectionFg: string | null;
    palette: string[];
    isDark: boolean;
    tags: string[];
    sourceUrl: string | null;
    authorName: string | null;
    isFeatured: boolean;
    isSeed: boolean;
    voteCount: number;
    updatedAt: string;
}

interface ApiPage {
    configs: ApiConfig[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
}

interface Options {
    endpoint?: string;
    fixture?: string;
    maxPages: number;
    includeSeed: boolean;
    featuredOnly: boolean;
    allowStale: boolean;
    allowEmpty: boolean;
}

function parseArgs(argv: string[]): Options {
    const options: Options = {
        endpoint: process.env.GHOSTTY_STYLE_API?.trim() || undefined,
        maxPages: 50,
        includeSeed: false,
        featuredOnly: false,
        allowStale: false,
        allowEmpty: false
    };

    for (const arg of argv) {
        if (arg === "--include-seed") {
            options.includeSeed = true;
        }
 else if (arg === "--featured") {
            options.featuredOnly = true;
        }
 else if (arg === "--allow-stale") {
            options.allowStale = true;
        }
 else if (arg === "--allow-empty") {
            options.allowEmpty = true;
        }
 else if (arg.startsWith("--max-pages=")) {
            const value = Number.parseInt(arg.slice("--max-pages=".length), 10);
            if (Number.isFinite(value) && value > 0) {
                options.maxPages = value;
            }
        }
 else if (arg.startsWith("--endpoint=")) {
            options.endpoint = arg.slice("--endpoint=".length);
        }
 else if (arg.startsWith("--from-fixture=")) {
            options.fixture = arg.slice("--from-fixture=".length);
        }
 else if (arg === "--help" || arg === "-h") {
            console.log(
                [
                    "Generate src/lib/data/styles.ts from the ghostty.style catalog.",
                    "",
                    "Flags:",
                    "  --include-seed        keep iTerm2 seed rows (default: community only)",
                    "  --featured            only rows with is_featured = true",
                    "  --max-pages=N         pagination cap (default 50)",
                    "  --endpoint=URL        API base (also reads GHOSTTY_STYLE_API)",
                    "  --from-fixture=PATH   read a saved API response instead of the network",
                    "  --allow-stale         leave the file untouched when the API is unreachable",
                    "  --allow-empty         write an empty catalog instead of keeping the previous one"
                ].join("\n")
            );
            process.exit(0);
        }
 else {
            console.warn(`Ignoring unknown argument: ${arg}`);
        }
    }

    return options;
}

function normalizeHex(value: string | null | undefined): HexColor | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(withHash)) return undefined;
    return withHash.toLowerCase() as HexColor;
}

function schemeFromRow(row: ApiConfig): {colors: ColorScheme; isDark: boolean} {
    const palette: HexColor[] = [];
    for (let index = 0; index < 16; index++) {
        palette.push(normalizeHex(row.palette?.[index]) ?? FALLBACK_PALETTE[index]);
    }

    const colors: ColorScheme = {
        palette,
        background: normalizeHex(row.background) ?? palette[0],
        foreground: normalizeHex(row.foreground) ?? palette[7],
        cursorColor: normalizeHex(row.cursorColor),
        cursorText: normalizeHex(row.cursorText),
        selectionBackground: normalizeHex(row.selectionBg),
        selectionForeground: normalizeHex(row.selectionFg)
    };

    const background = colors.background ?? palette[0];
    return {colors, isDark: row.isDark ?? isDark(background)};
}

async function fetchPage(base: string, page: number): Promise<ApiPage> {
    const url = new URL(base);
    url.searchParams.set("sort", "popular");
    url.searchParams.set("page", String(page));

    const response = await fetch(url, {
        headers: {"Accept": "application/json", "User-Agent": USER_AGENT},
        signal: AbortSignal.timeout(30_000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
    return (await response.json()) as ApiPage;
}

async function fetchAll(base: string, maxPages: number): Promise<ApiConfig[]> {
    const first = await fetchPage(base, 1);
    const totalPages = Math.min(Math.max(first.totalPages || 1, 1), maxPages);
    const rows = [...first.configs];

    for (let page = 2; page <= totalPages; page++) {
        rows.push(...(await fetchPage(base, page)).configs);
    }

    const seen = new Set<string>();
    return rows.filter((row) => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
    });
}

function readFixture(path: string): ApiConfig[] {
    const parsed = JSON.parse(readFileSync(path, "utf-8")) as ApiConfig[] | {configs: ApiConfig[]};
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.configs)) return parsed.configs;
    throw new Error(`Fixture ${path} does not contain a configs array`);
}

async function resolveRows(options: Options): Promise<{rows: ApiConfig[]; source: string}> {
    if (options.fixture) {
        return {rows: readFixture(options.fixture), source: options.fixture};
    }

    const endpoints = options.endpoint ? [options.endpoint] : DEFAULT_ENDPOINTS;
    let lastError: Error | undefined;

    for (const endpoint of endpoints) {
        try {
            console.log(`Fetching ${endpoint}`);
            return {rows: await fetchAll(endpoint, options.maxPages), source: endpoint};
        }
 catch (err) {
            lastError = err as Error;
            console.warn(`  failed: ${lastError.message}`);
        }
    }

    throw lastError ?? new Error("No endpoints configured");
}

function toStyle(row: ApiConfig): Style | null {
    if (typeof row.rawConfig !== "string" || !row.rawConfig.trim()) return null;

    const {text, strippedKeys} = sanitizeRemoteConfig(row.rawConfig);
    if (!text.trim()) return null;

    const {colors, isDark: dark} = schemeFromRow(row);

    return {
        id: row.slug,
        title: row.title,
        description: row.description ?? "",
        author: row.authorName ?? undefined,
        sourceUrl: row.sourceUrl ?? undefined,
        rawConfig: text,
        colors,
        isDark: dark,
        tags: row.tags ?? [],
        source: "community",
        strippedKeys: strippedKeys.length > 0 ? strippedKeys : undefined,
        votes: row.voteCount ?? 0,
        updatedAt: row.updatedAt ?? undefined
    };
}

const STYLE_KEYS: Array<keyof Style> = [
    "id",
    "title",
    "description",
    "author",
    "sourceUrl",
    "rawConfig",
    "colors",
    "isDark",
    "tags",
    "source",
    "strippedKeys",
    "votes",
    "updatedAt"
];

function renderModule(styles: Style[]): string {
    const lines: string[] = [];
    lines.push("// This file is auto-generated by scripts/generate-styles.ts");
    lines.push("// Do not edit directly: changes will be overwritten by the next sync.");
    lines.push("// See .github/workflows/styles.yml for the generation schedule.");
    lines.push("");
    lines.push("import type {Style} from \"$lib/styles/types\";");
    lines.push("");
    lines.push("export const styles = [");

    for (const style of styles) {
        lines.push("    {");
        for (const key of STYLE_KEYS) {
            const value = style[key];
            if (value === undefined) continue;
            lines.push(`        ${key}: ${JSON.stringify(value)},`);
        }
        lines.push("    },");
    }

    lines.push("] satisfies readonly Style[];");
    lines.push("");
    lines.push("export default styles;");
    lines.push("");

    return lines.join("\n");
}

async function readPreviousStyles(): Promise<Style[]> {
    if (!existsSync(OUTPUT_PATH)) return [];

    try {
        const mod = (await import(`${OUTPUT_PATH}?t=${Date.now()}`)) as {styles?: Style[]};
        return mod.styles ?? [];
    }
 catch (err) {
        console.warn(
            `Could not read previous styles module for diffing (${(err as Error).message}); treating as empty`
        );
        return [];
    }
}

function writeSummary(previous: Style[], next: Style[]): void {
    const previousById = new Map(previous.map((style) => [style.id, style]));
    const nextById = new Map(next.map((style) => [style.id, style]));

    const added = next.filter((style) => !previousById.has(style.id));
    const removed = previous.filter((style) => !nextById.has(style.id));
    const changed = next.filter((style) => {
        const old = previousById.get(style.id);
        return old !== undefined && JSON.stringify(old) !== JSON.stringify(style);
    });

    const lines: string[] = [
        "## Ghostty styles sync",
        "",
        `- Added: ${added.length}`,
        `- Removed: ${removed.length}`,
        `- Changed: ${changed.length}`
    ];

    if (added.length > 0) {
        lines.push("", "### Added", ...added.map((style) => `- ${style.title} (\`${style.id}\`)`));
    }
    if (removed.length > 0) {
        lines.push(
            "",
            "### Removed",
            ...removed.map((style) => `- ${style.title} (\`${style.id}\`)`)
        );
    }
    if (changed.length > 0) {
        lines.push(
            "",
            "### Changed",
            ...changed.map((style) => `- ${style.title} (\`${style.id}\`)`)
        );
    }

    writeFileSync(SUMMARY_PATH, `${lines.join("\n")}\n`);
}

async function main(): Promise<void> {
    const options = parseArgs(process.argv.slice(2));

    let result: {rows: ApiConfig[]; source: string};
    try {
        result = await resolveRows(options);
    }
 catch (err) {
        const message = `Failed to fetch styles: ${(err as Error).message}`;
        if (options.allowStale) {
            console.warn(`${message}\nLeaving the existing styles.ts unchanged.`);
            return;
        }
        console.error(message);
        process.exit(1);
    }

    const {rows, source} = result;
    console.log(`Fetched ${rows.length} configs from ${source}`);

    const filtered = rows.filter((row) => {
        if (!options.includeSeed && row.isSeed) return false;
        if (options.featuredOnly && !row.isFeatured) return false;
        return true;
    });

    const styles = filtered
        .map(toStyle)
        .filter((style): style is Style => style !== null)
        .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0) || a.title.localeCompare(b.title));

    if (styles.length === 0 && !options.allowEmpty && existsSync(OUTPUT_PATH)) {
        console.warn(
            "No community styles returned; leaving the existing styles.ts unchanged. Pass --allow-empty to overwrite."
        );
        return;
    }

    const previous = await readPreviousStyles();
    writeSummary(previous, styles);

    mkdirSync(join(import.meta.dirname, "..", "src", "lib", "data"), {recursive: true});
    writeFileSync(OUTPUT_PATH, renderModule(styles));

    console.log(`Wrote ${styles.length} styles to ${OUTPUT_PATH}`);
}

await main();
