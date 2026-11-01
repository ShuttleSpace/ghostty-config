export type WindowLayout = "none" | "horizontal" | "vertical";
export type WindowMenuOwner = "config" | "preview" | "editor";

interface AppState {
    title: string;
    // The config window is the main "app window" on the simulated desktop.
    // `open` = visible; `minimized` = hidden but still running (dock dot on);
    // closed = neither, so the dock icon acts as a launcher.
    configWindowOpen: boolean;
    configWindowMinimized: boolean;
    configWindowMaximized: boolean;
    // How the config + preview windows share the workspace, chosen from the
    // green-button menu: side-by-side, stacked, or free layout.
    windowLayout: WindowLayout;
    // Which window's green-button menu is open (only one at a time).
    windowMenuOwner: WindowMenuOwner | null;
    floatingTerminalRunning: boolean;
    floatingTerminalVisible: boolean;
    floatingTerminalMinimized: boolean;
    floatingTerminalRestoreRequested: boolean;
    // The CodeMirror config-file editor window launched from the dock.
    configEditorRunning: boolean;
    configEditorVisible: boolean;
    configEditorMinimized: boolean;
    configEditorRestoreRequested: boolean;
}

const app: AppState = $state({
    title: "Home",
    configWindowOpen: true,
    configWindowMinimized: false,
    configWindowMaximized: false,
    windowLayout: "none",
    windowMenuOwner: null,
    floatingTerminalRunning: false,
    floatingTerminalVisible: false,
    floatingTerminalMinimized: false,
    floatingTerminalRestoreRequested: false,
    configEditorRunning: false,
    configEditorVisible: false,
    configEditorMinimized: false,
    configEditorRestoreRequested: false
});

// Run state for the dock indicator: minimized still counts as running, closed doesn't.
export function configWindowRunning() {
    return app.configWindowOpen || app.configWindowMinimized;
}

// Tiling needs both windows actually on screen to split the workspace between them.
export function bothWindowsOpen() {
    return app.configWindowOpen && app.floatingTerminalRunning && app.floatingTerminalVisible;
}

// Dock indicator for the config-file editor window.
export function configEditorRunning() {
    return app.configEditorRunning;
}

export function openConfigEditor() {
    app.configEditorRunning = true;
    app.configEditorVisible = true;
    app.configEditorMinimized = false;
}

export function minimizeConfigEditor() {
    if (!app.configEditorRunning || app.configEditorMinimized) return;
    app.configEditorVisible = false;
    app.configEditorMinimized = true;
}

export function closeConfigEditor() {
    app.configEditorRunning = false;
    app.configEditorVisible = false;
    app.configEditorMinimized = false;
    app.configEditorRestoreRequested = false;
}

export function restoreConfigEditor() {
    if (!app.configEditorRunning || !app.configEditorMinimized) return;
    app.configEditorRestoreRequested = true;
    app.configEditorMinimized = false;
    app.configEditorVisible = true;
}

export function openConfigWindow() {
    app.configWindowOpen = true;
    app.configWindowMinimized = false;
}

export function minimizeConfigWindow() {
    app.configWindowOpen = false;
    app.configWindowMinimized = true;
    app.windowLayout = "none";
    app.windowMenuOwner = null;
}

export function closeConfigWindow() {
    app.configWindowOpen = false;
    app.configWindowMinimized = false;
    app.configWindowMaximized = false;
    app.windowLayout = "none";
    app.windowMenuOwner = null;
}

export function toggleConfigWindowMaximize() {
    if (!app.configWindowOpen) {
        openConfigWindow();
        app.configWindowMaximized = true;
        return;
    }
    app.configWindowMaximized = !app.configWindowMaximized;
}

export function openWindowMenu(owner: WindowMenuOwner) {
    app.windowMenuOwner = owner;
}

export function closeWindowMenu() {
    app.windowMenuOwner = null;
}

// Pick a tiling mode from the green-button menu. A full-screen config window
// can't also be a tiled one, so leave that state first.
export function setWindowLayout(layout: WindowLayout) {
    app.windowLayout = layout;
    if (layout !== "none") app.configWindowMaximized = false;
    app.windowMenuOwner = null;
}

export function restoreWindowLayout() {
    app.windowLayout = "none";
    app.windowMenuOwner = null;
}

export default app;
