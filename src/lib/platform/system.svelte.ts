// Runtime-populated platform data: system fonts and the process environment.
// Only meaningful in the Tauri desktop build — the web build has no access to
// either, so both stay empty there (calls are no-ops under `loadSystemData`).
import {isTauri} from "./index";
import {listFonts, getEnv} from "./ghostty";

export const systemFonts = $state<string[]>([]);
export const systemEnv = $state<Record<string, string>>({});

let loaded = false;

// Loads both datasets once. Failures are swallowed — a missing `ghostty` binary
// or a rejected env read simply leaves the lists empty rather than erroring UI.
export async function loadSystemData() {
    if (!isTauri || loaded) return;
    loaded = true;

    try {
        const fonts = await listFonts();
        systemFonts.length = 0;
        systemFonts.push(...fonts);
    }
 catch {
        // ignore — empty list means "no suggestions"
    }

    try {
        // `Object.assign` (not reassignment) — module-level `$state` is declared
        // `const`, so mutate in place rather than rebinding the binding.
        Object.assign(systemEnv, await getEnv());
    }
 catch {
        // ignore
    }
}
