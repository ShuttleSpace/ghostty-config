<script lang="ts">
    import Admonition from "$lib/components/Admonition.svelte";
    import PillButtons from "$lib/components/settings/PillButtons.svelte";
    import StyleCard from "$lib/components/styles/StyleCard.svelte";
    import Page from "$lib/views/Page.svelte";
    import Group from "$lib/components/settings/Group.svelte";
    import {t} from "$lib/i18n";
    import {checkTextForImport} from "$lib/stores/import.svelte";
    import {communityStyles} from "$lib/styles/catalog";
    import {starterStyles} from "$lib/styles/starter";
    import type {Style} from "$lib/styles/types";

    let query = $state("");
    let sourceFilter = $state("all");
    let modeFilter = $state("all");

    const needle = $derived(query.trim().toLowerCase());

    const communityNote = $derived(
        t("ui.styles.communityNote", {
            link: `<a href="https://ghostty.style" target="_blank" rel="noopener noreferrer">ghostty.style</a>`
        })
    );

    function matches(style: Style): boolean {
        if (modeFilter === "dark" && !style.isDark) return false;
        if (modeFilter === "light" && style.isDark) return false;
        if (!needle) return true;
        const haystack = `${style.title} ${style.description} ${style.tags.join(" ")} ${style.author ?? ""}`.toLowerCase();
        return haystack.includes(needle);
    }

    const visibleStarter = $derived(
        (sourceFilter === "all" || sourceFilter === "starter" ? starterStyles : []).filter(matches)
    );
    const visibleCommunity = $derived(
        (sourceFilter === "all" || sourceFilter === "community" ? communityStyles : []).filter(
            matches
        )
    );
    const showCommunityEmpty = $derived(
        communityStyles.length === 0 && (sourceFilter === "all" || sourceFilter === "community")
    );

    function apply(style: Style) {
        checkTextForImport("style", style.rawConfig, {strippedKeys: style.strippedKeys ?? []});
    }
</script>

<Page title={t("ui.styles.title")}>
    <Admonition>{t("ui.styles.admonition")}</Admonition>

    <div class="toolbar">
        <input
            class="search"
            type="search"
            placeholder={t("ui.styles.search")}
            bind:value={query}
        />
        <PillButtons
            bind:value={sourceFilter}
            options={[
                {value: "all", label: t("ui.styles.all")},
                {value: "starter", label: t("ui.styles.starter")},
                {value: "community", label: t("ui.styles.community")}
            ]}
        />
        <PillButtons
            bind:value={modeFilter}
            options={[
                {value: "all", label: t("ui.styles.any")},
                {value: "dark", label: t("ui.styles.dark")},
                {value: "light", label: t("ui.styles.light")}
            ]}
        />
    </div>

    {#if visibleStarter.length}
        <Group title={t("ui.styles.starterGroup")} note={t("ui.styles.starterNote")}>
            <div class="grid">
                {#each visibleStarter as style (style.id)}
                    <StyleCard preset={style} onapply={() => apply(style)} />
                {/each}
            </div>
        </Group>
    {/if}

    {#if visibleCommunity.length}
        <Group title={t("ui.styles.communityGroup")} note={communityNote}>
            <div class="grid">
                {#each visibleCommunity as style (style.id)}
                    <StyleCard preset={style} onapply={() => apply(style)} />
                {/each}
            </div>
        </Group>
    {:else if showCommunityEmpty}
        <Admonition>{t("ui.styles.communityEmpty")}</Admonition>
    {/if}

    {#if visibleStarter.length === 0 && visibleCommunity.length === 0}
        <Admonition>{t("ui.styles.noMatch")}</Admonition>
    {/if}
</Page>

<style>
    .toolbar {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 4px;
    }

    .search {
        flex: 1;
        min-width: 180px;
        background: var(--bg-level-2);
        border: 1px solid var(--border-input);
        border-radius: var(--radius-level-5);
        color: inherit;
        padding: 5px 8px;
        outline: none;
        font: inherit;
        font-size: 0.9rem;
    }

    .search:focus {
        background: var(--bg-input-focus);
        outline: var(--border-input-focus);
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 12px;
    }
</style>
