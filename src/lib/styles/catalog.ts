import syncedStyles from "$lib/data/styles";
import {starterStyles} from "./starter";
import type {Style} from "./types";

/**
 * The complete style catalog: bundled starters first, then community styles synced from
 * ghostty.style. `syncedStyles` is generated — see scripts/generate-styles.ts.
 */
export const communityStyles: Style[] = [...syncedStyles];
export const styles: Style[] = [...starterStyles, ...communityStyles];

export function findStyle(id: string): Style | undefined {
    return styles.find((style) => style.id === id);
}
