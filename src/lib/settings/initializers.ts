import {registry} from "./registry";
import {loadSystemData} from "$lib/platform/system.svelte";

type Registry = typeof registry;

type AsyncInitializer = (registry: Registry) => Promise<void>;

const asyncInitializers: AsyncInitializer[] = [
    // Desktop: shell out to `ghostty +list-fonts` and read the process environment.
    // Web: `loadSystemData` no-ops, so both stay empty.
    async (_: Registry) => {
        await loadSystemData();
    }
];

export async function runAsyncInitializers() {
    await Promise.allSettled(asyncInitializers.map((fn) => fn(registry)));
}

// TODO: this belongs elsewhere surely
const getOS = () => {
    if (typeof navigator === "undefined") return "other";
    const platform = navigator.userAgent?.toLowerCase();
    if (platform.includes("linux")) return "linux";
    if (platform.includes("mac")) return "macos";
    return "other";
};

type Initializer = (registry: Registry) => void;

const syncInitializers: Initializer[] = [
    (_: Registry) => {
        // Leaving this here as an example for the future
        // Apparently Ghostty now sets this to "true" for both mac and linux
        // reg.copyOnSelect.default = getOS() === "linux" ? "true" : "false";
    },

    (reg: Registry) => (reg.quitAfterLastWindowClosed.default = String(getOS() !== "macos"))
];

export function runSyncInitializers() {
    syncInitializers.map((fn) => fn(registry));
}

export async function runInitializers() {
    runSyncInitializers();
    if (typeof window !== "undefined") await runAsyncInitializers();
}
