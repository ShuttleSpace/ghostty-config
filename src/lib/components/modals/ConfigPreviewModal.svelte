<script lang="ts">
    import DialogModal from "$lib/components/modals/DialogModal.svelte";
    import Button from "$lib/components/Button.svelte";
    import type {Snippet} from "svelte";
    import ConfigPreview from "../ConfigPreview.svelte";
    import {t} from "$lib/i18n";

    type ConfigValue = string | string[];

    interface Props {
        title: string;
        description: string;
        icon: Snippet;
        parsedConfig: Record<string, ConfigValue> | null;
        previewText: string | null;
        parseError: boolean;
        notes?: string[];
        importLabel?: string;
        onsync?: () => void | Promise<void>;
        onclose?: () => void | Promise<void>;
        onimport?: () => void | Promise<void>;
    }

    const {
        title,
        description,
        icon,
        parsedConfig,
        previewText,
        parseError,
        notes = [],
        importLabel = t("ui.modals.importConfig"),
        onsync,
        onclose,
        onimport
    }: Props = $props();
</script>

<DialogModal {title} {onclose} {icon}>
    <p class="modal-desc">{description}</p>
    {#if notes.length}
        <ul class="notes">
            {#each notes as note (note)}
                <li>{note}</li>
            {/each}
        </ul>
    {/if}
    <ConfigPreview
        parsed={parsedConfig}
        parsedDiff={parsedConfig}
        text={previewText}
        {parseError}
        showEmptyState={false}
        clampHeight
    />
    {#snippet footer()}
        <Button onclick={onclose}>{t("ui.modals.dismiss")}</Button>
        <Button primary={!onsync} onclick={onimport} disabled={!parsedConfig}>{importLabel}</Button>
        {#if onsync}
            <Button primary onclick={onsync}>{t("ui.modals.applyAndSync")}</Button>
        {/if}
    {/snippet}
</DialogModal>

<style>
    .modal-desc {
        color: var(--font-color-muted);
        font-size: 0.9rem;
        margin: 0;
        line-height: 1.5;
    }

    .notes {
        margin: 0;
        padding-left: 1.1rem;
        color: var(--font-color-muted);
        font-size: 0.8rem;
        line-height: 1.45;
    }

    .notes li + li {
        margin-top: 2px;
    }
</style>
