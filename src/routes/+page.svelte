<script lang="ts">
    import Page from "$lib/views/Page.svelte";
    import logo from "$lib/images/icon.webp";
    import Admonition from "$lib/components/Admonition.svelte";
    import Group from "$lib/components/settings/Group.svelte";
    import {resolve} from "$app/paths";
    import Checkbox from "$lib/components/settings/Checkbox.svelte";
    import {t} from "$lib/i18n";

    const githubIssues = "https://github.com/zerebos/ghostty-config/issues";
    const iterm2Schemes = "https://github.com/mbadolato/iTerm2-Color-Schemes/";
    const macosSettings = resolve("/settings/macos");
</script>

<Page title="Ghostty Config">
    <section>
        <div class="user">
            <div class="user-avatar">
                <img src={logo} alt={t("ui.app.logoAlt")} />
            </div>
            <div class="user-label">
                <div class="user-name">Ghostty Config</div>
                <div class="user-subtext">
                    {t("ui.app.byBefore")}<a
                        href="https://zerebos.com"
                        target="_blank"
                        rel="noopener noreferrer">@zerebos</a
                    >
                </div>
            </div>
        </div>
        <Admonition>
            {t("ui.home.bugsBefore")}{t("ui.home.bugsWill")}{t("ui.home.bugsMiddle")}<a
                href={githubIssues}
                target="_blank"
                rel="noopener noreferrer">{t("ui.home.onGithub")}</a
            >{t("ui.home.bugsAfter")}
        </Admonition>
        <Group title={t("ui.home.recentChanges")}>
            <ul>
                <li><Checkbox checked />{t("ui.home.recent.inputs")}</li>
                <li><Checkbox checked />{t("ui.home.recent.repeatable")}</li>
                <li><Checkbox checked />{t("ui.home.recent.flow")}</li>
                <li>
                    <Checkbox checked /><span
                        >{t("ui.home.recent.themesBefore")}<a
                            href={iterm2Schemes}
                            target="_blank"
                            rel="noopener noreferrer">{t("ui.home.iterm")}</a
                        >{t("ui.home.recent.themesAfter")}</span
                    >
                </li>
                <li>
                    <Checkbox checked /><span
                        >{t("ui.home.recent.appIconBefore")}<a href={macosSettings}
                            >{t("ui.home.macosPage")}</a
                        >{t("ui.home.recent.appIconAfter")}</span
                    >
                </li>
                <li><Checkbox checked />{t("ui.home.recent.schema")}</li>
                <li><Checkbox checked />{t("ui.home.recent.terminal")}</li>
                <li><Checkbox checked />{t("ui.home.recent.scroll")}</li>
            </ul>
        </Group>
        <Group title={t("ui.home.roadmap")}>
            <ul>
                <li><Checkbox checked />{t("ui.home.roadmapItems.palette")}</li>
                <li><Checkbox checked />{t("ui.home.roadmapItems.colors")}</li>
                <li><Checkbox />{t("ui.home.roadmapItems.presets")}</li>
                <li><Checkbox />{t("ui.home.roadmapItems.desktop")}</li>
                <li><Checkbox />{t("ui.home.roadmapItems.testing")}</li>
            </ul>
        </Group>
    </section>
</Page>

<style>
    section {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        flex: 0.6;
    }

    .user {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 8px;
        margin: 20px 0;
    }

    .user-avatar img {
        height: 100%;
        width: 100%;
    }

    .user-avatar {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(#03028f, #09043a);
        height: 100px;
        width: 100px;
        border-radius: 50%;
        /* border: 2px solid black; */
        /* box-shadow: 0 0 0 2px white; */
    }

    .user-label {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 5px;
    }

    .user-name {
        position: relative;
        display: flex;
        justify-content: center;
        font-size: 1.3rem;
        color: var(--font-color);
        font-weight: 600;
    }

    .user-subtext {
        display: flex;
        justify-content: center;
        font-size: 1.1rem;
        gap: 3px;
    }

    ul {
        /* list-style: "↪ "; */
        /* list-style: "🠶 "; */
        list-style: none;
        padding-left: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        height: 100%;
        justify-content: space-evenly;
    }

    ul li {
        margin-bottom: 5px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
</style>
