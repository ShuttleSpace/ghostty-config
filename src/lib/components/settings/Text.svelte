<script lang="ts">
    interface Props {
        value: string;
        placeholder?: string;
        blank?: boolean;
        align?: "right" | "left";
        size?: number;
        // `<datalist>` id used for autocomplete suggestions (e.g. system fonts
        // or environment variable names); the matching `<datalist>` element is
        // rendered once by the page supplying the id.
        list?: string;
        change?: (e: Event) => void;
        onfocus?: (e: FocusEvent) => void;
    }

    /* eslint-disable prefer-const -- value is $bindable, so the destructure must stay `let` */
    let {
        value = $bindable(),
        placeholder = "",
        blank = false,
        align = "right",
        size,
        list,
        change,
        onfocus
    }: Props = $props();
    /* eslint-enable prefer-const */

    function click(event: MouseEvent) {
        event.stopPropagation();
    }
</script>

<input
    class:blank
    class:empty={value === ""}
    class={align}
    type="text"
    {placeholder}
    {list}
    style:width={size ? `${size}ch` : "auto"}
    onclick={click}
    onchange={change}
    {onfocus}
    bind:value
/>

<style>
    input {
        background: var(--bg-level-2);
        border: 1px solid var(--border-input);
        border-radius: var(--radius-level-5);
        outline: none;
        color: inherit;
        text-align: right;
        max-width: 175px;
        padding: 0 4px 2px 0;
    }

    input:focus,
    input.blank:focus {
        background: var(--bg-input-focus);
        outline: var(--border-input-focus);
    }

    input.blank {
        background: none;
        border-width: 0;
    }

    input.blank.empty {
        border-width: 1px;
    }

    input.left {
        text-align: left;
    }
</style>
