import themes from "$lib/data/themes";
import {describe, expect, it} from "vitest";
import {schemeForConfig} from "./colors";
import {starterStyles} from "./starter";

describe("schemeForConfig", () => {
    it("resolves colors from a named theme", () => {
        const {colors, isDark} = schemeForConfig("theme = Rose Pine\n");

        expect(colors.background).toBe(themes["Rose Pine"].background);
        expect(colors.foreground).toBe(themes["Rose Pine"].foreground);
        expect(colors.palette).toHaveLength(16);
        expect(isDark).toBe(true);
    });

    it("lets explicit config values override the named theme", () => {
        const {colors} = schemeForConfig(`theme = Rose Pine
background = #010203
palette = 0=#0a0b0c
`);

        expect(colors.background).toBe("#010203");
        expect(colors.palette[0]).toBe("#0a0b0c");
        expect(colors.palette[1]).toBe(themes["Rose Pine"].palette[1]);
    });

    it("resolves explicit-only configs", () => {
        const {colors, isDark} = schemeForConfig("background = #000000\nforeground = #ffffff\n");

        expect(colors.background).toBe("#000000");
        expect(colors.foreground).toBe("#ffffff");
        expect(isDark).toBe(true);
    });

    it("resolves every bundled starter style to a known theme", () => {
        for (const style of starterStyles) {
            expect(style.colors.background, style.id).toMatch(/^#/);
            expect(style.colors.palette, style.id).toHaveLength(16);
        }
    });
});
