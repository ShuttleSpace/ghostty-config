// Regenerates the `settings` namespace of the English locale from the typed
// settings registry and navigation tree. Those two files stay the single source
// of truth for setting metadata; the locale file is a generated projection that
// x18n can check and translate.
//
// Usage: bun scripts/sync-i18n.ts [--check]
//   --check  exit non-zero when en/settings.json is out of date (CI)

import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import ts from "typescript";

const root = process.cwd();
const registryPath = join(root, "src/lib/settings/registry.ts");
const navigationPath = join(root, "src/lib/settings/navigation.ts");
const keybindsPath = join(root, "src/lib/utils/keybinds.ts");
const outPath = join(root, "src/lib/i18n/locales/en/settings.json");
const uiPath = join(root, "src/lib/i18n/locales/en/ui.json");

type Json = string | number | boolean | null | Json[] | {[key: string]: Json};

function parseSource(path: string): ts.SourceFile {
    return ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
}

function stringValue(node: ts.Node | undefined): string | undefined {
    if (!node) return undefined;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    return undefined;
}

function objectProperty(object: ts.ObjectLiteralExpression, name: string): ts.Node | undefined {
    for (const property of object.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const key = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
                ? property.name.text
                : undefined;
        if (key === name) return property.initializer;
    }
    return undefined;
}

function findObject(
    source: ts.SourceFile,
    variableName: string
): ts.ObjectLiteralExpression | undefined {
    for (const statement of source.statements) {
        if (!ts.isVariableStatement(statement)) continue;
        for (const declaration of statement.declarationList.declarations) {
            if (!ts.isIdentifier(declaration.name) || declaration.name.text !== variableName) {
                continue;
            }
            if (!declaration.initializer) return undefined;
            const initializer = unwrap(declaration.initializer);
            if (ts.isObjectLiteralExpression(initializer)) return initializer;
        }
    }
    return undefined;
}

function unwrap(node: ts.Expression): ts.Expression {
    let current = node;
    while (
        ts.isAsExpression(current) || ts.isSatisfiesExpression(current) || ts.isParenthesizedExpression(current)
    ) {
        current = current.expression;
    }
    return current;
}

function findArray(
    source: ts.SourceFile,
    variableName: string
): ts.ArrayLiteralExpression | undefined {
    for (const statement of source.statements) {
        if (!ts.isVariableStatement(statement)) continue;
        for (const declaration of statement.declarationList.declarations) {
            if (!ts.isIdentifier(declaration.name) || declaration.name.text !== variableName) {
                continue;
            }
            if (!declaration.initializer) return undefined;
            const initializer = unwrap(declaration.initializer);
            if (ts.isArrayLiteralExpression(initializer)) return initializer;
        }
    }
    return undefined;
}

function registryEntries(): Record<string, Json> {
    const source = parseSource(registryPath);
    const object = findObject(source, "registry");
    if (!object) throw new Error("Could not find the registry object in registry.ts");

    const entries: Record<string, Json> = {};
    for (const property of object.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const id = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
                ? property.name.text
                : undefined;
        if (!id || !ts.isObjectLiteralExpression(property.initializer)) continue;

        const entry: Record<string, Json> = {};
        for (const field of ["name", "description", "note"] as const) {
            const value = stringValue(objectProperty(property.initializer, field));
            if (value) entry[field] = value;
        }
        entries[id] = entry;
    }
    return entries;
}

function navigationEntries(): {
    nav: Record<string, Json>;
    navNote: Record<string, Json>;
    group: Record<string, Json>;
    groupNote: Record<string, Json>;
} {
    const source = parseSource(navigationPath);
    const array = findArray(source, "navigation");
    if (!array) throw new Error("Could not find the navigation array in navigation.ts");

    const nav: Record<string, Json> = {};
    const navNote: Record<string, Json> = {};
    const group: Record<string, Json> = {};
    const groupNote: Record<string, Json> = {};

    for (const element of array.elements) {
        if (!ts.isObjectLiteralExpression(element)) continue;
        const id = stringValue(objectProperty(element, "id"));
        if (!id) continue;

        const name = stringValue(objectProperty(element, "name"));
        if (name) nav[id] = name;

        const note = stringValue(objectProperty(element, "note"));
        if (note) navNote[id] = note;

        const groupsNode = objectProperty(element, "groups");
        if (!groupsNode || !ts.isArrayLiteralExpression(groupsNode)) continue;

        const groups: Record<string, Json> = {};
        const notes: Record<string, Json> = {};
        for (const groupElement of groupsNode.elements) {
            if (!ts.isObjectLiteralExpression(groupElement)) continue;
            const groupId = stringValue(objectProperty(groupElement, "id"));
            const groupName = stringValue(objectProperty(groupElement, "name"));
            if (groupId && groupName) groups[groupId] = groupName;

            const noteValue = stringValue(objectProperty(groupElement, "note"));
            if (groupId && noteValue) notes[groupId] = noteValue;
        }
        group[id] = groups;
        if (Object.keys(notes).length) groupNote[id] = notes;
    }

    return {nav, navNote, group, groupNote};
}

function keybindActions(): Record<string, Json> {
    const source = parseSource(keybindsPath);
    const array = findArray(source, "ACTION_DEFINITIONS");
    if (!array) throw new Error("Could not find ACTION_DEFINITIONS in keybinds.ts");

    const actions: Record<string, Json> = {};
    for (const element of array.elements) {
        if (!ts.isObjectLiteralExpression(element)) continue;
        const name = stringValue(objectProperty(element, "name"));
        const description = stringValue(objectProperty(element, "description"));
        if (name && description) actions[name] = description;
    }
    return actions;
}

const {nav, navNote, group, groupNote} = navigationEntries();
const settings = {
    nav,
    navNote,
    group,
    groupNote,
    setting: registryEntries()
};

const ui = JSON.parse(readFileSync(uiPath, "utf8")) as Record<string, Json>;
const uiKeybinds = ui.keybinds;
if (typeof uiKeybinds !== "object" || uiKeybinds === null || Array.isArray(uiKeybinds)) {
    throw new Error("en/ui.json must contain a `keybinds` object");
}
uiKeybinds.actions = keybindActions();

const settingsSerialized = `${JSON.stringify(settings, null, 4)}\n`;
const uiSerialized = `${JSON.stringify(ui, null, 4)}\n`;
const check = process.argv.includes("--check");

if (check) {
    let stale = false;
    const currentSettings = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";
    if (currentSettings !== settingsSerialized) {
        console.error(
            "src/lib/i18n/locales/en/settings.json is out of date. Run `bun run i18n:sync`."
        );
        stale = true;
    }
    const currentUi = existsSync(uiPath) ? readFileSync(uiPath, "utf8") : "";
    if (currentUi !== uiSerialized) {
        console.error("src/lib/i18n/locales/en/ui.json is out of date. Run `bun run i18n:sync`.");
        stale = true;
    }
    if (stale) process.exit(1);
    console.log("i18n English sources are up to date.");
}
 else {
    writeFileSync(outPath, settingsSerialized);
    writeFileSync(uiPath, uiSerialized);
    console.log(`Wrote ${outPath}`);
    console.log(`Wrote ${uiPath}`);
}
