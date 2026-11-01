import {schemeForConfig} from "./colors";
import type {Style} from "./types";

/**
 * Bundled starter styles. These are deliberately hand-written (not generated) and reference
 * named themes, so they stay tiny and always match the synced theme catalog. Upstream community
 * styles live in the generated `$lib/data/styles` module instead.
 */
function starter(
    id: string,
    title: string,
    description: string,
    rawConfig: string,
    tags: string[]
): Style {
    const {colors, isDark} = schemeForConfig(rawConfig);
    return {
        id,
        title,
        description,
        rawConfig,
        colors,
        isDark,
        tags,
        source: "starter"
    };
}

export const starterStyles: Style[] = [
    starter(
        "rose-pine",
        "Rose Pine",
        "Soho vibes: muted rose, pine and foam with a soft translucent window.",
        `theme = Rose Pine
font-size = 14
background-opacity = 0.96
window-padding-x = 12
window-padding-y = 10
cursor-style = bar
cursor-style-blink = false
`,
        ["dark", "muted", "minimal"]
    ),
    starter(
        "catppuccin-mocha",
        "Catppuccin Mocha",
        "Warm pastel dark theme with generous padding and a bar cursor.",
        `theme = Catppuccin Mocha
font-size = 14
background-opacity = 0.94
window-padding-x = 12
window-padding-y = 10
cursor-style = bar
`,
        ["dark", "pastel", "colorful"]
    ),
    starter(
        "tokyonight",
        "TokyoNight",
        "Deep blue night theme with a compact, focused layout.",
        `theme = TokyoNight
font-size = 13
background-opacity = 0.92
window-padding-x = 10
window-padding-y = 8
cursor-style = block
`,
        ["dark", "cool", "colorful"]
    ),
    starter(
        "nord",
        "Nord",
        "Arctic blues and cool grays with balanced padding.",
        `theme = Nord
font-size = 14
window-padding-x = 10
window-padding-y = 8
cursor-style = block
cursor-style-blink = false
`,
        ["dark", "cool", "minimal"]
    ),
    starter(
        "gruvbox-dark",
        "Gruvbox Dark",
        "Retro warm palette with a chunky block cursor.",
        `theme = Gruvbox Dark
font-size = 14
background-opacity = 0.95
window-padding-x = 12
window-padding-y = 10
cursor-style = block
`,
        ["dark", "warm", "retro"]
    ),
    starter(
        "solarized-light",
        "Solarized Light",
        "Low-contrast light theme for bright rooms.",
        `theme = iTerm2 Solarized Light
font-size = 14
window-padding-x = 12
window-padding-y = 10
cursor-style = bar
`,
        ["light", "warm", "minimal"]
    ),
    starter(
        "dracula",
        "Dracula",
        "High-contrast purple night theme with a slim bar cursor.",
        `theme = Dracula
font-size = 14
background-opacity = 0.9
window-padding-x = 12
window-padding-y = 10
cursor-style = bar
`,
        ["dark", "high-contrast", "colorful"]
    ),
    starter(
        "kanagawa-wave",
        "Kanagawa Wave",
        "Ink-wash Japanese palette with a calm, spacious layout.",
        `theme = Kanagawa Wave
font-size = 14
background-opacity = 0.96
window-padding-x = 14
window-padding-y = 12
cursor-style = block
`,
        ["dark", "muted", "warm"]
    )
];
