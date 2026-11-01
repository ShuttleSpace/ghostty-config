<script lang="ts">
    import GhosttyIcon from "$lib/components/GhosttyIcon.svelte";
    import config from "$lib/stores/config.svelte";
    import {t} from "$lib/i18n";

    const iconLabel = $derived(
        config.macosIcon === "custom-style"
            ? t("ui.appIcon.customStyle")
            : config.macosIcon === "custom"
              ? t("ui.appIcon.customFile")
              : config.macosIcon
    );
    const isCustomStyle = $derived(config.macosIcon === "custom-style");
    const hasCustomColors = $derived(
        Boolean(config.macosIconGhostColor && config.macosIconScreenColor)
    );
</script>

<div class="app-icon-preview">
    <GhosttyIcon />

    <div class="label">{iconLabel}</div>
    {#if isCustomStyle && !hasCustomColors}
        <div class="note">
            {t("ui.appIcon.hint")}
        </div>
    {/if}
</div>

<style>
    .app-icon-preview {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        border-radius: var(--radius-level-3);
        background: var(--bg-level-3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 0 1px rgba(255, 255, 255, 0.25) inset;
        width: 100%;
    }

    .label {
        font-size: 0.875rem;
        font-weight: 600;
        text-transform: capitalize;
        color: var(--font-color);
    }

    .note {
        text-align: center;
        font-size: 0.75rem;
        max-width: 15rem;
        color: var(--font-color-muted);
    }
</style>
