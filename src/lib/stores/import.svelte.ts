import {parse} from "$lib/utils/parse";
import config, {diffFromDefaults, load} from "$lib/stores/config.svelte";
import {decodeConfig, getSharePayloadFromHash, removeSharePayloadFromHash} from "$lib/utils/share";
import {error, success} from "$lib/stores/toasts.svelte";
import {alert as showAlert} from "$lib/stores/modals.svelte";
import {t} from "$lib/i18n";

export type ImportSource = "share" | "clipboard" | "file" | "style";

export interface PreviewState {
    source: ImportSource;
    text: string;
    parsed: Record<string, string | string[]> | null;
    parsedDiff: Record<string, string | string[]> | null;
    parseError: boolean;
    /** Keys present in the incoming text that this app's registry doesn't know (dropped on load). */
    unsupportedKeys: string[];
    /** Unsafe keys removed from a remote style before it reached the preview. */
    strippedKeys: string[];
}

export interface ImportMeta {
    strippedKeys?: string[];
}

const SOURCE_INFO_KEYS: Record<
    ImportSource,
    {title: string; description: string; noConfigMessage: string; successMessage: string}
> = {
    share: {
        title: "ui.import.shareTitle",
        description: "ui.import.shareDescription",
        noConfigMessage: "ui.import.shareNoConfig",
        successMessage: "ui.import.shareSuccess"
    },
    clipboard: {
        title: "ui.import.importTitle",
        description: "ui.import.importDescription",
        noConfigMessage: "ui.import.clipboardNoConfig",
        successMessage: "ui.import.importSuccess"
    },
    file: {
        title: "ui.import.importTitle",
        description: "ui.import.importDescription",
        noConfigMessage: "ui.import.fileNoConfig",
        successMessage: "ui.import.importSuccess"
    },
    style: {
        title: "ui.import.styleTitle",
        description: "ui.import.styleDescription",
        noConfigMessage: "ui.import.styleNoConfig",
        successMessage: "ui.import.styleSuccess"
    }
};

export const incomingImport = $state<{preview: PreviewState | null; show: boolean}>({
    preview: null,
    show: false
});

export function getSourceInfo(source: ImportSource) {
    const keys = SOURCE_INFO_KEYS[source];
    return {
        title: t(keys.title),
        description: t(keys.description),
        noConfigMessage: t(keys.noConfigMessage),
        successMessage: t(keys.successMessage)
    };
}

function clearHash() {
    if (typeof window === "undefined") return;
    const cleaned = removeSharePayloadFromHash(window.location.hash);
    window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}${cleaned}`
    );
}

function buildPreview(source: ImportSource, text: string, meta?: ImportMeta): PreviewState {
    const strippedKeys = meta?.strippedKeys ?? [];
    try {
        const parsed = parse(text);
        const parsedDiff = diffFromDefaults(parsed);
        const unsupportedKeys = Object.keys(parsed)
            .filter((key) => !(key in config))
            .sort();
        return {source, text, parsed, parsedDiff, parseError: false, unsupportedKeys, strippedKeys};
    }
    catch {
        return {
            source,
            text,
            parsed: null,
            parsedDiff: null,
            parseError: true,
            unsupportedKeys: [],
            strippedKeys
        };
    }
}

export function checkTextForImport(source: ImportSource, text: string, meta?: ImportMeta) {
    const preview = buildPreview(source, text, meta);
    const hasKeys = preview.parsedDiff && Object.keys(preview.parsedDiff).length > 0;

    if (!hasKeys && !preview.parseError) {
        void showAlert({
            title: t("ui.import.noConfigFound"),
            message: getSourceInfo(source).noConfigMessage,
            buttonText: t("ui.modals.dismiss")
        });
        if (source === "share") clearHash();
        return;
    }

    incomingImport.preview = preview;
    incomingImport.show = true;
}

export function checkHashForShare() {
    if (typeof window === "undefined") return;
    const payload = getSharePayloadFromHash(window.location.hash);
    if (!payload) return;

    try {
        checkTextForImport("share", decodeConfig(payload));
    }
    catch {
        error(t("ui.import.readSharedFailed"));
        clearHash();
    }
}

export async function applyIncomingImport() {
    if (!incomingImport.preview?.parsed) return;
    const {source, parsed} = incomingImport.preview;

    try {
        load(parsed);
        success(getSourceInfo(source).successMessage);
    }
 catch (err) {
        console.error(err); // eslint-disable-line no-console
        await showAlert({
            title: t("ui.import.loadFailedTitle"),
            message: t("ui.import.loadFailedMessage"),
            buttonText: t("ui.modals.dismiss")
        });
    }

    dismissIncomingImport();
}

export function dismissIncomingImport() {
    incomingImport.show = false;
    incomingImport.preview = null;
    clearHash();
}
