import {t} from "$lib/i18n";

// parseKeybind() returns stable English diagnostics (tests assert on them), so
// localization happens at the display boundary instead of inside the parser.
const PATTERNS: Array<{pattern: RegExp; key: string; names: string[]}> = [
    {
        pattern: /^missing '=' between trigger and action$/,
        key: "ui.keybinds.errors.missingEqual",
        names: []
    },
    {
        pattern: /^trigger or action missing$/,
        key: "ui.keybinds.errors.missingTriggerOrAction",
        names: []
    },
    {pattern: /^invalid trigger format$/, key: "ui.keybinds.errors.invalidTrigger", names: []},
    {pattern: /^action missing$/, key: "ui.keybinds.errors.actionMissing", names: []},
    {pattern: /^missing action$/, key: "ui.keybinds.errors.missingAction", names: []},
    {
        pattern: /^global\/all keybinds cannot be sequences$/,
        key: "ui.keybinds.errors.globalSequence",
        names: []
    },
    {pattern: /^unknown action '(.*)'$/, key: "ui.keybinds.errors.unknownAction", names: ["name"]},
    {
        pattern: /^'(.*)' does not take arguments$/,
        key: "ui.keybinds.errors.noArguments",
        names: ["name"]
    },
    {
        pattern: /^'(.*)' requires arguments$/,
        key: "ui.keybinds.errors.requiresArguments",
        names: ["name"]
    },
    {
        pattern: /^'(.*)' requires text argument \(Zig string literal\)$/,
        key: "ui.keybinds.errors.requiresText",
        names: ["name"]
    },
    {
        pattern: /^'(.*)' requires a numeric argument$/,
        key: "ui.keybinds.errors.requiresNumber",
        names: ["name"]
    },
    {
        pattern: /^'(.*)' expects a number, got '(.*)'$/,
        key: "ui.keybinds.errors.expectsNumber",
        names: ["name", "value"]
    },
    {
        pattern: /^'(.*)' requires an integer argument$/,
        key: "ui.keybinds.errors.requiresInteger",
        names: ["name"]
    },
    {
        pattern: /^'(.*)' expects an integer, got '(.*)'$/,
        key: "ui.keybinds.errors.expectsInteger",
        names: ["name", "value"]
    },
    {
        pattern: /^'(.*)' requires a non-negative integer argument$/,
        key: "ui.keybinds.errors.requiresUnsigned",
        names: ["name"]
    },
    {
        pattern: /^'(.*)' expects a non-negative integer, got '(.*)'$/,
        key: "ui.keybinds.errors.expectsUnsigned",
        names: ["name", "value"]
    },
    {
        pattern: /^'(.*)' expects an integer >= (\d+), got '(.*)'$/,
        key: "ui.keybinds.errors.expectsAtLeast",
        names: ["name", "min", "value"]
    },
    {
        pattern: /^'(.*)' requires one of \[(.*)\]\.$/,
        key: "ui.keybinds.errors.requiresOneOf",
        names: ["name", "options"]
    },
    {
        pattern: /^Invalid value for '(.*)': '(.*)'$/,
        key: "ui.keybinds.errors.invalidValue",
        names: ["name", "value"]
    },
    {
        pattern: /^'(.*)' expects 'direction,offset'$/,
        key: "ui.keybinds.errors.expectsDirectionOffset",
        names: ["name"]
    },
    {
        pattern: /^'(.*)' direction must be (.*)$/,
        key: "ui.keybinds.errors.directionMustBe",
        names: ["name", "directions"]
    },
    {
        pattern: /^'(.*)' requires a non-negative integer offset$/,
        key: "ui.keybinds.errors.requiresOffset",
        names: ["name"]
    },
    {pattern: /^invalid key '(.*)'$/, key: "ui.keybinds.errors.invalidKey", names: ["key"]},
    {
        pattern: /^invalid modifier '(.*)'$/,
        key: "ui.keybinds.errors.invalidModifier",
        names: ["mod"]
    },
    {pattern: /^too many modifiers$/, key: "ui.keybinds.errors.tooManyModifiers", names: []}
];

export function translateKeybindError(error: string): string {
    for (const {pattern, key, names} of PATTERNS) {
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
