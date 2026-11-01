<script lang="ts">
    import Page from "$lib/views/Page.svelte";

    import {page} from "$app/stores";
    import Switch from "$lib/components/settings/Switch.svelte";
    import Item from "$lib/components/settings/Item.svelte";
    import Group from "$lib/components/settings/Group.svelte";
    import Separator from "$lib/components/settings/Separator.svelte";

    import registry from "$lib/settings/registry";
    import navigation from "$lib/settings/navigation";
    import config, {isNonDefault, resetSetting, setSetting} from "$lib/stores/config.svelte";
    import {
        activeThemeName,
        colorTier,
        effectiveColors,
        isSchemeColorKey,
        paletteTier,
        themeSelection
    } from "$lib/stores/theme.svelte";
    import Text from "$lib/components/settings/Text.svelte";
    import Number from "$lib/components/settings/Number.svelte";
    import Dropdown from "$lib/components/settings/Dropdown.svelte";
    import Color from "$lib/components/settings/Color.svelte";
    import Palette from "$lib/components/settings/Palette.svelte";
    import Admonition from "$lib/components/Admonition.svelte";
    import Theme from "$lib/components/settings/Theme.svelte";
    import {previews} from "./previews";
    import type {Component} from "svelte";
    import type {HexColor} from "$lib/utils/colors";
    import {resolve} from "$app/paths";
    import {success} from "$lib/stores/toasts.svelte";
    import Range from "$lib/components/settings/Range.svelte";
    import RepeatableText from "$lib/components/settings/RepeatableText.svelte";
    import FeatureList from "$lib/components/settings/FeatureList.svelte";
    import PillButtons from "$lib/components/settings/PillButtons.svelte";
    import Duration from "$lib/components/settings/Duration.svelte";
    import DualNumber from "$lib/components/settings/DualNumber.svelte";
    import CustomColor from "$lib/components/settings/CustomColor.svelte";
    import CustomNumber from "$lib/components/settings/CustomNumber.svelte";
    import ScrollMultiplier from "$lib/components/settings/ScrollMultiplier.svelte";
    import NumberWithUnits from "$lib/components/settings/NumberWithUnits.svelte";
    import {systemFonts, systemEnv} from "$lib/platform/system.svelte";
    import {
        type DropdownOption,
        type FeatureDef,
        type PillOption,
        type SettingsRegistry,
        type SpecialValue
    } from "$lib/settings/types";
    import {groupName, groupNote, panelName, t, tSetting, tWidgetLabel} from "$lib/i18n";

    // Settings that should offer platform-sourced autocomplete from a `<datalist>`.
    const fontFamilyKeys = [
        "fontFamily",
        "fontFamilyBold",
        "fontFamilyItalic",
        "fontFamilyBoldItalic",
        "windowTitleFontFamily"
    ];

    const category = $derived(navigation.find((c) => c.id === $page.params.category));
    const title = $derived(
        category ? panelName(category.id, category.name) : $page.params.category
    );

    // Color editors display the *effective* color (override > theme > default) so the picker
    // always agrees with the preview; edits write an override into config, and reset/right-click
    // drops the key back to following the theme. Non-scheme colors (titlebar, search, …) are
    // untouched by themes and read config directly.
    function displayColor(settingId: keyof typeof registry): string {
        return isSchemeColorKey(settingId)
            ? effectiveColors()[settingId]
            : (config[settingId] as string);
    }

    // NOTE: two deliberately different "theme is active" notions coexist below — don't unify
    // them without deciding which behavior to break:
    //  - `themeActive` (selection kind ≠ unset) is true even for unknown/custom theme names.
    //    Right for the reset-toast wording: Ghostty itself WILL apply a custom theme file,
    //    even though our preview can't render it.
    //  - `themeBadgeText` keys off `activeThemeName()` (known themes only). Right for the
    //    badge: it claims a color is inherited from data we actually resolved.

    // While a theme is active, resetting a theme-affected color makes it *follow the theme*,
    // not the app default. The reset toasts say so instead of the misleading "reset to default".
    const themeActive = $derived(themeSelection().kind !== "unset");
    function isThemedColor(settingId: keyof typeof registry): boolean {
        return themeActive && (isSchemeColorKey(settingId) || settingId === "palette");
    }

    // Tier badge: mark color rows whose displayed value currently comes from the active theme
    // (an explicit override shows the reset arrow instead; app defaults show nothing). The
    // palette keeps its badge even when partially overridden — un-edited swatches still follow.
    function themeBadgeText(settingId: keyof typeof registry): string | undefined {
        const theme = activeThemeName();
        if (!theme) return undefined;
        const follows = settingId === "palette" || (isSchemeColorKey(settingId) && colorTier(settingId) === "theme");
        return follows ? t("ui.settingsPage.inheritedFrom", {theme}) : undefined;
    }

    // Per-swatch tier tooltips for the palette grid — the one setting whose tiers vary per
    // index, which no row-level badge can express.
    function paletteSwatchTooltip(index: number): string | undefined {
        const theme = activeThemeName();
        if (!theme) return undefined;
        const tier = paletteTier(index);
        if (tier === "theme") return t("ui.settingsPage.inheritedFrom", {theme});
        if (tier === "override") return t("ui.settingsPage.themeOverridden");
        return undefined;
    }
</script>

<Page {title}>
    {#if category}
        {#if category.id === "fonts"}
            <Admonition size="1.5rem"
                >{t("ui.settingsPage.movedAdmonitionBefore")}<a href={resolve("/app/font-playground")}>{t("ui.settingsPage.movedLink")}</a
                >{t("ui.settingsPage.movedAdmonitionAfter")}</Admonition
            >
        {:else if category.id === "colors"}
            <Admonition size="1.5rem">{t("ui.settingsPage.resetColorHint")}</Admonition>
        {/if}
        {#each category.groups as group (group.id)}
            <Group
                title={groupName(category.id, group.id, group.name)}
                note={"note" in group ? groupNote(category.id, group.id, group.note) : undefined}
            >
                {@const previewKey = "preview" in group ? group.preview : undefined}
                {#if previewKey && previews[previewKey]}
                    {@const Preview = previews[previewKey] as Component}
                    <Preview />
                    <Separator />
                {/if}
                {#each group.settings as settingId, i (i)}
                    {@const setting = registry[
                        settingId
                    ] as SettingsRegistry[keyof SettingsRegistry]}
                    {@const widget = setting.widget}
                    {@const datalist = fontFamilyKeys.includes(settingId)
                        ? "system-fonts"
                        : settingId === "env"
                          ? "env-var-names"
                          : undefined}
                    {#if i !== 0}<Separator />{/if}
                    <Item
                        {settingId}
                        name={tSetting(settingId, "name", setting.name)}
                        note={tSetting(settingId, "note", setting.note ?? "")}
                        // filter out the current platform from the badge list since it's already obvious from the UI
                        platform={setting?.platform?.filter((p) => p !== category?.id)}
                        since={setting.since}
                        description={tSetting(settingId, "description", setting.description ?? "")}
                        isNonDefault={isNonDefault(settingId)}
                        themeBadge={themeBadgeText(settingId)}
                        inline={widget?.type !== "palette"}
                        onReset={() => {
                            resetSetting(settingId);
                            const name = tSetting(settingId, "name", setting.name);
                            success(
                                isThemedColor(settingId)
                                    ? t("ui.settingsPage.followsTheme", {name})
                                    : t("ui.settingsPage.resetToDefault", {name})
                            );
                        }}
                    >
                        {#if widget}
                            {#if widget.type === "switch"}
                                <Switch bind:value={config[settingId] as string} />
                            {:else if widget.type === "text"}
                                <Text
                                    bind:value={config[settingId] as string}
                                    placeholder={widget.placeholder
                                        ? tWidgetLabel(widget.placeholder)
                                        : undefined}
                                    size={widget.size}
                                />
                            {:else if widget.type === "range"}
                                <Range
                                    bind:value={config[settingId] as string}
                                    min={widget.min}
                                    max={widget.max}
                                    step={widget.step}
                                    showLabels={widget.showLabels}
                                />
                            {:else if widget.type === "number"}
                                <!-- Per the AGENTS.md defaults convention, `default: ""` means the setting is genuinely unset by default — exactly the ones a user may clear back to unset. -->
                                <Number
                                    bind:value={config[settingId] as string}
                                    min={widget.min}
                                    max={widget.max}
                                    step={widget.step}
                                    size={widget.size}
                                    placeholder={widget.placeholder
                                        ? tWidgetLabel(widget.placeholder)
                                        : undefined}
                                    integer={widget.integer}
                                    nullable={setting.default === ""}
                                />
                            {:else if widget.type === "dropdown"}
                                <Dropdown
                                    bind:value={config[settingId] as string}
                                    options={widget.options as Array<DropdownOption | string>}
                                    placeholder={widget.placeholder
                                        ? tWidgetLabel(widget.placeholder)
                                        : undefined}
                                    allowEmpty={widget.allowEmpty}
                                    emptyLabel={widget.emptyLabel
                                        ? tWidgetLabel(widget.emptyLabel)
                                        : undefined}
                                    disabled={setting.disabled}
                                />
                            {:else if widget.type === "theme"}
                                <Theme
                                    bind:value={config[settingId] as string}
                                    options={widget.options as Array<DropdownOption | string>}
                                />
                            {:else if widget.type === "color"}
                                <Color
                                    defaultValue={setting.default as HexColor}
                                    bind:value={() => displayColor(settingId) as HexColor,
                                        (v: HexColor) => setSetting(settingId, v)}
                                    resetMessage={isThemedColor(settingId)
                                        ? t("ui.settingsPage.followsTheme", {
                                              name: tSetting(settingId, "name", setting.name)
                                          })
                                        : undefined}
                                />
                            {:else if widget.type === "palette"}
                                <!-- Displays the effective palette; each edit writes a single-index override so un-touched theme colors never enter config (and thus never serialize). -->
                                <Palette
                                    defaultValue={setting.default as HexColor[]}
                                    value={effectiveColors().palette as HexColor[]}
                                    onSet={(idx: number, c: HexColor) => {
                                        config.palette[idx] = c;
                                    }}
                                    resetMessage={isThemedColor(settingId)
                                        ? t("ui.settingsPage.colorFollowsTheme")
                                        : undefined}
                                    swatchTooltip={paletteSwatchTooltip}
                                />
                            {:else if widget.type === "repeatable-text"}
                                <RepeatableText
                                    bind:value={config[settingId] as string[]}
                                    placeholder={widget.placeholder
                                        ? tWidgetLabel(widget.placeholder)
                                        : undefined}
                                    canReorder={widget.canReorder}
                                    list={datalist}
                                />
                            {:else if widget.type === "feature-list"}
                                <FeatureList
                                    bind:value={config[settingId] as string}
                                    features={widget.features as FeatureDef[]}
                                />
                            {:else if widget.type === "pill"}
                                <PillButtons
                                    bind:value={config[settingId] as string}
                                    options={widget.options as PillOption[]}
                                />
                            {:else if widget.type === "duration"}
                                <Duration
                                    bind:value={config[settingId] as string}
                                    nullable={widget.allowEmpty}
                                    placeholder={widget.placeholder
                                        ? tWidgetLabel(widget.placeholder)
                                        : undefined}
                                />
                            {:else if widget.type === "dual-number"}
                                <DualNumber
                                    bind:value={config[settingId] as string}
                                    labels={(widget.labels as [string, string]).map(
                                        tWidgetLabel
                                    ) as [string, string]}
                                    min={widget.min}
                                    max={widget.max}
                                    step={widget.step}
                                />
                            {:else if widget.type === "custom-color"}
                                <CustomColor
                                    bind:value={() => displayColor(settingId),
                                        (v: string) => setSetting(settingId, v)}
                                    presets={widget.presets as SpecialValue[]}
                                    widget={widget.widget}
                                    default={setting.default as HexColor}
                                    resetMessage={isThemedColor(settingId)
                                        ? t("ui.settingsPage.followsTheme", {
                                              name: tSetting(settingId, "name", setting.name)
                                          })
                                        : undefined}
                                />
                            {:else if widget.type === "custom-number"}
                                <CustomNumber
                                    bind:value={config[settingId] as string}
                                    presets={widget.presets as SpecialValue[]}
                                    min={widget.min}
                                    max={widget.max}
                                    step={widget.step}
                                    size={widget.size}
                                    placeholder={widget.placeholder
                                        ? tWidgetLabel(widget.placeholder)
                                        : undefined}
                                    integer={widget.integer}
                                    widget={widget.widget}
                                />
                            {:else if widget.type === "scroll-multiplier"}
                                <ScrollMultiplier bind:value={config[settingId] as string} />
                            {:else if widget.type === "number-units"}
                                <NumberWithUnits bind:value={config[settingId] as string} />
                            {/if}
                            <!-- Bare nav entries carry no widget: default to RepeatableText when the setting is string[]-valued (`repeatable`), otherwise a plain Text input. -->
                        {:else if setting.repeatable}
                            <RepeatableText
                                bind:value={config[settingId] as string[]}
                                list={datalist}
                            />
                        {:else}
                            <Text bind:value={config[settingId] as string} list={datalist} />
                        {/if}
                    </Item>
                {/each}
            </Group>
        {/each}
        <datalist id="system-fonts">
            {#each systemFonts as font (font)}<option value={font}></option>{/each}
        </datalist>
        <!-- `env` values are `KEY=VALUE`, so suggest the `KEY=` prefix only —
             never the value, which would write a secret into the user's config. -->
        <datalist id="env-var-names">
            {#each Object.keys(systemEnv) as name (name)}<option value={`${name}=`}></option>{/each}
        </datalist>
    {:else}
        <h1>{t("ui.settingsPage.notFoundTitle")}</h1>
        <p>{t("ui.settingsPage.notFoundBody")}</p>
    {/if}
</Page>
