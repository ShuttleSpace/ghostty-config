import {defineConfig} from "@x18n/core";

// Locale resources are split by namespace: `ui` is hand-written, `settings` is
// generated from registry.ts + navigation.ts by `bun run i18n:sync`.
export default defineConfig({
    sourceLocale: "en",
    locales: ["en", "zh-CN"],
    resources: [{pattern: "src/lib/i18n/locales/{locale}/{namespace}.json"}],
    // The runtime is a small rune-based `t()` (src/lib/i18n/index.svelte.ts), not one
    // of the libraries x18n detects, so no preset applies.
    presets: [],
    usage: {
        include: ["src/**/*.{ts,svelte}"],
        exclude: ["**/*.test.ts"],
        calls: [{callee: "t", key: 0}],
        // Settings and keybind action keys are addressed dynamically from registry data.
        keysInUse: ["settings.*", "ui.keybinds.actions.*"]
    },
    checks: {
        // Those dynamic keys cannot be traced to literal call sites.
        "unused-key": "off",
        "dynamic-key": "off",
        "hard-string": "off"
    },
    glossary: [
        {term: "Ghostty", doNotTranslate: true},
        {term: "GTK", doNotTranslate: true},
        {term: "macOS", doNotTranslate: true},
        {term: "Linux", doNotTranslate: true},
        {term: "GitHub", doNotTranslate: true}
    ],
    write: {
        indent: 4
    }
});
