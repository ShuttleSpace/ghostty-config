<script lang="ts">
    import Page from "$lib/views/Page.svelte";
    import config from "$lib/stores/config.svelte";
    import Keybinds from "$lib/components/settings/Keybinds.svelte";
    import CommandPalette from "$lib/components/settings/CommandPalette.svelte";
    import RepeatableText from "$lib/components/settings/RepeatableText.svelte";
    import Group from "$lib/components/settings/Group.svelte";
    import Item from "$lib/components/settings/Item.svelte";
    import registry from "$lib/settings/registry";
    import {panelName, tSetting} from "$lib/i18n";
</script>

<Page title={panelName("keybinds", "Keybinds")}>
    <Keybinds bind:value={config.keybind} />
    <Group title={tSetting("keyRemap", "name", registry.keyRemap.name)}>
        <Item
            name={tSetting("keyRemap", "name", registry.keyRemap.name)}
            note={tSetting("keyRemap", "note", registry.keyRemap.note ?? "")}
            settingId="keyRemap"
            description={tSetting("keyRemap", "description", registry.keyRemap.description ?? "")}
        >
            <RepeatableText bind:value={config.keyRemap} placeholder="ctrl=super" />
        </Item>
    </Group>
    <Group title={tSetting("commandPaletteEntry", "name", registry.commandPaletteEntry.name)}>
        <Item
            name={tSetting("commandPaletteEntry", "name", registry.commandPaletteEntry.name)}
            note={tSetting(
                "commandPaletteEntry",
                "note",
                registry.commandPaletteEntry.note ?? ""
            )}
            settingId="commandPaletteEntry"
            description={tSetting(
                "commandPaletteEntry",
                "description",
                registry.commandPaletteEntry.description ?? ""
            )}
        >
            <CommandPalette bind:value={config.commandPaletteEntry} />
        </Item>
    </Group>
</Page>
