import {describe, expect, it} from "vitest";
import enSettings from "./locales/en/settings.json";
import enUi from "./locales/en/ui.json";
import zhSettings from "./locales/zh-CN/settings.json";
import zhUi from "./locales/zh-CN/ui.json";

type Messages = Record<string, unknown>;

function flatten(
    object: Messages,
    prefix = "",
    out: Record<string, string> = {}
): Record<string, string> {
    for (const [key, value] of Object.entries(object)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "string") out[path] = value;
        else if (value && typeof value === "object") flatten(value as Messages, path, out);
    }
    return out;
}

function placeholders(value: string): string[] {
    return [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

const namespaces = [
    {name: "ui", en: flatten(enUi), zh: flatten(zhUi)},
    {name: "settings", en: flatten(enSettings), zh: flatten(zhSettings)}
];

describe("locale catalogs", () => {
    for (const {name, en, zh} of namespaces) {
        it(`${name}: zh-CN has exactly the same keys as en`, () => {
            expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort());
        });

        it(`${name}: every translation is non-empty`, () => {
            for (const [key, value] of Object.entries(zh)) {
                expect(value.trim(), key).not.toBe("");
            }
        });

        it(`${name}: placeholders match the source message`, () => {
            for (const [key, value] of Object.entries(en)) {
                expect(placeholders(zh[key]), key).toEqual(placeholders(value));
            }
        });

        it(`${name}: inline HTML tags match the source message`, () => {
            const tags = (value: string) =>
                [...value.matchAll(/<\/?[a-z]+[^>]*>/g)].map((match) => match[0]).sort();
            for (const [key, value] of Object.entries(en)) {
                expect(tags(zh[key]), key).toEqual(tags(value));
            }
        });
    }
});
