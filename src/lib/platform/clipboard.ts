// Clipboard bridge. The Tauri webview can't be relied on for
// `navigator.clipboard` reads (WebKit rejects them without a fresh user
// gesture, and writes silently no-op in some builds), so the desktop build
// routes through the native clipboard plugin instead.
import {isTauri} from "./index";

export async function writeClipboard(text: string): Promise<void> {
    if (isTauri) {
        const {writeText} = await import("@tauri-apps/plugin-clipboard-manager");
        await writeText(text);
        return;
    }
    await window.navigator.clipboard.writeText(text);
}

export async function readClipboard(): Promise<string> {
    if (isTauri) {
        const {readText} = await import("@tauri-apps/plugin-clipboard-manager");
        return (await readText()) ?? "";
    }
    return window.navigator.clipboard.readText();
}
