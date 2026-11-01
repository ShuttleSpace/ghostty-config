import enSettings from "./locales/en/settings.json";
import enUi from "./locales/en/ui.json";
import zhCNSettings from "./locales/zh-CN/settings.json";
import zhCNUi from "./locales/zh-CN/ui.json";

export interface LocaleOption {
    code: string;
    label: string;
}

export const localeOptions: LocaleOption[] = [
    {code: "en", label: "English"},
    {code: "zh-CN", label: "简体中文"}
];

type Catalog = Record<string, unknown>;
type Params = Record<string, string | number>;

const DEFAULT_LOCALE = "en";
const STORAGE_KEY = "ghostty-config.locale";

const catalogs: Record<string, Catalog> = {
    "en": {settings: enSettings, ui: enUi},
    "zh-CN": {settings: zhCNSettings, ui: zhCNUi}
};

function isLocale(code: string | null | undefined): code is string {
    return Boolean(code) && code !== null && code !== undefined && Object.hasOwn(catalogs, code);
}

function detectLocale(): string {
    if (typeof window === "undefined") return DEFAULT_LOCALE;

    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (isLocale(stored)) return stored;
    }
 catch {
        // Storage can be unavailable (private mode, embedded webviews); fall through.
    }

    const language = window.navigator.language?.toLowerCase() ?? "";
    if (language.startsWith("zh")) return "zh-CN";
    return DEFAULT_LOCALE;
}

// Reading `locale` inside `t()` is what makes every translated string reactive to
// a language switch; keep the lookup inside the function rather than caching it.
export const i18n = $state({locale: detectLocale()});

export function setLocale(code: string): void {
    if (!isLocale(code)) return;

    i18n.locale = code;

    if (typeof document !== "undefined") document.documentElement.lang = code;

    if (typeof window !== "undefined") {
        try {
            window.localStorage.setItem(STORAGE_KEY, code);
        }
 catch {
            // Persisting is best-effort; the switch still applies for this session.
        }
    }
}

function resolve(catalog: Catalog | undefined, path: string): string | undefined {
    if (!catalog) return undefined;

    let current: unknown = catalog;
    for (const part of path.split(".")) {
        if (typeof current !== "object" || current === null) return undefined;
        current = (current as Record<string, unknown>)[part];
    }
    return typeof current === "string" ? current : undefined;
}

function interpolate(message: string, params?: Params): string {
    if (!params) return message;
    return message.replace(/\{(\w+)\}/g, (match, name: string) => {
        const value = params[name];
        return value === undefined ? match : String(value);
    });
}

export function t(key: string, params?: Params, fallback?: string): string {
    const message = resolve(catalogs[i18n.locale], key) ?? resolve(catalogs[DEFAULT_LOCALE], key);
    if (message === undefined) return fallback ?? key;
    return interpolate(message, params);
}

export function tSetting(
    id: string,
    field: "name" | "description" | "note",
    fallback = ""
): string {
    return t(`settings.setting.${id}.${field}`, undefined, fallback);
}

// Widget metadata (pill/feature/preset labels) lives in registry.ts as stable
// English strings; translate by exact label so shared labels stay consistent.
export function tWidgetLabel(label: string): string {
    return t(`ui.widgetLabels.${label}`, undefined, label);
}

export function panelName(id: string, fallback = ""): string {
    return t(`settings.nav.${id}`, undefined, fallback);
}

export function groupName(panelId: string, groupId: string, fallback = ""): string {
    return t(`settings.group.${panelId}.${groupId}`, undefined, fallback);
}

export function groupNote(panelId: string, groupId: string, fallback = ""): string {
    return t(`settings.groupNote.${panelId}.${groupId}`, undefined, fallback);
}

// Apply the detected locale to <html lang> once the document exists.
export function initLocale(): void {
    setLocale(i18n.locale);
}
