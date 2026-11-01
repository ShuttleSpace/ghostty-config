import {afterEach, describe, expect, it} from "vitest";
import {i18n, setLocale, t, tSetting} from "./index.svelte";

describe("i18n runtime", () => {
    afterEach(() => setLocale("en"));

    it("starts in the source locale", () => {
        setLocale("en");
        expect(i18n.locale).toBe("en");
        expect(t("ui.nav.search")).toBe("Search");
    });

    it("switches every translation to the selected locale", () => {
        setLocale("zh-CN");
        expect(i18n.locale).toBe("zh-CN");
        expect(t("ui.nav.search")).toBe("搜索");
        expect(t("ui.nav.language")).toBe("语言");
    });

    it("translates registry-backed setting metadata", () => {
        expect(tSetting("fontSize", "name")).toBe("Base font size");
        setLocale("zh-CN");
        expect(tSetting("fontSize", "name")).toBe("基础字体大小");
        expect(tSetting("fontSize", "description")).toContain("磅");
    });

    it("interpolates named parameters", () => {
        setLocale("zh-CN");
        expect(t("ui.item.addedIn", {version: "1.2.0"})).toBe("在 Ghostty v1.2.0 中加入");
    });

    it("falls back to the key (or an explicit fallback) for unknown keys", () => {
        expect(t("ui.does.not.exist")).toBe("ui.does.not.exist");
        expect(t("ui.does.not.exist", undefined, "fallback")).toBe("fallback");
        expect(tSetting("doesNotExist", "name", "Fallback name")).toBe("Fallback name");
    });

    it("ignores unknown locales", () => {
        setLocale("en");
        setLocale("xx-YY");
        expect(i18n.locale).toBe("en");
    });
});
