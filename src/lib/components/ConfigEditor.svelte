<script lang="ts">
    import {onMount, untrack} from "svelte";
    import type {EditorView} from "codemirror";
    import app, {
        closeConfigEditor,
        closeWindowMenu,
        minimizeConfigEditor,
        openWindowMenu
    } from "$lib/stores/state.svelte";
    import {isTauri} from "$lib/platform";
    import {readGhosttyConfig, writeGhosttyConfig} from "$lib/platform/ghostty";
    import {success, error as toastError} from "$lib/stores/toasts.svelte";
    import {load, diff} from "$lib/stores/config.svelte";
    import {parse, serialize} from "$lib/utils/parse";
    import {t} from "$lib/i18n";

    const DEFAULT_WIDTH = 720;
    const DEFAULT_HEIGHT = 480;
    const MIN_WIDTH = 420;
    const MIN_HEIGHT = 240;

    type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

    let x = $state(0);
    let y = $state(0);
    let width = $state(DEFAULT_WIDTH);
    let height = $state(DEFAULT_HEIGHT);
    let dragging = $state(false);
    let resizing = $state(false);
    let resizeDir: ResizeDir | null = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let resizeStartX = 0;
    let resizeStartY = 0;
    let startW = DEFAULT_WIDTH;
    let startH = DEFAULT_HEIGHT;
    let startL = 0;
    let startT = 0;
    let maximized = $state(false);
    let restoreGeometry: {x: number; y: number; width: number; height: number} | null = null;
    let windowElement = $state<HTMLDivElement | null>(null);
    let editorEl = $state<HTMLDivElement | null>(null);
    let editorView: EditorView | null = null;
    let savedText = "";
    let dirty = $state(false);
    let loading = $state(false);
    let zoomButton = $state<HTMLButtonElement | null>(null);
    let menuPosition = $state({left: 0, top: 0});

    // The workspace sits above the dock, so clamping to it keeps the editor off the dock.
    function getWorkspaceRect() {
        const el = document.getElementById("desktop-workspace");
        if (el) {
            const rect = el.getBoundingClientRect();
            return {left: rect.left, top: rect.top, width: rect.width, height: rect.height};
        }
        return {left: 0, top: 0, width: window.innerWidth, height: window.innerHeight};
    }

    function setText(text: string) {
        if (!editorView) return;
        const current = editorView.state.doc.toString();
        if (current === text) return;
        editorView.dispatch({changes: {from: 0, to: current.length, insert: text}});
    }

    async function loadContent() {
        loading = true;
        try {
            let text = "";
            if (isTauri) {
                text = await readGhosttyConfig();
            }
 else {
                text = serialize(diff(), false);
            }
            setText(text);
            savedText = text;
            dirty = false;
        }
 catch {
            setText(`# ${t("ui.editor.noFile")}`);
            savedText = "";
            dirty = false;
        }
 finally {
            loading = false;
        }
    }

    async function save() {
        if (!isTauri) {
            toastError(t("ui.editor.desktopOnly"));
            return;
        }
        const text = editorView ? editorView.state.doc.toString() : "";
        try {
            await writeGhosttyConfig(text);
            savedText = text;
            dirty = false;
            success(t("ui.editor.saved"));
        }
 catch {
            toastError(t("ui.editor.desktopOnly"));
        }
    }

    async function reload() {
        if (!isTauri) {
            toastError(t("ui.editor.desktopOnly"));
            return;
        }
        await loadContent();
    }

    function applyToApp() {
        const text = editorView ? editorView.state.doc.toString() : "";
        try {
            load(parse(text));
            success(t("ui.editor.applied"));
        }
 catch (err) {
            console.error(err); // eslint-disable-line no-console
            toastError("Could not parse the config text");
        }
    }

    // Build the editor once the window is mounted; tear it down when it closes.
    $effect(() => {
        if (!app.configEditorRunning || !editorEl) return;
        let view: EditorView | null = null;
        let cancelled = false;

        void (async () => {
            const [{EditorView, basicSetup}, {oneDark}, {StreamLanguage, HighlightStyle, syntaxHighlighting}, {tags}] = await Promise.all([
                import("codemirror"),
                import("@codemirror/theme-one-dark"),
                import("@codemirror/language"),
                import("@lezer/highlight")
            ]);
            if (cancelled || !editorEl) return;

            const ghosttyLang = StreamLanguage.define({
                token(stream) {
                    if (stream.eatSpace()) return null;
                    if (stream.match(/^#[^\n]*/)) return "comment";
                    if (stream.match(/^[a-z-]+/)) {
                        stream.skipToEnd();
                        return "keyword";
                    }
                    stream.next();
                    return null;
                }
            });

            const highlight = HighlightStyle.define([
                {tag: tags.comment, color: "#7f848e", fontStyle: "italic"},
                {tag: tags.keyword, color: "#56a4f5"}
            ]);

            view = new EditorView({
                doc: "",
                parent: editorEl,
                extensions: [
                    basicSetup,
                    oneDark,
                    ghosttyLang,
                    syntaxHighlighting(highlight),
                    EditorView.updateListener.of((u) => {
                        if (u.docChanged) {
                            dirty = u.state.doc.toString() !== savedText;
                        }
                    })
                ]
            });
            editorView = view;
            await loadContent();
        })();

        return () => {
            cancelled = true;
            view?.destroy();
            editorView = null;
        };
    });

    // Fill the workspace when maximized.
    $effect(() => {
        const visible = app.configEditorRunning && app.configEditorVisible;
        const max = maximized;
        if (!visible) return;
        untrack(() => {
            if (max) {
                const ws = getWorkspaceRect();
                x = ws.left;
                y = ws.top;
                width = ws.width;
                height = ws.height;
            }
        });
    });

    // Keep the window inside the workspace on viewport resize.
    $effect(() => {
        if (!app.configEditorRunning) return;
        function onResize() {
            const ws = getWorkspaceRect();
            if (maximized) {
                x = ws.left;
                y = ws.top;
                width = ws.width;
                height = ws.height;
                return;
            }
            width = Math.min(width, ws.width);
            height = Math.min(height, ws.height);
            x = Math.max(ws.left, Math.min(x, ws.left + ws.width - width));
            y = Math.max(ws.top, Math.min(y, ws.top + ws.height - height));
        }
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    });

    function startDrag(e: MouseEvent) {
        if (resizing || !app.configEditorVisible) return;
        closeWindowMenu();
        dragging = true;
        dragOffsetX = e.clientX - x;
        dragOffsetY = e.clientY - y;
    }

    function startResize(e: MouseEvent, dir: ResizeDir) {
        if (!app.configEditorVisible) return;
        e.preventDefault();
        e.stopPropagation();
        closeWindowMenu();
        if (maximized) {
            maximized = false;
            if (restoreGeometry) {
                x = restoreGeometry.x;
                y = restoreGeometry.y;
                width = restoreGeometry.width;
                height = restoreGeometry.height;
            }
            restoreGeometry = null;
        }
        resizing = true;
        resizeDir = dir;
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;
        startW = width;
        startH = height;
        startL = x;
        startT = y;
    }

    $effect(() => {
        if (!dragging && !resizing) return;

        function onMove(e: MouseEvent) {
            const ws = getWorkspaceRect();

            if (dragging) {
                x = Math.max(ws.left, Math.min(ws.left + ws.width - width, e.clientX - dragOffsetX));
                y = Math.max(ws.top, Math.min(ws.top + ws.height - height, e.clientY - dragOffsetY));
                return;
            }

            if (!resizing || !resizeDir) return;

            const dx = e.clientX - resizeStartX;
            const dy = e.clientY - resizeStartY;
            let nx = startL;
            let ny = startT;
            let nw = startW;
            let nh = startH;

            if (resizeDir.includes("e")) nw = startW + dx;
            if (resizeDir.includes("s")) nh = startH + dy;
            if (resizeDir.includes("w")) {
                nw = startW - dx;
                nx = startL + dx;
            }
            if (resizeDir.includes("n")) {
                nh = startH - dy;
                ny = startT + dy;
            }

            if (resizeDir.includes("w") && nw < MIN_WIDTH) {
                nx = startL + (startW - MIN_WIDTH);
                nw = MIN_WIDTH;
            }
 else {
                nw = Math.max(MIN_WIDTH, nw);
            }
            if (resizeDir.includes("n") && nh < MIN_HEIGHT) {
                ny = startT + (startH - MIN_HEIGHT);
                nh = MIN_HEIGHT;
            }
 else {
                nh = Math.max(MIN_HEIGHT, nh);
            }
            if (nx < ws.left) {
                if (resizeDir.includes("w")) nw += nx - ws.left;
                nx = ws.left;
            }
            if (ny < ws.top) {
                if (resizeDir.includes("n")) nh += ny - ws.top;
                ny = ws.top;
            }
            nw = Math.max(MIN_WIDTH, Math.min(nw, ws.left + ws.width - nx));
            nh = Math.max(MIN_HEIGHT, Math.min(nh, ws.top + ws.height - ny));

            x = nx;
            y = ny;
            width = nw;
            height = nh;
        }

        function onUp() {
            dragging = false;
            resizing = false;
            resizeDir = null;
        }

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    });

    function toggleMenu(event: MouseEvent) {
        event.stopPropagation();
        if (app.windowMenuOwner === "editor") {
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
        openWindowMenu("editor");
    }

    function fillEditor() {
        closeWindowMenu();
        if (!maximized) {
            restoreGeometry = {x, y, width, height};
        }
        maximized = true;
    }

    function restoreEditor() {
        closeWindowMenu();
        if (maximized && restoreGeometry) {
            x = restoreGeometry.x;
            y = restoreGeometry.y;
            width = restoreGeometry.width;
            height = restoreGeometry.height;
        }
        maximized = false;
        restoreGeometry = null;
    }

    onMount(() => {
        const ws = getWorkspaceRect();
        width = DEFAULT_WIDTH;
        height = DEFAULT_HEIGHT;
        x = ws.left + Math.max(0, (ws.width - width) / 2);
        y = ws.top + Math.max(0, (ws.height - height) / 3);
    });
</script>

{#if app.configEditorRunning}
    <div
        bind:this={windowElement}
        class="editor-window"
        class:minimized={!app.configEditorVisible}
        style:left={`${x}px`}
        style:top={`${y}px`}
        style:width={`${width}px`}
        style:height={`${height}px`}
        style:cursor={dragging ? "grabbing" : "default"}
        role="dialog"
        aria-label={t("ui.editor.title")}
        aria-hidden={!app.configEditorVisible}
    >
        <div class="titlebar" role="presentation" onmousedown={startDrag}>
            <div class="traffic-lights" role="presentation" onmousedown={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    class="dot dot-red"
                    onclick={closeConfigEditor}
                    aria-label={t("ui.window.close")}
                    title={t("ui.window.close")}
                >
                    <span class="dot-symbol">&times;</span>
                </button>
                <button
                    type="button"
                    class="dot dot-yellow"
                    onclick={minimizeConfigEditor}
                    aria-label={t("ui.window.minimize")}
                    title={t("ui.window.minimize")}
                >
                    <span class="dot-symbol">&ndash;</span>
                </button>
                <button
                    type="button"
                    class="dot dot-green"
                    bind:this={zoomButton}
                    onclick={toggleMenu}
                    aria-label={t("ui.window.layout")}
                    aria-haspopup="menu"
                    aria-expanded={app.windowMenuOwner === "editor"}
                    title={t("ui.window.layout")}
                >
                    <span class="dot-symbol">{maximized ? "−" : "+"}</span>
                </button>
            </div>
            <span class="window-title">{t("ui.editor.title")}{#if dirty}<span class="title-dirty"> •</span>{/if}</span>
            <div class="titlebar-end"></div>
        </div>

        <div class="toolbar">
            <button type="button" class="tool-btn" onclick={save} disabled={!isTauri || !dirty}>
                {t("ui.editor.save")}
            </button>
            <button type="button" class="tool-btn" onclick={reload} disabled={!isTauri}>
                {t("ui.editor.reload")}
            </button>
            <button type="button" class="tool-btn" onclick={applyToApp}>
                {t("ui.editor.applyToApp")}
            </button>
            {#if dirty}
                <span class="dirty-badge" title={t("ui.editor.dirty")}>{t("ui.editor.dirty")}</span>
            {/if}
            {#if !isTauri}
                <span class="web-note">{t("ui.editor.readOnlyWeb")}</span>
            {/if}
        </div>

        <div class="editor-body">
            <div class="cm-host" bind:this={editorEl} aria-busy={loading}></div>
        </div>

        <div class="resize-handle resize-n" onmousedown={(e) => startResize(e, "n")} aria-hidden="true"></div>
        <div class="resize-handle resize-s" onmousedown={(e) => startResize(e, "s")} aria-hidden="true"></div>
        <div class="resize-handle resize-e" onmousedown={(e) => startResize(e, "e")} aria-hidden="true"></div>
        <div class="resize-handle resize-w" onmousedown={(e) => startResize(e, "w")} aria-hidden="true"></div>
        <div class="resize-handle resize-ne" onmousedown={(e) => startResize(e, "ne")} aria-hidden="true"></div>
        <div class="resize-handle resize-nw" onmousedown={(e) => startResize(e, "nw")} aria-hidden="true"></div>
        <div class="resize-handle resize-se" onmousedown={(e) => startResize(e, "se")} aria-hidden="true"></div>
        <div class="resize-handle resize-sw" onmousedown={(e) => startResize(e, "sw")} aria-hidden="true"></div>

        {#if app.windowMenuOwner === "editor"}
            <div
                class="zoom-menu"
                role="menu"
                aria-label={t("ui.window.layout")}
                style:left={`${menuPosition.left}px`}
                style:top={`${menuPosition.top}px`}
            >
                <button type="button" role="menuitem" class="zoom-menu-item" onclick={fillEditor}>
                    <span>{t("ui.window.fill")}</span>
                    {#if maximized}<span class="zoom-check">✓</span>{/if}
                </button>
                <button
                    type="button"
                    role="menuitem"
                    class="zoom-menu-item"
                    onclick={restoreEditor}
                    disabled={!maximized}
                >
                    <span>{t("ui.window.restore")}</span>
                </button>
            </div>
        {/if}
    </div>
{/if}

<style>
    .editor-window {
        position: fixed;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--border-level-1);
        box-shadow: 0 0 20px -1px rgba(0, 0, 0, 0.7);
        background: var(--bg-level-1);
        pointer-events: all;
        transform-origin: center center;
        transition:
            opacity 200ms ease,
            transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .editor-window.minimized {
        opacity: 0;
        pointer-events: none;
        transform: translateY(220px) scale(0.15);
    }

    .titlebar {
        height: 38px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        padding: 0 12px;
        border-bottom: 1px solid transparent;
        background: var(--bg-level-3);
        cursor: grab;
        user-select: none;
    }

    .titlebar:active {
        cursor: grabbing;
        border-bottom: 1px solid var(--border-level-1);
    }

    .traffic-lights {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
    }

    .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        padding: 0;
    }

    .dot-red {
        background: var(--color-traffic-red);
    }
    .dot-yellow {
        background: var(--color-traffic-yellow);
    }
    .dot-green {
        background: var(--color-traffic-green);
    }

    .dot-symbol {
        line-height: 1;
        color: rgba(0, 0, 0, 0);
        font-weight: 400;
        margin-top: -3px;
    }

    .traffic-lights:hover .dot-symbol {
        color: rgba(0, 0, 0, 0.6);
    }

    .window-title {
        flex: 1;
        text-align: center;
        font-weight: 700;
        color: rgba(235, 230, 238, 0.75);
        pointer-events: none;
    }

    .title-dirty {
        color: var(--color-warning);
    }

    .titlebar-end {
        width: 52px;
        flex-shrink: 0;
    }

    .toolbar {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        background: var(--bg-level-2);
        border-bottom: 1px solid var(--border-level-1);
    }

    .tool-btn {
        font-size: 0.78rem;
        padding: 4px 10px;
        border-radius: 6px;
        border: 1px solid var(--border-level-2);
        background: var(--bg-level-3);
        color: var(--font-color);
        cursor: pointer;
    }

    .tool-btn:hover:not(:disabled) {
        background: var(--bg-level-4);
    }

    .tool-btn:disabled {
        opacity: 0.4;
        cursor: default;
    }

    .dirty-badge {
        font-size: 0.72rem;
        color: var(--color-warning);
    }

    .web-note {
        font-size: 0.72rem;
        color: var(--font-color-muted);
        margin-left: auto;
    }

    .editor-body {
        flex: 1;
        display: flex;
        min-height: 0;
        overflow: hidden;
    }

    .cm-host {
        flex: 1;
        min-height: 0;
        overflow: hidden;
    }

    .cm-host :global(.cm-editor) {
        height: 100%;
    }

    .cm-host :global(.cm-scroller) {
        overflow: auto;
    }

    .resize-handle {
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
</style>
