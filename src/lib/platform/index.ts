// Platform detection: distinguishes the Tauri desktop runtime from the web build.
// The web build (SvelteKit static) is the default; the Tauri build injects `__TAURI__`
// (and `__TAURI_INTERNALS__`) onto `window` at runtime.
interface TauriWindow extends Window {
    __TAURI__?: unknown;
    __TAURI_INTERNALS__?: unknown;
}

const tauriWindow = globalThis as unknown as TauriWindow;
export const isTauri = typeof window !== "undefined"
    && (typeof tauriWindow.__TAURI__ !== "undefined" || typeof tauriWindow.__TAURI_INTERNALS__ !== "undefined");

export const platform = {
    isTauri,
    isWeb: !isTauri,
    isMac: navigator.platform.toLowerCase().includes("mac"),
    isWindows: navigator.platform.toLowerCase().includes("win"),
    isLinux: navigator.platform.toLowerCase().includes("linux")
};

export default platform;
