<div align="center">
  <a href="https://ghostty.zerebos.com"><img src="./src/lib/images/icon.webp" height="128" alt="Ghostty Config"></a>
  <h1 align="center" style="border:0;">Ghostty Config — Desktop Edition</h1>
  <p align="center">A beautiful intuitive configuration generator for <a href="https://ghostty.org/" target="_blank">Ghostty</a> terminal, with a native desktop app.</p>

[![GitHub Stars](https://www.shieldcn.dev/github/stars/ShuttleSpace/ghostty-config.svg?variant=secondary&size=sm)](https://github.com/ShuttleSpace/ghostty-config/stargazers)
[![Desktop Build](https://www.shieldcn.dev/github/ci/ShuttleSpace/ghostty-config.svg?variant=secondary&size=sm)](https://github.com/ShuttleSpace/ghostty-config/actions)
[![Framework · Svelte](https://www.shieldcn.dev/badge/Framework-Svelte-FF3E00.svg?logo=svelte&variant=branded&size=sm)](https://svelte.dev)
[![Hosting · Cloudflare Workers](https://www.shieldcn.dev/badge/Hosting-Cloudflare_Workers-F38020.svg?logo=cloudflare&variant=branded&size=sm)](https://ghostty.zerebos.com)

  <img src="https://github.com/user-attachments/assets/b0937e12-d7ef-4bd1-a007-e468da2f7dfc" alt="Preview of the terminal colorizer">
</div>

## Overview

> [!NOTE]
> This tool is still under active development. Features may change and not everything on the roadmap is implemented yet. Feedback, ideas, and bug reports are welcome via the [GitHub issue tracker](https://github.com/ShuttleSpace/ghostty-config/issues).

Ghostty Config is a beautiful configuration generator designed to make customizing your [Ghostty](https://ghostty.org/) terminal effortless. Rather than manually editing text files and worrying about formatting and syntax, it lets you visually adjust settings, preview changes in real time, and export a ready-to-use config. It runs both as a **web app** and as a **native desktop app**.

Under the hood, every setting is driven by a typed schema derived directly from Ghostty's own config specification. The tool tracks only the values that differ from Ghostty's defaults, so the exported config stays minimal and easy to read. Settings are organized into categories that derive from Ghostty's config, and each one carries inline documentation, platform restrictions, and version metadata sourced from the schema.

The project is built with [Svelte](https://svelte.dev) + [TypeScript](https://www.typescriptlang.org/) via [Bun](https://bun.sh), and packaged for the desktop with [Tauri](https://v2.tauri.app/). The original web app is hosted at [ghostty.zerebos.com](https://ghostty.zerebos.com).

## Origin & Attribution

This repository is a **desktop edition** of [zerebos/ghostty-config](https://github.com/zerebos/ghostty-config) by [Zerebos](https://github.com/zerebos), used and extended under the [Apache-2.0 License](./LICENSE). The upstream project is the web-based Ghostty config generator that this work is built on; its typed settings schema, theme catalog, and live-preview surfaces are the foundation everything below extends.

### From the original project (`zerebos/ghostty-config`)

- **Schema-driven settings editor** — every Ghostty setting is described by a typed registry derived from Ghostty's own config specification, with inline documentation, platform badges, and minimum-version metadata.
- **Rich, purpose-built inputs** — sliders, linked numbers, color pickers, duration fields, and repeatable list editors instead of raw text.
- **Built-in themes** — hundreds of Ghostty color themes, automatically kept in sync with upstream [iTerm2 Color Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes/).
- **Font playground** — experiment with any installed or custom font and see the result live.
- **Live previews** — instant visual demos for cursors, selections, app icons, and color palettes.
- **Interactive terminal preview** — a DOM-based terminal you can type in that re-themes in place as you edit, without tearing down existing output.
- **Keybinding builder** — validated trigger/action editor with sequence, prefix, and chained-action support.
- **Import & export** — paste, upload, copy, or download configs; only settings that differ from defaults are emitted.
- **Config sharing** — shareable URLs, with clipboard fallback for large configs.
- **Native-feeling navigation** — sidebar search, per-setting reset, and inline help for every setting.
- **Web stack** — Svelte 5 + TypeScript, built with Bun, deployed via Cloudflare Workers.

### Added by this project (desktop edition)

- **Native desktop app (Tauri 2)** — the same Svelte UI wrapped in a Rust shell, shipping `.app`/`.dmg` (macOS), `.deb`/`.AppImage` (Linux), and `.msi`/`.exe` (Windows) bundles.
- **Direct config-file sync** — reads your existing Ghostty config on startup and writes changes straight back to `~/.config/ghostty/config` (or `~/Library/Application Support/com.mitchellh.ghostty/config` on macOS), using native open/save dialogs instead of downloads.
- **Simulated macOS desktop shell** — a dock, draggable/resizable windows, and non-overlapping window management with fill, split-horizontally, and split-vertically tiling.
- **Built-in config editor** — a CodeMirror 6 window launched from the dock to view and edit the raw config file, with Save, Reload from disk, and Apply-to-app.
- **Complete top-level key coverage** — every top-level Ghostty config key is configurable from the GUI, including the newer clipboard, window, terminal, and GTK keys.
- **Command palette builder** — a guided title/action/description editor for `command-palette-entry`, replacing hand-written syntax.
- **Launch from Ghostty** — a ready-to-paste `action = "run"` keybind snippet in Import & Export that opens the app from inside Ghostty.
- **Unified color scheme** — one semantic token set drives every control, selection, scrollbar, and badge color across the app.
- **Styles gallery** — starter presets plus community styles synced from [ghostty.style](https://ghostty.style), applied through the import pipeline.
- **Internationalization** — English and Simplified Chinese, with a persisted sidebar language selector.
- **System integration** — installed-font autocomplete from `ghostty +list-fonts`, environment-variable name autocomplete, and native clipboard access.
- **Three-platform desktop CI** — automated macOS, Linux, and Windows builds (`.github/workflows/build-desktop.yml`).

## Features

- **Interactive settings editor:** Tweak fonts, colors, cursor styles, transparency, blur, and much more across organized, categorized setting pages.
- **Rich setting inputs:** Purpose-built controls for every setting type, including sliders, linked number inputs, color pickers, and duration fields.
- **Repeatable settings:** Manage multi-value settings like font features with a dedicated list editor.
- **Built-in themes:** Hundreds of Ghostty color themes, automatically kept in sync with upstream.
- **Styles gallery:** Apply complete config presets from a curated starter set plus community styles synced from [ghostty.style](https://ghostty.style).
- **Font playground:** Experiment with JetBrains Mono, Nerd Fonts, or any custom font and see the result live.
- **Live previews:** Instant visual demos for cursors, text selections, app icons, and color palettes as you edit.
- **Interactive terminal preview:** A DOM-based terminal you can type in that re-themes live as you tweak settings, so existing output (colors, prompt, `ls` results) updates in place without being torn down.
- **Keybinding builder:** Build and validate keybindings with an interactive trigger/action editor, including sequence, prefix, and chained-action support.
- **Import & export:** Paste, upload, copy, or download configs; only settings that differ from defaults are included in the output.
- **Config sharing:** Share configs with others via a shareable URL (falls back to clipboard copy for large configs).
- **Help info:** Detailed documentation shown inline for every individual setting.
- **Indicators:** Per-setting badges showing required platform (macOS, Linux, GTK) and minimum Ghostty version.
- **Sidebar search:** Instantly browse and jump to any setting, mirroring macOS native preferences UI.
- **Reset to defaults:** Restore any individual setting to its default value at any time.

## Tech Stack

- [Bun](https://bun.sh/): A modern JavaScript and TypeScript runtime
- [Svelte](https://svelte.dev): UI framework for fast, reactive interfaces
- [TypeScript](https://www.typescriptlang.org/): Strong typing for maintainable code
- [Vite](https://vite.dev/): Lightning‑fast bundler and dev server
- [Cloudflare](https://developers.cloudflare.com/workers/): CI/CD for automated deployment
- [Tauri](https://v2.tauri.app/): Rust-powered desktop runtime for the native app

## Installation (Local Development)

Simply clone the repo and run locally:

```bash
git clone https://github.com/ShuttleSpace/ghostty-config.git
cd ghostty-config
bun install
bun run dev
```

To follow the upstream web-only project instead, clone [zerebos/ghostty-config](https://github.com/zerebos/ghostty-config).

Then open `http://localhost:5173` in your browser when prompted.

### Desktop app (Tauri)

The same codebase also ships as a native desktop app via [Tauri](https://v2.tauri.app/). The desktop build adds platform capabilities the web build cannot offer:

- **Startup config load** — the app opens with your existing Ghostty config already reflected in the UI.
- **Save syncs directly** to Ghostty's config file (`~/.config/ghostty/config`, or `~/Library/Application Support/com.mitchellh.ghostty/config` on macOS), with a backup-free write and no download step.
- **Native import/export dialogs** and native clipboard access.
- **System font list** — the Font Playground and `font-family` settings autocomplete from `ghostty +list-fonts`, so you pick installed fonts instead of typing names.
- **Environment variables** — the `env` setting autocompletes existing variable names (`KEY=` prefixes only; values are never offered, so secrets aren't written into a config).

The web build keeps the original clipboard/link/download behavior and simply hides the desktop-only sections.

Prerequisites:

- [Rust](https://www.rust-lang.org/) toolchain (`rustup`)
- System WebView (WebKit on macOS, `webkit2gtk` on Linux, WebView2 on Windows)

Run the desktop app in development:

```bash
bun run tauri:dev      # builds the frontend, then launches the native window
```

Build a distributable bundle (`.app` / `.dmg` on macOS, `.AppImage` / `.deb` on Linux, `.msi` on Windows):

```bash
bun run tauri:build
```

`bun run tauri` forwards any command to the Tauri CLI (e.g. `bun run tauri icon <path>` to regenerate icons).

Other useful commands:

```bash
bun run build    # production build (output under build/)
bun run preview  # serve the production build locally
bun run check    # Svelte + TypeScript type checking
bun run lint     # ESLint
bun run test     # Vitest unit tests
```

### Syncing styles

The Styles page ships bundled starter presets plus community styles synced from
[ghostty.style](https://ghostty.style). The generated catalog lives in
`src/lib/data/styles.ts` and is refreshed weekly by `.github/workflows/styles.yml`.
Run it locally with:

```bash
bun run sync:styles
```

Only community submissions are imported by default (the site's seed rows are the same iTerm2
themes already in the built-in theme list). Set `GHOSTTY_STYLE_API` to point at a mirror, or
pass `--include-seed` / `--featured` to change the selection. If the API is unreachable the
script leaves `styles.ts` untouched (the workflow uses `--allow-stale`), so a failed sync never
wipes the catalog; `--from-fixture=PATH` regenerates from a saved API response instead. Remote
configs are sanitized: options that can execute commands or pull in other files (`command`,
`initial-command`, `config-file`, `env`, `shell-integration`, `keybind`, …) are stripped before
a style can be applied.

### Internationalization

The UI ships in English and Simplified Chinese. The language selector lives at the bottom of
the sidebar; the choice is persisted in `localStorage` and defaults to the browser language.

- `src/lib/i18n/locales/{locale}/ui.json` — hand-written interface strings.
- `src/lib/i18n/locales/{locale}/settings.json` — setting names, descriptions, notes and
  navigation labels, generated from `registry.ts` + `navigation.ts`.
- `src/lib/i18n/index.svelte.ts` — the rune-based `t()` runtime.

Settings are the single source of truth in `registry.ts` / `navigation.ts`. After changing
either file, regenerate the English source and translate any new keys:

```bash
bun run i18n:sync   # regenerate locales/en/settings.json
bun run i18n:check  # x18n: missing keys, placeholders, coverage
bun run i18n:ui     # browse and edit every key in the browser
```

`bun run i18n:check` and `bun run i18n:sync:check` run in CI. To add a locale, create
`locales/<code>/ui.json` and `locales/<code>/settings.json`, then add it to `localeOptions`
in `src/lib/i18n/index.svelte.ts`.

## Deployment

The web build is deployed via Cloudflare Workers, which automatically deploys to [ghostty.zerebos.com](https://ghostty.zerebos.com) on every push to the `main` branch. If you want to self-host, the static files will be available under `build/` after following the steps above to build.

### Desktop builds

Every push to `main`, pull request against `main`, and manual dispatch runs [`.github/workflows/build-desktop.yml`](./.github/workflows/build-desktop.yml), which builds the Tauri bundle for **macOS** (universal `.app`/`.dmg`), **Linux** (`.deb` + `.AppImage`), and **Windows** (`.msi` + installer) and uploads them as workflow artifacts. Release-grade signing/notarization for macOS is a separate, manual step.

## Roadmap

### Completed

- [x] Custom settings support
- [x] Terminal preview
- [x] Font playground
- [x] Import & export
- [x] Basic keybind settings
- [x] Editable color pickers
- [x] Update for Ghostty 1.1
- [x] Update for Ghostty 1.2
- [x] Update for Ghostty 1.3
- [x] Update for Ghostty 1.4-nightly
- [x] Icon customization
- [x] Keybind builder and validation
- [x] In-app help documentation
- [x] Resetting individual settings
- [x] Sidebar search like native
- [x] Platform indicators
- [x] Version indicators
- [x] Shareable URLs
- [x] Multi-entry setting support (settings like `font-feature` that repeat in the config)
- [x] Custom schema-driven setting inputs (sliders, color pickers, durations, and more)
- [x] Automatic theme sync from upstream [iTerm2 Color Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes/)
- [x] Styles gallery with starter presets and community styles synced from [ghostty.style](https://ghostty.style)
- [x] Unified typed settings registry
- [x] Interactive terminal preview with live re-theming
- [x] Unit tests for import/export flows
- [x] Desktop app (Tauri) with direct Ghostty config file sync and native import/export dialogs
- [x] Desktop platform capabilities: system font list, environment variables, native clipboard, and loading your existing config on startup
- [x] Desktop build CI for macOS, Linux, and Windows ([build-desktop.yml](./.github/workflows/build-desktop.yml))

**Near-term**

- [x] Full Ghostty config key coverage (all top-level config keys configurable via GUI)
- [x] Launch from Ghostty via keybind (`action = "run"`) — ready-to-paste snippet in Import & Export
- [x] Command palette builder (guided UI for `command-palette-entry` settings)
- [x] Unified color scheme across the app

**Long-term**

- [ ] Component testing

## Contributing

See the [CONTRIBUTING](./CONTRIBUTING.md) documentation for more info.

## License

Licensed under the [Apache‑2.0 License](https://github.com/zerebos/ghostty-config/blob/main/LICENSE).

## Star History

If you find Ghostty Config useful, please consider starring the repo to help others discover it!

<p align="center">
  <a href="https://star-history.com/#ShuttleSpace/ghostty-config&Date">
   <picture>
     <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=ShuttleSpace/ghostty-config&type=Date&theme=dark" />
     <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=ShuttleSpace/ghostty-config&type=Date" />
     <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=ShuttleSpace/ghostty-config&type=Date" />
   </picture>
  </a>
</p>
