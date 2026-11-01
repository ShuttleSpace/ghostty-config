<script lang="ts">
    import {fly} from "svelte/transition";
    import {untrack} from "svelte";
    import Group from "./Group.svelte";
    import Item from "./Item.svelte";
    import Text from "./Text.svelte";
    import Button from "../Button.svelte";
    import {t} from "$lib/i18n";
    import type {CommandPaletteEntry} from "$lib/utils/commandPalette";

    interface Props {
        value?: CommandPaletteEntry;
        onsave?: (entry: CommandPaletteEntry) => void;
        oncancel?: () => void;
    }

    const {value = {title: "", action: ""}, onsave, oncancel}: Props = $props();

    // The editor is remounted for each add/edit, so capturing the initial value is intended.
    let title = $state(untrack(() => value.title));
    let action = $state(untrack(() => value.action));
    let description = $state(untrack(() => value.description ?? ""));

    const canSave = $derived(title.trim().length > 0 && action.trim().length > 0);

    function save() {
        if (!canSave) return;
        onsave?.({
            title: title.trim(),
            action: action.trim(),
            description: description.trim() || undefined
        });
    }
</script>

<div class="palette-editor" in:fly={{y: 30, duration: 200}}>
    <Group title={t("ui.commandPalette.editorTitle")}>
        <Item name={t("ui.commandPalette.titleLabel")} note={t("ui.commandPalette.titleNote")}>
            <Text bind:value={title} placeholder={t("ui.commandPalette.titlePlaceholder")} />
        </Item>
        <Item name={t("ui.commandPalette.actionLabel")} note={t("ui.commandPalette.actionNote")}>
            <Text bind:value={action} placeholder="csi:0m" />
        </Item>
        <Item
            name={t("ui.commandPalette.descriptionLabel")}
            note={t("ui.commandPalette.descriptionNote")}
        >
            <Text
                bind:value={description}
                placeholder={t("ui.commandPalette.descriptionPlaceholder")}
            />
        </Item>
    </Group>
    <div class="editor-controls">
        <Button onclick={oncancel}>{t("ui.commandPalette.cancel")}</Button>
        <Button primary onclick={save} disabled={!canSave}>
            {t("ui.commandPalette.save")}
        </Button>
    </div>
</div>

<style>
    .palette-editor {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .editor-controls {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }
</style>
