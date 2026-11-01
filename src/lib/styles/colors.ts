import themes from "$lib/data/themes";
import {isDark, type ColorScheme, type HexColor} from "$lib/utils/colors";
import {parse} from "$lib/utils/parse";

type ColorKey =
    | "background"
    | "foreground"
    | "cursorColor"
    | "cursorText"
    | "selectionBackground"
    | "selectionForeground";

/**
 * Resolve the colors a style would render with. A style can either:
 * - reference a named theme (`theme = Rose Pine`) and add overrides, or
 * - carry explicit colors (the shape ghostty.style community configs use).
 *
 * Precedence mirrors the app's theme layering: explicit config value > named theme > fallback.
 * Only used for card previews; applying still goes through `parse`/`load`.
 */
export function schemeForConfig(rawConfig: string): {colors: ColorScheme; isDark: boolean} {
    const parsed = parse(rawConfig);
    const themeName = typeof parsed.theme === "string" ? parsed.theme : "";
    const base = themeName ? (themes as Record<string, ColorScheme>)[themeName] : undefined;

    const pick = (key: ColorKey): HexColor | undefined => {
        const override = parsed[key];
        // `parse` widens values to string; ColorScheme expects the `#${string}` brand.
        if (typeof override === "string" && override) return override as HexColor;
        return base?.[key];
    };

    const palette: HexColor[] = [];
    for (let index = 0; index < 16; index++) {
        const override = parsed.palette[index];
        const color = override || base?.palette[index] || undefined;
        // Fill gaps so the swatch strip always has 16 contiguous slots.
        palette.push(color ?? (index === 0 ? "#000000" : palette[index - 1]));
    }

    const colors: ColorScheme = {
        palette,
        background: pick("background"),
        foreground: pick("foreground"),
        cursorColor: pick("cursorColor"),
        cursorText: pick("cursorText"),
        selectionBackground: pick("selectionBackground"),
        selectionForeground: pick("selectionForeground")
    };

    const background = colors.background ?? palette[0];
    return {colors, isDark: isDark(background)};
}
