<script lang="ts">
    import Group from "$lib/components/settings/Group.svelte";
    import Item from "$lib/components/settings/Item.svelte";
    import Separator from "$lib/components/settings/Separator.svelte";
    import Switch from "$lib/components/settings/Switch.svelte";
    import Text from "$lib/components/settings/Text.svelte";
    import Range from "$lib/components/settings/Range.svelte";
    import {systemFonts} from "$lib/platform/system.svelte";
    import {isTauri} from "$lib/platform";
    import {t} from "$lib/i18n";

    let fontFamily = $state("JetBrainsMono Nerd Font");
    // Range/Switch bind flat-store strings; keep this local preview state in the same shape.
    let fontSize = $state("13");
    let bold = $state("false");
    let italic = $state("false");

    /* eslint-disable svelte/prefer-style-directive */
    // TODO: fix above with preview component
</script>

<Group title="" note={t("ui.fontPlayground.note")}>
    <div
        class="preview"
        style="font-family: {fontFamily}; font-size: {fontSize}px; font-style: {italic === "true"
            ? "italic"
            : "normal"}; font-weight: {bold === "true" ? 700 : 400};"
    >
        <div class="row prompt">
            <span style="color: var(--config-palette-2);">john</span>
            <span style="color: var(--config-palette-6);">@</span>
            <span style="color: var(--config-palette-4);">doe-pc</span>
            <span style="color: var(--config-palette-1); font-weight: 700;">$</span>
            ls -la
        </div>
        <div class="row">
            -rwxr-xr-x 1 root <span style="color: var(--config-palette-3); font-weight: 700;"
                >Documents</span
            >
        </div>
        <div class="row">
            -rwxr-xr-x 1 root <span style="color: var(--config-palette-0); background: var(--config-palette-2); font-weight: 700;"
                >Downloads</span
            >
        </div>
        <div class="row">
            -rwxr-xr-x 1 root <span style="color: var(--config-palette-0); background: var(--config-palette-8); font-weight: 700;"
                >Pictures</span
            >
        </div>
        <div class="row">
            -rwxr-xr-x 1 root <span style="color: var(--config-palette-12); font-weight: 700;"
                >Music</span
            >
        </div>
        <div class="row">
            -rwxr-xr-x 1 root <span style="color: var(--config-palette-2);">実行可能ファイル</span>
        </div>
        <div class="row">
            -rwxr-xr-x 1 root <span style="color: var(--config-palette-6);">sym</span> ->
            <span style="color: var(--config-palette-1);">link</span>
        </div>
        <div class="row">&nbsp;</div>
        <div class="row">
            Icons:    <span style="background-color: var(--config-palette-1); color: var(--config-bg);"
                > Powerline</span
            ><span style="color: var(--config-palette-1);"></span>
        </div>
    </div>
    <Separator />
    <Item
        name={t("ui.fontPlayground.fontFamily")}
        note={isTauri
            ? t("ui.fontPlayground.fontFamilyNoteNative")
            : t("ui.fontPlayground.fontFamilyNoteWeb")}
        ><Text bind:value={fontFamily} list="system-fonts" /></Item
    >
    <Separator />
    <Item name={t("ui.fontPlayground.fontSize")}
        ><Range bind:value={fontSize} min={4} max={60} step={0.5} /></Item
    >
    <Separator />
    <Item name={t("ui.fontPlayground.bold")}><Switch bind:value={bold} /></Item>
    <Separator />
    <Item name={t("ui.fontPlayground.italic")}><Switch bind:value={italic} /></Item>
    <!-- Add ligature options -->
</Group>

<datalist id="system-fonts">
    {#each systemFonts as font (font)}<option value={font}></option>{/each}
</datalist>

<style>
    .preview {
        background: var(--config-bg);
        color: var(--config-fg);
        height: 180px;
        overflow-y: auto;
        padding: 8px;
        border-radius: var(--radius-level-3);
        border: 1px solid rgba(0, 0, 0, 0.5);
        box-shadow: 0 0 1px rgba(255, 255, 255, 0.5) inset;
    }

    .preview .row,
    .prompt {
        display: flex;
        white-space: pre;
        /* width: 100%; */
        /* overflow: hidden; */
    }
</style>
