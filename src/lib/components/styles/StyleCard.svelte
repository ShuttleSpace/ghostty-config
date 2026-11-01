<script lang="ts">
    import Button from "$lib/components/Button.svelte";
    import {t} from "$lib/i18n";
    import {saveConfigFile} from "$lib/platform/ghostty";
    import type {Style} from "$lib/styles/types";
    import StylePreview from "./StylePreview.svelte";

    interface Props {
        preset: Style;
        onapply: () => void;
    }

    const {preset, onapply}: Props = $props();

    async function download() {
        await saveConfigFile(`${preset.id}.conf`, preset.rawConfig);
    }
</script>

<article class="style-card">
    <StylePreview colors={preset.colors} />
    <div class="body">
        <div class="title-row">
            <h3>{preset.title}</h3>
            <span class="source" class:community={preset.source === "community"}>
                {preset.source === "community"
                    ? t("ui.styles.communityBadge")
                    : t("ui.styles.starterBadge")}
            </span>
        </div>
        <p>{preset.description}</p>
        <div class="meta">
            {#if preset.author}<span>{preset.author}</span>{/if}
            {#if preset.tags.length}<span>{preset.tags.slice(0, 3).join(" · ")}</span>{/if}
        </div>
        <div class="actions">
            <Button primary onclick={onapply}>{t("ui.styles.apply")}</Button>
            <Button onclick={download}>{t("ui.styles.download")}</Button>
            {#if preset.sourceUrl}
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
                <a class="source-link" href={preset.sourceUrl} target="_blank" rel="noopener noreferrer">{t("ui.styles.source")}</a>
            {/if}
        </div>
    </div>
</article>

<style>
    .style-card {
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: var(--bg-level-2);
        border: 1px solid var(--border-level-2);
        border-radius: var(--radius-level-3);
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        padding: 10px;
        min-width: 0;
    }

    .body {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
    }

    .title-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    h3 {
        font-size: 0.95rem;
        font-weight: 600;
        margin: 0;
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .source {
        font-size: 0.68rem;
        color: var(--font-color-muted);
        border: 1px solid var(--border-level-2);
        border-radius: var(--radius-level-5);
        padding: 0 5px;
        white-space: nowrap;
    }

    .source.community {
        color: var(--font-color-accent);
        border-color: color-mix(in srgb, var(--font-color-accent) 40%, transparent);
    }

    p {
        margin: 0;
        font-size: 0.8rem;
        line-height: 1.4;
        color: var(--font-color-muted);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .meta {
        display: flex;
        gap: 8px;
        font-size: 0.7rem;
        color: var(--font-color-muted);
        min-height: 1em;
    }

    .meta span + span::before {
        content: "·";
        margin-right: 8px;
    }

    .actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: auto;
        padding-top: 4px;
    }

    .source-link {
        margin-left: auto;
        font-size: 0.75rem;
        color: var(--font-color-muted);
    }

    .source-link:hover {
        color: var(--font-color-accent);
    }
</style>
