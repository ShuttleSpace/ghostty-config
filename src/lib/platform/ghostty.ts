// Ghostty config sync: read/write the user's actual Ghostty config file.
// On Tauri this delegates to native IPC (fs + dialog plugins).
// On the web build it falls back to the in-browser download/upload path.

import {isTauri} from "$lib/platform";
import {error, success} from "$lib/stores/toasts.svelte";
import {alert as showAlert} from "$lib/stores/modals.svelte";
import {t} from "$lib/i18n";

export interface GhosttyConfigInfo {
    path: string;
    exists: boolean;
}

export async function getGhosttyConfigInfo(): Promise<GhosttyConfigInfo> {
    if (isTauri) {
        const {invoke} = await import("@tauri-apps/api/core");
        return invoke<GhosttyConfigInfo>("ghostty_config_info");
    }
    return {path: "", exists: false};
}

export async function readGhosttyConfig(): Promise<string> {
    if (isTauri) {
        const {invoke} = await import("@tauri-apps/api/core");
        return invoke<string>("read_ghostty_config");
    }
    return "";
}

export async function writeGhosttyConfig(content: string): Promise<string> {
    if (isTauri) {
        const {invoke} = await import("@tauri-apps/api/core");
        return invoke<string>("write_ghostty_config", {content});
    }
    throw new Error("Ghostty sync is only available in the desktop app");
}

// Resolve the user's Ghostty config path for display.
export async function ghosttyConfigPath(): Promise<string> {
    const info = await getGhosttyConfigInfo();
    return info.path;
}

// Sync the current config diff to the user's Ghostty config file.
// Returns the destination path on success.
export async function syncToGhostty(configText: string): Promise<string> {
    try {
        const path = await writeGhosttyConfig(configText);
        success(t("ui.platform.syncSuccess"));
        return path;
    }
 catch (err) {
        console.error(err); // eslint-disable-line no-console
        error(t("ui.platform.syncFailed"));
        throw err;
    }
}

// Read the user's existing Ghostty config and offer to import it.
export async function loadFromGhostty() {
    let existing = "";
    try {
        existing = await readGhosttyConfig();
    }
 catch {
        // ignore
    }
    if (!existing.trim()) {
        void showAlert({
            title: t("ui.platform.noExistingTitle"),
            message: t("ui.platform.noExistingMessage"),
            buttonText: t("ui.modals.dismiss")
        });
        return;
    }

    const {checkTextForImport} = await import("$lib/stores/import.svelte");
    void checkTextForImport("file", existing);
}

// Open a native save dialog (Tauri) or fall back to download (web).
export async function saveConfigFile(defaultName: string, content: string): Promise<boolean> {
    if (isTauri) {
        const {save} = await import("@tauri-apps/plugin-dialog");
        const path = await save({
            defaultPath: defaultName,
            filters: [
                {
                    name: "Ghostty Config",
                    extensions: ["config", "txt", "conf"]
                }
            ]
        });
        if (!path) return false;

        const {writeTextFile} = await import("@tauri-apps/plugin-fs");
        await writeTextFile(path, content);
        success(t("ui.platform.fileSaved"));
        return true;
    }

    // Web fallback
    const blob = new Blob([content], {type: "text/plain"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = defaultName;
    link.click();
    URL.revokeObjectURL(url);
    success(t("ui.platform.fileDownloaded"));
    return true;
}

// Open a native open dialog (Tauri) or fall back to the web file picker.
export async function openConfigFile(): Promise<string | null> {
    if (isTauri) {
        const {open} = await import("@tauri-apps/plugin-dialog");
        const path = await open({
            multiple: false,
            filters: [
                {
                    name: "Ghostty Config",
                    extensions: ["config", "txt", "conf"]
                }
            ]
        });
        if (!path) return null;

        const {readTextFile} = await import("@tauri-apps/plugin-fs");
        return readTextFile(path);
    }

    return null; // Web build uses its own file input
}

// System-installed font families (via `ghostty +list-fonts`). Desktop only.
export async function listFonts(): Promise<string[]> {
    if (!isTauri) return [];
    const {invoke} = await import("@tauri-apps/api/core");
    return invoke<string[]>("list_fonts");
}

// The process environment variables. Desktop only; web has no equivalent.
export async function getEnv(): Promise<Record<string, string>> {
    if (!isTauri) return {};
    const {invoke} = await import("@tauri-apps/api/core");
    return invoke<Record<string, string>>("get_env");
}

// Read the user's local Ghostty config and merge it straight into the live store
// (no preview modal) — the "opens with your existing config" startup behavior.
// Swallows read failures: this runs unprompted on startup, so a missing or
// unreadable config must leave the defaults intact rather than surface an error.
export async function loadLocalConfig(): Promise<boolean> {
    if (!isTauri) return false;

    let text: string;
    try {
        text = await readGhosttyConfig();
    }
 catch {
        return false;
    }
    if (!text.trim()) return false;

    const [{parse}, {load}] = await Promise.all([
        import("$lib/utils/parse"),
        import("$lib/stores/config.svelte")
    ]);
    load(parse(text));
    return true;
}

export default {
    isTauri,
    getGhosttyConfigInfo,
    readGhosttyConfig,
    writeGhosttyConfig,
    ghosttyConfigPath,
    syncToGhostty,
    loadFromGhostty,
    saveConfigFile,
    openConfigFile,
    listFonts,
    getEnv,
    loadLocalConfig
};
