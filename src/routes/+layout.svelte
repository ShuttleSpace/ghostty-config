<script lang="ts">
    // import {dev} from "$app/environment";
    import {onMount, untrack, type Snippet} from "svelte";

    import "../app.css";

    import Gap from "$lib/components/Gap.svelte";
    import Tab from "$lib/components/Tab.svelte";
    import User from "$lib/components/User.svelte";
    import ModalStack from "$lib/components/modals/ModalStack.svelte";
    import IncomingImportModal from "$lib/components/modals/IncomingImportModal.svelte";
    import ToastStack from "$lib/components/ToastStack.svelte";
    import SettingsSearch from "$lib/components/SettingsSearch.svelte";
    import MacDock from "$lib/components/MacDock.svelte";

    import github from "$lib/images/tabs/github.svg";
    import ghostty from "$lib/images/tabs/ghostty.webp";

    import sync from "$lib/images/tabs/sync.webp";
    import calligraphy from "$lib/images/tabs/font-playground.webp";
    import stylesIcon from "$lib/images/tabs/styles.svg";

    import config from "$lib/stores/config.svelte";
    import {numberCodec} from "$lib/settings/codecs";
    import {effectiveColors} from "$lib/stores/theme.svelte";
    import {resolveCellColor} from "$lib/utils/colors";
    import app, {
        bothWindowsOpen,
        closeConfigWindow,
        closeWindowMenu,
        minimizeConfigWindow,
        openWindowMenu,
        restoreWindowLayout,
        setWindowLayout
    } from "$lib/stores/state.svelte";
    import navigation, {tabGroups} from "$lib/settings/navigation";
    import {isTauri} from "$lib/platform";
    import {loadLocalConfig} from "$lib/platform/ghostty";
    import {initLocale, panelName, t} from "$lib/i18n";
    import LanguageSelect from "$lib/components/LanguageSelect.svelte";

    // The single funnel for the color keys: everything below reads the *effective* colors
    // (override > theme > default, see stores/theme.svelte.ts) and every other surface reads
    // the resulting --config-* CSS vars, inheriting the layered colors for free.
    const cssConfigVars = $derived.by(() => {
        let str = "";

        const add = (key: string, val: string) => (str += `--config-${key}: ${val};`);

        // Add the base colors. Cursor/selection colors may hold `cell-foreground`/`cell-background`
        // keywords, so resolve those against fg/bg before emitting them as CSS colors.
        const colors = effectiveColors();
        const fg = colors.foreground;
        const bg = colors.background;
        add("bg", bg);
        add("fg", fg);
        add("selection-bg", resolveCellColor(colors.selectionBackground, fg, bg) || fg);
        add("selection-fg", resolveCellColor(colors.selectionForeground, fg, bg) || bg);
        add("cursor-color", resolveCellColor(colors.cursorColor, fg, bg) || fg);
        add("cursor-text", resolveCellColor(colors.cursorText, fg, bg) || bg);
        // Coerced here so downstream CSS (color-mix in CursorPreview) always gets a number.
        add("cursor-opacity", String(numberCodec.parse(config.cursorOpacity) ?? 1));

        // Add the palette colors
        const paletteSize = 16; // colors.palette.length;
        for (let c = 0; c < paletteSize; c++) add(`palette-${c}`, colors.palette[c]);

        // TODO: consider honoring separate fonts for bold/italic and such in previews
        // Add font settings
        add(
            "font-family",
            config.fontFamily
                .filter(Boolean)
                .map((f) => JSON.stringify(f))
                .join(", ") || JSON.stringify("JetBrainsMono Nerd Font")
        );
        add("font-size", `${config.fontSize}px`);

        return str;
    });

    const {children}: {children: Snippet} = $props();

    const htmlTitle = $derived.by(() => {
        const name = app.title === "Ghostty Config" ? "" : app.title;
        let title = "Ghostty Config";
        if (name) title = `${name} - ${title}`;
        return title;
    });

    // With both windows open, green tiles them together; alone it toggles full screen.
    const configZoomed = $derived(app.configWindowMaximized || app.windowLayout !== "none");
    const configZoomLabel = $derived(t("ui.window.layout"));

    let zoomButton = $state<HTMLButtonElement | null>(null);
    let menuPosition = $state({left: 0, top: 0});

    function toggleConfigMenu(event: MouseEvent) {
        // Keep the window-level click handler from immediately closing it again.
        event.stopPropagation();

        if (app.windowMenuOwner === "config") {
            closeWindowMenu();
            return;
        }

        const rect = zoomButton?.getBoundingClientRect();
        if (rect) {
            menuPosition = {
                left: Math.max(8, Math.min(rect.left, window.innerWidth - 216)),
                top: rect.bottom + 6
            };
        }
        openWindowMenu("config");
    }

    function fillConfig() {
        // Remember the geometry to return to: the pre-split free position if we
        // were tiled, else the current free position.
        if (app.windowLayout !== "none") {
            if (configPreTileGeometry) configRestoreGeometry = configPreTileGeometry;
            configPreTileGeometry = null;
        }
 else if (!app.configWindowMaximized) {
            configRestoreGeometry = {x: configX, y: configY, width: configWidth, height: configHeight};
        }
        app.configWindowMaximized = true;
        app.windowLayout = "none";
        closeWindowMenu();
    }

    function restoreConfig() {
        if (app.configWindowMaximized && configRestoreGeometry) {
            configX = configRestoreGeometry.x;
            configY = configRestoreGeometry.y;
            configWidth = configRestoreGeometry.width;
            configHeight = configRestoreGeometry.height;
        }
        app.configWindowMaximized = false;
        restoreWindowLayout();
    }

    function onWindowKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") closeWindowMenu();
    }

    // --- Config window free geometry: drag from its header + edge resize, all
    // clamped to the workspace so the window never slides under the dock strip. ---
    type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

    const CONFIG_DEFAULT_WIDTH = 1000;
    const CONFIG_DEFAULT_HEIGHT = 700;
    const CONFIG_MIN_WIDTH = 560;
    const CONFIG_MIN_HEIGHT = 360;
    const CONFIG_TILE_PAD = 12;
    const CONFIG_TILE_GAP = 12;

    let configElement = $state<HTMLDivElement | null>(null);
    let configX = $state(0);
    let configY = $state(0);
    let configWidth = $state(CONFIG_DEFAULT_WIDTH);
    let configHeight = $state(CONFIG_DEFAULT_HEIGHT);
    let configDragging = $state(false);
    let configResizing = $state(false);
    let configResizeDir: ResizeDir | null = null;
    let configDragOffsetX = 0;
    let configDragOffsetY = 0;
    let configResizeStartX = 0;
    let configResizeStartY = 0;
    let configResizeStartWidth = 0;
    let configResizeStartHeight = 0;
    let configResizeStartLeft = 0;
    let configResizeStartTop = 0;
    // Restore point when leaving the maximized (Fill) state.
    let configRestoreGeometry: {x: number; y: number; width: number; height: number} | null = null;
    // Restore point when leaving a tiled split.
    let configPreTileGeometry: {x: number; y: number; width: number; height: number} | null = null;
    let configTiled = $state<"none" | "horizontal" | "vertical">("none");

    // The workspace excludes the dock, so every bound keeps the window above it.
    function getWorkspaceRect() {
        const el = document.getElementById("desktop-workspace");
        if (el) {
            const rect = el.getBoundingClientRect();
            return {left: rect.left, top: rect.top, width: rect.width, height: rect.height};
        }
        return {left: 0, top: 0, width: window.innerWidth, height: window.innerHeight};
    }

    // First tiling cell: left half (horizontal) or top half (vertical).
    function configCellRect(layout: "horizontal" | "vertical") {
        const ws = getWorkspaceRect();
        if (layout === "horizontal") {
            const cell = (ws.width - CONFIG_TILE_PAD * 2 - CONFIG_TILE_GAP) / 2;
            return {x: ws.left + CONFIG_TILE_PAD, y: ws.top + CONFIG_TILE_PAD, width: cell, height: ws.height - CONFIG_TILE_PAD * 2};
        }
        const cell = (ws.height - CONFIG_TILE_PAD * 2 - CONFIG_TILE_GAP) / 2;
        return {x: ws.left + CONFIG_TILE_PAD, y: ws.top + CONFIG_TILE_PAD, width: ws.width - CONFIG_TILE_PAD * 2, height: cell};
    }

    // Reconcile the free geometry with the maximize/tilt state.
    $effect(() => {
        const layout = app.windowLayout;
        const maximized = app.configWindowMaximized;
        const visible = app.configWindowOpen;
        const tiling = layout !== "none";
        if (!visible) return;

        untrack(() => {
            if (tiling) {
                if (configTiled === "none") {
                    configPreTileGeometry = maximized && configRestoreGeometry
                        ? configRestoreGeometry
                        : {x: configX, y: configY, width: configWidth, height: configHeight};
                    configRestoreGeometry = null;
                }
                configTiled = layout;
                const rect = configCellRect(layout);
                configX = rect.x;
                configY = rect.y;
                configWidth = rect.width;
                configHeight = rect.height;
                return;
            }

            if (configTiled !== "none") {
                if (configPreTileGeometry) {
                    configX = configPreTileGeometry.x;
                    configY = configPreTileGeometry.y;
                    configWidth = configPreTileGeometry.width;
                    configHeight = configPreTileGeometry.height;
                }
                configTiled = "none";
                configPreTileGeometry = null;
                if (!maximized) return;
            }

            if (maximized) {
                const ws = getWorkspaceRect();
                configX = ws.left;
                configY = ws.top;
                configWidth = ws.width;
                configHeight = ws.height;
            }
        });
    });

    // Keep the window inside the workspace on viewport resize, and re-apply the
    // maximized/tiled geometry when the viewport changes size.
    $effect(() => {
        if (!app.configWindowOpen) return;
        function onResize() {
            const ws = getWorkspaceRect();
            if (app.configWindowMaximized) {
                configX = ws.left;
                configY = ws.top;
                configWidth = ws.width;
                configHeight = ws.height;
                return;
            }
            if (app.windowLayout !== "none") {
                const rect = configCellRect(app.windowLayout);
                configX = rect.x;
                configY = rect.y;
                configWidth = rect.width;
                configHeight = rect.height;
                return;
            }
            configWidth = Math.min(configWidth, ws.width);
            configHeight = Math.min(configHeight, ws.height);
            configX = Math.max(ws.left, Math.min(configX, ws.left + ws.width - configWidth));
            configY = Math.max(ws.top, Math.min(configY, ws.top + ws.height - configHeight));
        }
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    });

    function startConfigDrag(e: MouseEvent) {
        if (configResizing || !app.configWindowOpen) return;
        closeWindowMenu();
        if (app.windowLayout !== "none") {
            configPreTileGeometry = null;
            app.windowLayout = "none";
        }
        configDragging = true;
        configDragOffsetX = e.clientX - configX;
        configDragOffsetY = e.clientY - configY;
    }

    function startConfigResize(e: MouseEvent, dir: ResizeDir) {
        if (!app.configWindowOpen) return;
        e.preventDefault();
        e.stopPropagation();
        closeWindowMenu();
        if (app.windowLayout !== "none") {
            configPreTileGeometry = null;
            app.windowLayout = "none";
        }
        if (app.configWindowMaximized) {
            app.configWindowMaximized = false;
            if (configRestoreGeometry) {
                configX = configRestoreGeometry.x;
                configY = configRestoreGeometry.y;
                configWidth = configRestoreGeometry.width;
                configHeight = configRestoreGeometry.height;
            }
            configRestoreGeometry = null;
        }
        configResizing = true;
        configResizeDir = dir;
        configResizeStartX = e.clientX;
        configResizeStartY = e.clientY;
        configResizeStartWidth = configWidth;
        configResizeStartHeight = configHeight;
        configResizeStartLeft = configX;
        configResizeStartTop = configY;
    }

    $effect(() => {
        if (!configDragging && !configResizing) return;

        function onMove(e: MouseEvent) {
            const ws = getWorkspaceRect();

            if (configDragging) {
                configX = Math.max(
                    ws.left,
                    Math.min(ws.left + ws.width - configWidth, e.clientX - configDragOffsetX)
                );
                configY = Math.max(
                    ws.top,
                    Math.min(ws.top + ws.height - configHeight, e.clientY - configDragOffsetY)
                );
                return;
            }

            if (!configResizing || !configResizeDir) return;

            const dx = e.clientX - configResizeStartX;
            const dy = e.clientY - configResizeStartY;
            let nx = configResizeStartLeft;
            let ny = configResizeStartTop;
            let nw = configResizeStartWidth;
            let nh = configResizeStartHeight;

            if (configResizeDir.includes("e")) nw = configResizeStartWidth + dx;
            if (configResizeDir.includes("s")) nh = configResizeStartHeight + dy;
            if (configResizeDir.includes("w")) {
                nw = configResizeStartWidth - dx;
                nx = configResizeStartLeft + dx;
            }
            if (configResizeDir.includes("n")) {
                nh = configResizeStartHeight - dy;
                ny = configResizeStartTop + dy;
            }

            if (configResizeDir.includes("w") && nw < CONFIG_MIN_WIDTH) {
                nx = configResizeStartLeft + (configResizeStartWidth - CONFIG_MIN_WIDTH);
                nw = CONFIG_MIN_WIDTH;
            }
 else {
                nw = Math.max(CONFIG_MIN_WIDTH, nw);
            }
            if (configResizeDir.includes("n") && nh < CONFIG_MIN_HEIGHT) {
                ny = configResizeStartTop + (configResizeStartHeight - CONFIG_MIN_HEIGHT);
                nh = CONFIG_MIN_HEIGHT;
            }
 else {
                nh = Math.max(CONFIG_MIN_HEIGHT, nh);
            }
            if (nx < ws.left) {
                if (configResizeDir.includes("w")) nw += nx - ws.left;
                nx = ws.left;
            }
            if (ny < ws.top) {
                if (configResizeDir.includes("n")) nh += ny - ws.top;
                ny = ws.top;
            }
            nw = Math.max(CONFIG_MIN_WIDTH, Math.min(nw, ws.left + ws.width - nx));
            nh = Math.max(CONFIG_MIN_HEIGHT, Math.min(nh, ws.top + ws.height - ny));

            configX = nx;
            configY = ny;
            configWidth = nw;
            configHeight = nh;
        }

        function onUp() {
            configDragging = false;
            configResizing = false;
            configResizeDir = null;
        }

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    });

    // On the desktop build, open with the user's existing Ghostty config already
    // reflected in the UI. Web has no local config, so this is a no-op there.
    onMount(() => {
        initLocale();
        if (isTauri) void loadLocalConfig();

        const ws = getWorkspaceRect();
        const rootStyles = getComputedStyle(document.documentElement);
        const appWidth = parseFloat(rootStyles.getPropertyValue("--app-width")) || CONFIG_DEFAULT_WIDTH;
        const appHeight = parseFloat(rootStyles.getPropertyValue("--app-height")) || CONFIG_DEFAULT_HEIGHT;
        const defaultWidth = Math.min(ws.width * 0.9, appWidth);
        const defaultHeight = Math.min(ws.height * 0.9, appHeight);
        configWidth = defaultWidth;
        configHeight = defaultHeight;
        configX = ws.left + Math.max(0, (ws.width - defaultWidth) / 2);
        configY = ws.top + Math.max(0, (ws.height - defaultHeight) / 2);
    });
</script>

<svelte:head>
    <title>{htmlTitle}</title>
</svelte:head>

<!-- eslint-disable-next-line svelte/require-optimized-style-attribute -->
<div class="desktop" style={cssConfigVars}>
    <div
        id="desktop-workspace"
        class="workspace"
        class:maximized={app.configWindowMaximized}
        class:tile-horizontal={app.windowLayout === "horizontal"}
        class:tile-vertical={app.windowLayout === "vertical"}
    >
        <div
            bind:this={configElement}
            class="app-window"
            class:is-maximized={app.configWindowMaximized && app.windowLayout === "none"}
            class:is-hidden={!app.configWindowOpen}
            class:is-minimized={app.configWindowMinimized}
            style:left={`${configX}px`}
            style:top={`${configY}px`}
            style:width={`${configWidth}px`}
            style:height={`${configHeight}px`}
            style:cursor={configDragging ? "grabbing" : "default"}
            aria-hidden={!app.configWindowOpen}
            inert={!app.configWindowOpen}
        >
            <div id="sidebar">
                <div class="sidebar-header" role="presentation" onmousedown={startConfigDrag}>
                    <div class="window-actions-container">
                        <div class="window-actions" role="presentation" onmousedown={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                class="window-dot"
                                onclick={closeConfigWindow}
                                title={t("ui.window.close")}
                                aria-label={t("ui.window.closeWindow")}><span>&times;</span></button
                            >
                            <button
                                type="button"
                                class="window-dot"
                                onclick={minimizeConfigWindow}
                                title={t("ui.window.minimize")}
                                aria-label={t("ui.window.minimizeWindow")}
                                ><span>&ndash;</span></button
                            >
                            <button
                                type="button"
                                class="window-dot"
                                bind:this={zoomButton}
                                onclick={toggleConfigMenu}
                                title={configZoomLabel}
                                aria-label={configZoomLabel}
                                aria-haspopup="menu"
                                aria-expanded={app.windowMenuOwner === "config"}
                                ><span>{configZoomed ? "−" : "+"}</span></button
                            >
                        </div>
                    </div>
                </div>
                <SettingsSearch>
                    <User route="/" />
                    <!-- <Gap />
            <Tab route="/settings/application">
                {#snippet icon()}<img src={application} alt="Application Settings" />{/snippet}
                Application
            </Tab>
            <Tab route="/settings/clipboard">
                {#snippet icon()}<img src={clipboard} alt="Clipboard Settings" />{/snippet}
                Clipboard
            </Tab>
            <Tab route="/settings/window">
                {#snippet icon()}<img src={window} alt="Window Settings" />{/snippet}
                Window
            </Tab>
            <Gap />
            <Tab route="/settings/colors">
                {#snippet icon()}<img src={colors} alt="Color Settings" />{/snippet}
                Colors
            </Tab>
            <Tab route="/settings/fonts">
                {#snippet icon()}<img src={fonts} alt="Font Settings" />{/snippet}
                Fonts
            </Tab>
            <Gap />
            <Tab route="/settings/keybinds">
                {#snippet icon()}<img src={keybinds} alt="Keybind Settings" />{/snippet}
                Keybinds
            </Tab>
            <Tab route="/settings/mouse">
                {#snippet icon()}<img src={mouse} alt="Mouse Settings" />{/snippet}
                Mouse
            </Tab>
            <Gap />
            <Tab route="/settings/gtk">
                {#snippet icon()}<div class="icon-wrapper"><img src={gtk} alt="GTK Settings" /></div>{/snippet}
                GTK
            </Tab>
            <Tab route="/settings/linux">
                {#snippet icon()}<img src={linux} alt="Linux Settings" />{/snippet}
                Linux
            </Tab>
            <Tab route="/settings/macos">
                {#snippet icon()}<img src={macos} alt="MacOS Settings" />{/snippet}
                macOS
            </Tab> -->
                    {#each tabGroups as group, i (i)}
                        <Gap />
                        {#each group as panelId (panelId)}
                            {@const panel = navigation.find((p) => p.id === panelId)}
                            {#if panel}
                                {@const panelLabel = panelName(panel.id, panel.name)}
                                <Tab route={`/settings/${panel.id}`}>
                                    {#snippet icon()}
                                        <!-- FIXME: this is a hack -->
                                        {#if panel.icon.includes("svg+xml") || panel.icon.endsWith(".svg")}
                                            <div class="icon-wrapper">
                                                <img
                                                    src={panel.icon}
                                                    alt={t("ui.nav.settingsFor", {
                                                        name: panelLabel
                                                    })}
                                                />
                                            </div>
                                        {:else}
                                            <img
                                                src={panel.icon}
                                                alt={t("ui.nav.settingsFor", {name: panelLabel})}
                                            />
                                        {/if}
                                    {/snippet}
                                    {panelLabel}
                                </Tab>
                            {/if}
                        {/each}
                    {/each}
                    <Gap expand={true} />
                    <Tab route="/styles">
                        {#snippet icon()}<div class="icon-wrapper">
                                <img src={stylesIcon} alt={t("ui.styles.title")} />
                            </div>{/snippet}
                        {t("ui.styles.title")}
                    </Tab>
                    <Tab route="/app/import-export">
                        {#snippet icon()}<img src={sync} alt={t("ui.nav.sync")} />{/snippet}
                        {t("ui.nav.importExport")}
                    </Tab>
                    <Tab route="/app/font-playground">
                        {#snippet icon()}<img
                                src={calligraphy}
                                alt={t("ui.nav.fontPlayground")}
                            />{/snippet}
                        {t("ui.nav.fontPlayground")}
                    </Tab>
                    <!-- {#if dev}
            <Tab route="/app/dropdown-debug">
                {#snippet icon()}<img src={ghostty} alt="Dropdown Debug" />{/snippet}
                Dropdown Debug
            </Tab>
            {/if} -->
                    <Gap expand={true} />
                    <Tab route="https://github.com/zerebos/ghostty-config">
                        {#snippet icon()}<div class="icon-wrapper github">
                                <img src={github} alt={t("ui.nav.github")} />
                            </div>{/snippet}
                        {t("ui.nav.github")}
                    </Tab>
                    <Tab route="https://ghostty.org/">
                        {#snippet icon()}<img src={ghostty} alt={t("ui.nav.ghostty")} />{/snippet}
                        {t("ui.nav.ghostty")}
                    </Tab>
                    <LanguageSelect />
                </SettingsSearch>
            </div>
            <div id="content-view">
                {@render children()}
            </div>

            <div
                class="resize-handle resize-n"
                onmousedown={(e) => startConfigResize(e, "n")}
                aria-hidden="true"
            ></div>
            <div
                class="resize-handle resize-s"
                onmousedown={(e) => startConfigResize(e, "s")}
                aria-hidden="true"
            ></div>
            <div
                class="resize-handle resize-e"
                onmousedown={(e) => startConfigResize(e, "e")}
                aria-hidden="true"
            ></div>
            <div
                class="resize-handle resize-w"
                onmousedown={(e) => startConfigResize(e, "w")}
                aria-hidden="true"
            ></div>
            <div
                class="resize-handle resize-ne"
                onmousedown={(e) => startConfigResize(e, "ne")}
                aria-hidden="true"
            ></div>
            <div
                class="resize-handle resize-nw"
                onmousedown={(e) => startConfigResize(e, "nw")}
                aria-hidden="true"
            ></div>
            <div
                class="resize-handle resize-se"
                onmousedown={(e) => startConfigResize(e, "se")}
                aria-hidden="true"
            ></div>
            <div
                class="resize-handle resize-sw"
                onmousedown={(e) => startConfigResize(e, "sw")}
                aria-hidden="true"
            ></div>
        </div>
    </div>
    {#if app.windowMenuOwner === "config"}
        <div
            class="zoom-menu"
            role="menu"
            aria-label={t("ui.window.layout")}
            style:left={`${menuPosition.left}px`}
            style:top={`${menuPosition.top}px`}
        >
            <button type="button" role="menuitem" class="zoom-menu-item" onclick={fillConfig}>
                <span>{t("ui.window.fill")}</span>
                {#if app.configWindowMaximized && app.windowLayout === "none"}<span class="zoom-check">✓</span
                    >{/if}
            </button>
            <button
                type="button"
                role="menuitem"
                class="zoom-menu-item"
                onclick={() => setWindowLayout("horizontal")}
                disabled={!bothWindowsOpen()}
            >
                <span>{t("ui.window.splitHorizontal")}</span>
                {#if app.windowLayout === "horizontal"}<span class="zoom-check">✓</span>{/if}
            </button>
            <button
                type="button"
                role="menuitem"
                class="zoom-menu-item"
                onclick={() => setWindowLayout("vertical")}
                disabled={!bothWindowsOpen()}
            >
                <span>{t("ui.window.splitVertical")}</span>
                {#if app.windowLayout === "vertical"}<span class="zoom-check">✓</span>{/if}
            </button>
            <div class="zoom-menu-separator" role="separator"></div>
            <button
                type="button"
                role="menuitem"
                class="zoom-menu-item"
                onclick={restoreConfig}
                disabled={!configZoomed}
            >
                <span>{t("ui.window.restore")}</span>
            </button>
        </div>
    {/if}
    <MacDock />
    <IncomingImportModal />
    <ModalStack />
    <ToastStack />
</div>

<svelte:window onclick={closeWindowMenu} onkeydown={onWindowKeydown} />

<!-- <svelte:window onmouseup={onMouseUp} onmousemove={onMouseMove} /> -->

<style>
    .desktop {
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .workspace {
        flex: 1;
        min-height: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        transition: padding 200ms ease;
    }

    .workspace.maximized {
        padding: 0;
    }

    /* Tiling: config takes the first cell (positioned by +layout.svelte), the
   preview window is positioned over the second by FloatingTerminal using the
   same padding/gap constants. */
    .workspace.tile-horizontal,
    .workspace.tile-vertical {
        display: grid;
        gap: 12px;
        padding: 12px;
    }

    .workspace.tile-horizontal {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr;
    }

    .workspace.tile-vertical {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr 1fr;
    }

    .app-window {
        user-select: none;
        display: flex;
        position: fixed;
        flex-direction: row;
        border: 1px solid var(--border-level-1);
        box-shadow: 0 0 20px -1px rgba(0, 0, 0, 0.7);
        border-radius: var(--radius-level-1);
        overflow: hidden;
        transform-origin: 50% 100%;
        transition:
            opacity 180ms ease,
            transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .app-window.is-maximized {
        border-radius: 0;
    }

    .app-window.is-hidden {
        opacity: 0;
        pointer-events: none;
    }

    .app-window.is-minimized {
        transform: translateY(220px) scale(0.15);
    }

    .app-window .resize-handle {
        position: absolute;
        z-index: 3;
    }

    .resize-n,
    .resize-s {
        left: 10px;
        right: 10px;
        height: 8px;
    }

    .resize-n {
        top: -4px;
        cursor: ns-resize;
    }

    .resize-s {
        bottom: -4px;
        cursor: ns-resize;
    }

    .resize-e,
    .resize-w {
        top: 10px;
        bottom: 10px;
        width: 8px;
    }

    .resize-e {
        right: -4px;
        cursor: ew-resize;
    }

    .resize-w {
        left: -4px;
        cursor: ew-resize;
    }

    .resize-ne,
    .resize-nw,
    .resize-se,
    .resize-sw {
        width: 12px;
        height: 12px;
    }

    .resize-ne {
        top: -4px;
        right: -4px;
        cursor: nesw-resize;
    }

    .resize-nw {
        top: -4px;
        left: -4px;
        cursor: nwse-resize;
    }

    .resize-se {
        right: -4px;
        bottom: -4px;
        cursor: nwse-resize;
    }

    .resize-sw {
        left: -4px;
        bottom: -4px;
        cursor: nesw-resize;
    }

    .zoom-menu {
        position: fixed;
        z-index: 2000;
        min-width: 208px;
        padding: 4px;
        border-radius: 8px;
        background: var(--bg-modal);
        border: 1px solid var(--border-level-2);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .zoom-menu-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        width: 100%;
        padding: 6px 10px;
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
    }

    .zoom-menu-item:hover:not(:disabled) {
        background: var(--color-selected);
    }

    .zoom-menu-item:disabled {
        opacity: 0.4;
        cursor: default;
    }

    .zoom-check {
        font-size: 0.8em;
        color: var(--font-color-accent);
    }

    .zoom-menu-separator {
        height: 1px;
        margin: 3px 6px;
        background: var(--border-separator);
    }

    /* .app-window .draggable {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50px;
    cursor: move;
    z-index: 10;
} */

    /* TODO: try this without pseudoelement using outline */
    .app-window::before {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        box-shadow: 0 0 1px white inset;
        border-radius: inherit;
        z-index: 2;
        pointer-events: none;
    }

    #sidebar {
        width: var(--sidebar-width);
        /* black: #272329; white: #544F57; */
        background: rgba(50, 46, 52, 0.7);
        backdrop-filter: blur(10px);
        padding: 5px;
        border-right: 2px solid var(--border-level-1);
        display: flex;
        flex-direction: column;
    }

    .sidebar-header {
        display: flex;
        flex-direction: column;
        cursor: grab;
    }

    .sidebar-header:active {
        cursor: grabbing;
    }

    .sidebar-header .window-actions-container {
        display: flex;
        padding: 15px 0 0 15px;
        margin-bottom: 20px;
    }

    .sidebar-header .window-actions {
        display: flex;
        gap: 8px;
    }

    .app-window .window-dot {
        border-radius: 50%;
        /* display: inline-block; */
        height: 12px;
        /* margin-right: 6px; */
        /* margin-top: 4px; */
        width: 12px;
        border: 0;
        padding: 0;
        flex-shrink: 0;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        color: rgba(0, 0, 0, 0);
    }

    .window-dot span {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        margin-top: -3px;
        margin-right: -1px;
    }

    .app-window .window-actions:hover .window-dot {
        /* background: white!important; */
        /* cursor: pointer; */
        color: rgba(0, 0, 0, 0.5);
    }

    .window-dot {
        background-color: var(--color-warning);
    }

    .window-dot:first-of-type {
        background-color: var(--color-danger);
    }

    .window-dot:last-of-type {
        background-color: var(--color-success);
    }

    #content-view {
        background: var(--bg-level-1);
        flex: 1;
        display: flex;
        min-width: 0;
    }

    /* #categories {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 10px;
} */

    :global(#categories img) {
        width: 100%;
    }

    :global(#categories .icon-wrapper) {
        background: linear-gradient(#d3e3e9, #908f8c);
        width: 20px;
        height: 20px;
        border-radius: var(--radius-level-4);
        display: inline-flex;
        justify-content: center;
        align-items: center;
    }

    :global(#categories .icon-wrapper img) {
        height: 14px;
        width: 14px;
    }

    :global(#categories .icon-wrapper.github) {
        background: linear-gradient(#9c45a9, #3b1e68);
    }

    :global(#categories .icon-wrapper.github img) {
        filter: invert(100%);
        height: 18px;
        width: 18px;
    }

    :global(#categories .icon-wrapper.terminal) {
        background: linear-gradient(#2d9f6b, #1a5c3e);
        color: #e8eaed;
    }
</style>
