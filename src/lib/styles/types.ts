import type {ColorScheme} from "$lib/utils/colors";

export type StyleSource = "starter" | "community";

/**
 * A complete Ghostty config preset (not a named color theme). Themes only set colors and are
 * referenced by name via `theme = Name`; a style is a raw config fragment that can set any
 * option, so applying one goes through the import pipeline rather than the theme dropdown.
 */
export interface Style {
    id: string;
    title: string;
    description: string;
    author?: string;
    sourceUrl?: string;
    rawConfig: string;
    colors: ColorScheme;
    isDark: boolean;
    tags: string[];
    source: StyleSource;
    /** Config keys removed by the remote-style sanitizer (never re-applied). */
    strippedKeys?: string[];
    votes?: number;
    updatedAt?: string;
}
