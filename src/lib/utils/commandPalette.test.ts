import {describe, expect, it} from "vitest";
import {
    parseCommandPaletteEntry,
    serializeCommandPaletteEntry,
    validateCommandPaletteEntry
} from "./commandPalette";

describe("command palette entry", () => {
    it("parses title and action", () => {
        expect(parseCommandPaletteEntry("title:Reset Font Style, action:csi:0m")).toEqual({
            title: "Reset Font Style",
            action: "csi:0m",
            description: undefined
        });
    });

    it("parses title, description and action in any order", () => {
        expect(
            parseCommandPaletteEntry(
                "description:Causes a crash on the main thread., title:Crash, action:crash:main"
            )
        ).toEqual({
            title: "Crash",
            action: "crash:main",
            description: "Causes a crash on the main thread."
        });
    });

    it("keeps commas inside quoted values", () => {
        expect(
            parseCommandPaletteEntry("title:\"Focus Split: Right\", description:\"Right, if it exists.\", action:goto_split:right")
        ).toEqual({
            title: "Focus Split: Right",
            action: "goto_split:right",
            description: "Right, if it exists."
        });
    });

    it("returns null for clear and empty entries", () => {
        expect(parseCommandPaletteEntry("clear")).toBeNull();
        expect(parseCommandPaletteEntry("")).toBeNull();
        expect(parseCommandPaletteEntry("   ")).toBeNull();
    });

    it("round-trips a simple entry", () => {
        const entry = {title: "Reset Font Style", action: "csi:0m"};
        expect(parseCommandPaletteEntry(serializeCommandPaletteEntry(entry))).toEqual({
            ...entry,
            description: undefined
        });
    });

    it("quotes values that contain commas", () => {
        const entry = {
            title: "Focus Split: Right",
            action: "goto_split:right",
            description: "Right, if it exists."
        };
        const serialized = serializeCommandPaletteEntry(entry);
        expect(serialized).toContain("description:\"Right, if it exists.\"");
        expect(parseCommandPaletteEntry(serialized)).toEqual(entry);
    });

    it("round-trips escaped quotes", () => {
        const entry = {title: "Say \"hi\"", action: "text:hi"};
        expect(parseCommandPaletteEntry(serializeCommandPaletteEntry(entry))).toEqual({
            ...entry,
            description: undefined
        });
    });

    it("validates required fields", () => {
        expect(validateCommandPaletteEntry({title: "A", action: "csi:0m"})).toBe(true);
        expect(validateCommandPaletteEntry({title: "", action: "csi:0m"})).toBe(false);
        expect(validateCommandPaletteEntry({title: "A", action: "  "})).toBe(false);
    });
});
