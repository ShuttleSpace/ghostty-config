<script lang="ts">
    import ImportIcon from "$lib/components/icons/ImportIcon.svelte";
    import ShareIcon from "$lib/components/icons/ShareIcon.svelte";
    import ConfigPreviewModal from "$lib/components/modals/ConfigPreviewModal.svelte";
    import {isTauri} from "$lib/platform";
    import {syncToGhostty} from "$lib/platform/ghostty";
    import {diff} from "$lib/stores/config.svelte";
    import {
        applyIncomingImport,
        dismissIncomingImport,
        getSourceInfo,
        incomingImport
    } from "$lib/stores/import.svelte";
    import {t} from "$lib/i18n";
    import {serialize} from "$lib/utils/parse";

    // The import preview is global: the share hash and the styles page can both stage an
    // import from anywhere, so the modal lives in the layout rather than one route.

    const preview = $derived(incomingImport.preview);
    const info = $derived(preview ? getSourceInfo(preview.source) : null);
    const canSync = $derived(Boolean(isTauri && preview?.source === "style"));

    const notes = $derived.by(() => {
        if (!preview) return [];
        const result: string[] = [];

        if (preview.strippedKeys.length > 0) {
            result.push(t("ui.import.strippedKeys", {keys: preview.strippedKeys.join(", ")}));
        }
        if (preview.unsupportedKeys.length > 0) {
            const shown = preview.unsupportedKeys.slice(0, 8).map(toKebabCase).join(", ");
            const extra = preview.unsupportedKeys.length - 8;
            const keys = `${shown}${extra > 0 ? t("ui.import.unsupportedKeysMore", {count: extra}) : ""}`;
            result.push(
                t("ui.import.unsupportedKeys", {count: preview.unsupportedKeys.length, keys})
            );
        }

        return result;
    });

    // parse() exposes registry-style camelCase ids; show the Ghostty config key instead.
    function toKebabCase(key: string): string {
        return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    }

    async function applyAndSync() {
        await applyIncomingImport();
        await syncToGhostty(serialize(diff()));
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key !== "Escape") return;
        if (incomingImport.show) dismissIncomingImport();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if incomingImport.show && preview && info}
    <ConfigPreviewModal
        title={info.title}
        description={info.description}
        parsedConfig={preview.parsedDiff}
        previewText={preview.text}
        parseError={preview.parseError}
        {notes}
        importLabel={preview.source === "style"
            ? t("ui.import.applyStyle")
            : t("ui.modals.importConfig")}
        onsync={canSync ? applyAndSync : undefined}
        onclose={dismissIncomingImport}
        onimport={applyIncomingImport}
    >
        {#snippet icon()}
            {#if preview.source === "share"}
                <ShareIcon />
            {:else}
                <ImportIcon />
            {/if}
        {/snippet}
    </ConfigPreviewModal>
{/if}
