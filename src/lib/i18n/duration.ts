import {t} from "$lib/i18n";
import type {DurationSegment} from "$lib/settings/codecs";

export function humanizeDurationLocalized(segments: DurationSegment[]): string {
    return segments
        .map((segment) => {
            const key = segment.value === 1
                    ? `ui.duration.units.${segment.unit.suffix}`
                    : `ui.duration.unitsPlural.${segment.unit.suffix}`;
            const fallback = segment.value === 1 ? segment.unit.label : segment.unit.plural;
            return `${segment.value} ${t(key, undefined, fallback)}`;
        })
        .join(", ");
}

const ERROR_PATTERNS: Array<{pattern: RegExp; key: string; names: string[]}> = [
    {pattern: /^Value is required$/, key: "ui.duration.errors.valueRequired", names: []},
    {
        pattern: /^Expected a number, got "(.*)"$/,
        key: "ui.duration.errors.expectedNumber",
        names: ["value"]
    },
    {pattern: /^Unknown unit "(.*)"$/, key: "ui.duration.errors.unknownUnit", names: ["unit"]},
    {pattern: /^Missing unit after number$/, key: "ui.duration.errors.missingUnit", names: []},
    {pattern: /^Duplicate unit "(.*)"$/, key: "ui.duration.errors.duplicateUnit", names: ["unit"]},
    {pattern: /^Enter a duration$/, key: "ui.duration.errors.enterDuration", names: []}
];

export function translateDurationError(error: string): string {
    for (const {pattern, key, names} of ERROR_PATTERNS) {
        const match = pattern.exec(error);
        if (!match) continue;

        const params: Record<string, string> = {};
        names.forEach((name, index) => {
            params[name] = match[index + 1];
        });
        return t(key, params, error);
    }
    return error;
}
