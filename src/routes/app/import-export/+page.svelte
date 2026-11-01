<script lang="ts">
    import Group from "$lib/components/settings/Group.svelte";
    import Item from "$lib/components/settings/Item.svelte";
    import Separator from "$lib/components/settings/Separator.svelte";
    import {diff} from "$lib/stores/config.svelte";
    // import {alert as showAlert} from "$lib/stores/modals.svelte";
    import {serialize} from "$lib/utils/parse";
    import {buildShareUrl, encodeConfig, MAX_SHARE_URL_LENGTH} from "$lib/utils/share";
    import Page from "$lib/views/Page.svelte";
    import Button from "$lib/components/Button.svelte";
    import ShareComposerModal from "$lib/components/modals/ShareComposerModal.svelte";
    import {onMount} from "svelte";
    import {error, success} from "$lib/stores/toasts.svelte";
    import {debounce, withPendingGuard} from "$lib/utils/debounce";
    import {checkHashForShare, checkTextForImport} from "$lib/stores/import.svelte";
    import ConfigPreview from "$lib/components/ConfigPreview.svelte";
    import * as ghostty from "$lib/platform/ghostty";
    import {isTauri} from "$lib/platform";
    import {readClipboard, writeClipboard} from "$lib/platform/clipboard";
    import {t} from "$lib/i18n";

    // Handling for share urls
    onMount(() => {
        checkHashForShare();
        const handler = () => checkHashForShare();
        window.addEventListener("hashchange", handler);
        return () => window.removeEventListener("hashchange", handler);
    });

    // Local states
    const currentConfigDiff = $derived(diff());
    const hasExportableConfig = $derived(Object.keys(currentConfigDiff).length > 0);

    // Button handlers
    async function pasteConfig() {
        try {
            const text = await readClipboard();
            checkTextForImport("clipboard", text);
        }
 catch {
            error(t("ui.importExport.clipboardPasteError"));
        }
    }

    let filePicker: HTMLInputElement | null = $state(null);
    async function selectFile() {
        // Tauri: native open dialog. Web: file input.
        if (isTauri) {
            const text = await ghostty.openConfigFile();
            if (text !== null) checkTextForImport("file", text);
            return;
        }
        const file = filePicker?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.addEventListener("load", (event) => {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            const loadedText = event.target?.result?.toString();
            if (!loadedText) return;
            checkTextForImport("file", loadedText);
        });
        reader.readAsText(file);
    }

    const copyConfig = withPendingGuard(async () => {
        if (!hasExportableConfig) return;

        try {
            await writeClipboard(serialize(currentConfigDiff));
            success(t("ui.importExport.copied"));
        }
 catch {
            error(t("ui.importExport.clipboardCopyError"));
        }
    });

    // Download uses a native save dialog on Tauri, a blob download on the web.
    const downloadConfig = debounce(function () {
        if (!hasExportableConfig) return;
        const text = serialize(currentConfigDiff);
        void ghostty.saveConfigFile("ghostty-config", text);
    }, 300);

    // Ghostty has no plugin system. The snippet below is a ready-to-paste keybind
    // that launches this app from Ghostty — copy it into your Ghostty config.
    const platformSnippet = $derived(
        navigator.platform.toLowerCase().includes("mac")
            ? t("ui.importExport.launchMacSnippet")
            : navigator.platform.toLowerCase().includes("win")
                ? t("ui.importExport.launchWindowsSnippet")
                : t("ui.importExport.launchLinuxSnippet")
    );

    const copySnippet = withPendingGuard(async () => {
        try {
            await writeClipboard(platformSnippet);
            success(t("ui.importExport.snippetCopied"));
        }
        catch {
            error(t("ui.importExport.clipboardCopyError"));
        }
    });

    // Share Composer Modal Logic
    let showShareComposer = $state(false);
    let shareUrl = $state<string | null>(null);
    let shareConfigText = $state("");
    let isShareTooLong = $state(false);
    function openShareComposer() {
        if (!hasExportableConfig) return;

        const config = serialize(currentConfigDiff, false);
        const encoded = encodeConfig(config);
        const nextShareUrl = buildShareUrl(
            window.location.origin,
            window.location.pathname,
            encoded
        );

        isShareTooLong = nextShareUrl.length > MAX_SHARE_URL_LENGTH;
        shareUrl = isShareTooLong ? null : nextShareUrl;
        shareConfigText = config;
        showShareComposer = true;
    }

    function closeShareComposer() {
        showShareComposer = false;
        shareUrl = null;
        shareConfigText = "";
        isShareTooLong = false;
    }

    // Ghostty sync (Tauri only): write the config diff to the user's Ghostty config file.
    const syncToGhostty = withPendingGuard(async () => {
        if (!isTauri || !hasExportableConfig) return;
        const text = serialize(currentConfigDiff);
        try {
            const path = await ghostty.syncToGhostty(text);
            ghosttyPath = path;
        }
 catch {
            // error already surfaced by syncToGhostty
        }
    });

    // Load the user's existing Ghostty config (Tauri only).
    const loadFromGhostty = withPendingGuard(async () => {
        if (!isTauri) return;
        await ghostty.loadFromGhostty();
    });

    // Detect whether a Ghostty config already exists for the "sync" badge.
    let ghosttyPath = $state<string | null>(null);
    let ghosttyExists = $state(false);
    async function refreshGhosttyInfo() {
        if (!isTauri) return;
        const info = await ghostty.getGhosttyConfigInfo();
        ghosttyPath = info.path;
        ghosttyExists = info.exists;
    }
    onMount(() => void refreshGhosttyInfo());

    function handleWindowKeydown(e: KeyboardEvent) {
        if (e.key !== "Escape") return;
        if (showShareComposer) closeShareComposer();
    }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<Page title={t("ui.importExport.title")}>
    <ConfigPreview parsed={currentConfigDiff} parsedDiff={currentConfigDiff} />

    {#if isTauri}
        <Group
            title={t("ui.importExport.ghosttyGroup")}
            note={ghosttyPath
                ? t("ui.importExport.configLocation", {path: ghosttyPath})
                : t("ui.importExport.syncNote")}
        >
            <Item name={t("ui.importExport.syncToGhostty")} note={t("ui.importExport.writeNote")}>
                <div class="button-group">
                    <Button
                        primary
                        onclick={() => void syncToGhostty()}
                        title={hasExportableConfig
                            ? t("ui.importExport.syncNow")
                            : t("ui.importExport.noChanges")}
                        disabled={!hasExportableConfig}>{t("ui.importExport.sync")}</Button
                    >
                    <Button onclick={loadFromGhostty} title={t("ui.importExport.loadExistingTitle")}
                        >{t("ui.importExport.loadExisting")}</Button
                    >
                    {#if ghosttyExists}
                        <span class="status-dot synced" title={t("ui.importExport.existsTitle")}
                            >{t("ui.importExport.synced")}</span
                        >
                    {:else}
                        <span class="status-dot" title={t("ui.importExport.notExistsTitle")}
                            >{t("ui.importExport.notSaved")}</span
                        >
                    {/if}
                </div>
            </Item>
        </Group>
    {/if}

    <Group title={t("ui.importExport.launchGroup")} note={t("ui.importExport.launchNote")}>
        <Item name={t("ui.importExport.launchSnippet")} note={t("ui.importExport.launchSnippetNote")}>
            <div class="snippet">
                <pre>{platformSnippet}</pre>
                <Button onclick={copySnippet} title={t("ui.importExport.copySnippet")}>{t("ui.importExport.copySnippet")}</Button>
            </div>
        </Item>
    </Group>

    <Group title={t("ui.importExport.importGroup")}>
        <Item name={t("ui.importExport.fromClipboard")} note={t("ui.importExport.pasteNote")}>
            <div class="button-group">
                <Button onclick={pasteConfig} title={t("ui.importExport.pasteTitle")}
                    >{t("ui.importExport.import")}</Button
                >
            </div>
        </Item>
        <Separator />
        <Item
            name={t("ui.importExport.fromFile")}
            note={isTauri ? t("ui.importExport.pickFile") : t("ui.importExport.uploadFile")}
        >
            <div class="button-group">
                {#if !isTauri}
                    <input
                        id="config-input"
                        type="file"
                        onchange={selectFile}
                        bind:this={filePicker}
                    />
                {/if}
                <Button
                    onclick={() => (isTauri ? void selectFile() : filePicker?.click())}
                    title={isTauri ? t("ui.importExport.chooseFile") : t("ui.importExport.upload")}
                    >{t("ui.importExport.chooseFile")}</Button
                >
            </div>
        </Item>
    </Group>
    <Group title={t("ui.importExport.exportGroup")}>
        <Item name={t("ui.importExport.copyToClipboard")} note={t("ui.importExport.copyNote")}>
            <div class="button-group">
                <Button
                    onclick={copyConfig}
                    title={hasExportableConfig
                        ? t("ui.importExport.copy")
                        : t("ui.importExport.noChanges")}
                    disabled={!hasExportableConfig}>{t("ui.importExport.copy")}</Button
                >
            </div>
        </Item>
        <Separator />
        <Item
            name={isTauri ? t("ui.importExport.saveFile") : t("ui.importExport.downloadFile")}
            note={isTauri ? t("ui.importExport.saveNote") : t("ui.importExport.downloadNote")}
        >
            <div class="button-group">
                <Button
                    onclick={downloadConfig}
                    title={hasExportableConfig
                        ? isTauri
                            ? t("ui.importExport.save")
                            : t("ui.importExport.download")
                        : t("ui.importExport.noChanges")}
                    disabled={!hasExportableConfig}
                    >{isTauri ? t("ui.importExport.save") : t("ui.importExport.download")}</Button
                >
            </div>
        </Item>
        <Separator />
        <Item name={t("ui.importExport.shareLink")} note={t("ui.importExport.shareNote")}>
            <div class="button-group">
                <Button
                    primary
                    onclick={openShareComposer}
                    title={hasExportableConfig
                        ? t("ui.importExport.shareYourConfig")
                        : t("ui.importExport.noChanges")}
                    disabled={!hasExportableConfig}>{t("ui.importExport.share")}</Button
                >
            </div>
        </Item>
    </Group>
</Page>

{#if showShareComposer}
    <ShareComposerModal
        isTooLong={isShareTooLong}
        {shareUrl}
        configText={shareConfigText}
        onclose={closeShareComposer}
        ondownload={downloadConfig}
    />
{/if}

<style>
    #config-input {
        display: none;
    }

    .button-group {
        display: flex;
        gap: 12px;
        align-items: center;
    }

    .status-dot {
        font-size: 0.8rem;
        color: var(--font-color-muted);
    }

    .status-dot.synced {
        color: var(--color-success);
    }

    .snippet {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
    }

    .snippet pre {
        margin: 0;
        padding: 8px 12px;
        font-size: 0.82rem;
        font-family: var(--font-mono, monospace);
        background: var(--bg-level-2);
        border: 1px solid var(--border-level-2);
        border-radius: var(--radius-level-4);
        color: var(--font-color);
        white-space: pre-wrap;
        word-break: break-all;
    }
</style>
