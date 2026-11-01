<script lang="ts">
    import CommandPaletteEditor from "./CommandPaletteEditor.svelte";
    import Admonition from "../Admonition.svelte";
    import {fly} from "svelte/transition";
    import {success} from "$lib/stores/toasts.svelte";
    import {t} from "$lib/i18n";
    import {
        parseCommandPaletteEntry,
        serializeCommandPaletteEntry,
        type CommandPaletteEntry
    } from "$lib/utils/commandPalette";

    let {value = $bindable([])}: {value: string[]} = $props();

    let selected: number | null = $state(null);
    let showEditor = $state(false);
    let editorMode = $state<"add" | "edit">("add");
    let editorValue = $state<CommandPaletteEntry>({title: "", action: ""});

    const entries = $derived(
        value.map((raw) => ({raw, parsed: parseCommandPaletteEntry(raw)}))
    );

    function select(index: number) {
        selected = selected === index ? null : index;
    }

    function addNew() {
        editorMode = "add";
        editorValue = {title: "", action: "", description: undefined};
        showEditor = true;
    }

    function editSelected() {
        if (selected === null) return;
        const parsed = entries[selected]?.parsed;
        if (!parsed) return;
        editorMode = "edit";
        editorValue = parsed;
        showEditor = true;
    }

    function remove() {
        if (selected === null) return;
        value = value.filter((_, i) => i !== selected);
        selected = null;
        success(t("ui.commandPalette.removed"));
    }

    function handleSave(entry: CommandPaletteEntry) {
        const serialized = serializeCommandPaletteEntry(entry);
        if (editorMode === "add") {
            value = [...value, serialized];
            success(t("ui.commandPalette.added"));
        }
 else if (selected !== null) {
            const next = [...value];
            next[selected] = serialized;
            value = next;
            success(t("ui.commandPalette.updated"));
        }
        showEditor = false;
    }

    function resetDefaults() {
        value = [];
        selected = null;
        success(t("ui.commandPalette.reset"));
    }
</script>

{#if showEditor}
    <CommandPaletteEditor
        value={editorValue}
        onsave={handleSave}
        oncancel={() => (showEditor = false)}
    />
{:else}
    <Admonition>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html t("ui.commandPalette.intro", {
            link: `<a href="https://ghostty.org/docs/config/reference#command-palette-entry">${t("ui.commandPalette.documentation")}</a>`
        })}
    </Admonition>
    <div class="expandable-list" in:fly={{y: 30, duration: 200}}>
        <div class="item-list">
            {#each entries as item, i (i)}
                <div
                    class="palette-entry"
                    class:selected={selected === i}
                    onclick={() => select(i)}
                    onkeypress={() => select(i)}
                    role="option"
                    tabindex="0"
                    aria-selected={selected === i}
                >
                    {#if item.parsed}
                        <span class="entry-title">{item.parsed.title}</span>
                        <span class="entry-action">{item.parsed.action}</span>
                        {#if item.parsed.description}
                            <span class="entry-description">{item.parsed.description}</span>
                        {/if}
                    {:else}
                        <span class="entry-raw">{item.raw}</span>
                    {/if}
                </div>
            {/each}
        </div>
        <div class="list-controls">
            <button onclick={addNew} type="button" title={t("ui.commandPalette.add")}>&plus;</button>
            <button
                onclick={remove}
                disabled={selected === null}
                type="button"
                title={t("ui.commandPalette.remove")}
            >
                &ndash;
            </button>
            <button
                onclick={editSelected}
                disabled={selected === null || !entries[selected]?.parsed}
                type="button"
                title={t("ui.commandPalette.edit")}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16px"
                    height="16px"
                    viewBox="0 0 56 56"
                    ><path
                        fill="currentColor"
                        d="m43.293 16.926l2.367-2.32c1.196-1.196 1.242-2.485.188-3.563l-.797-.797c-1.055-1.055-2.344-.937-3.54.211l-2.367 2.344ZM15.66 44.488l25.57-25.547l-4.101-4.125l-25.594 25.57L9.31 45.59c-.211.562.375 1.219.937.984Z"
                    /></svg
                >
            </button>
            <div class="list-controls-spacer"></div>
            <button
                onclick={resetDefaults}
                type="button"
                title={t("ui.commandPalette.resetDefaults")}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16px"
                    height="16px"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><path d="M21 5H3" /><path d="M7 12H3" /><path d="M7 19H3" /><path d="M12 18a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5c-1.33 0-2.54.54-3.41 1.41L11 14"
                    /><path d="M11 10v4h4" /></svg
                >
            </button>
        </div>
    </div>
{/if}

<style>
    .expandable-list {
        display: flex;
        flex-direction: column;
        position: relative;
        background: var(--bg-level-2);
        border-radius: var(--radius-level-3);
        border: 1px solid var(--border-level-2);
        overflow: hidden;
    }

    .item-list {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }

    .palette-entry {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        cursor: pointer;
    }

    .palette-entry:nth-of-type(even) {
        background: rgba(255, 255, 255, 0.05);
    }

    .palette-entry.selected {
        background: var(--color-selected-row);
    }

    .entry-title {
        font-weight: 500;
    }

    .entry-action {
        font-family: var(--font-mono, monospace);
        font-size: 0.85rem;
        color: var(--font-color-muted);
    }

    .entry-description {
        color: var(--font-color-muted);
        font-size: 0.85rem;
        margin-left: auto;
    }

    .entry-raw {
        font-family: var(--font-mono, monospace);
        color: var(--font-color-muted);
    }

    .list-controls {
        border-radius: 0 0 var(--radius-level-3) var(--radius-level-3);
        background: var(--bg-level-4);
        min-height: 30px;
        max-height: 30px;
        border-top: 2px solid var(--border-level-4);
        display: flex;
        align-items: center;
        padding: 0 10px;
        gap: 10px;
    }

    .list-controls-spacer {
        flex: 1;
    }

    .list-controls button {
        display: flex;
        justify-content: center;
        align-items: center;
        border: 0;
        background: transparent;
        color: var(--font-color);
        font-size: 1rem;
        position: relative;
        cursor: pointer;
    }

    .list-controls button:first-child {
        font-size: 1.5rem;
    }

    .list-controls button + button::before {
        content: "";
        position: absolute;
        left: -6px;
        top: 5px;
        bottom: 5px;
        background: var(--border-level-2);
        width: 2px;
    }

    .list-controls button:disabled {
        opacity: 0.5;
    }
</style>
