<script lang="ts">
    import type {ColorScheme} from "$lib/utils/colors";

    interface Props {
        colors: ColorScheme;
    }

    const {colors}: Props = $props();

    const background = $derived(colors.background ?? colors.palette[0] ?? "#000000");
    const foreground = $derived(colors.foreground ?? colors.palette[7] ?? "#ffffff");
    const cursor = $derived(colors.cursorColor ?? foreground);
    const palette = (index: number) => colors.palette[index] ?? foreground;
</script>

<div
    class="style-preview"
    style:--style-bg={background}
    style:--style-fg={foreground}
    aria-hidden="true"
>
    <div class="titlebar">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="title">ghostty</span>
    </div>
    <div class="terminal">
        <div class="line">
            <span style:color={palette(2)}>➜</span> <span style:color={palette(4)}>~</span>
            <span style:color={palette(6)}>git</span> status
        </div>
        <div class="line">
            <span style:color={palette(2)}>On branch</span>
            <span style:color={palette(5)}>main</span>
        </div>
        <div class="line"><span style:color={palette(3)}>modified:</span> src/lib/theme.ts</div>
        <div class="line"><span style:color={palette(1)}>deleted:</span> old-config</div>
        <div class="line">
            <span style:color={palette(2)}>➜</span>
            <span class="cursor" style:background={cursor}></span>
        </div>
    </div>
    <div class="swatches">
        {#each colors.palette.slice(0, 8) as color, index (index)}
            <span style:background={color}></span>
        {/each}
    </div>
</div>

<style>
    .style-preview {
        background: var(--style-bg);
        color: var(--style-fg);
        border-radius: var(--radius-level-3);
        border: 1px solid rgba(0, 0, 0, 0.45);
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06) inset;
        overflow: hidden;
        font-family: var(--config-font-family);
        font-size: 0.72rem;
        line-height: 1.5;
    }

    .titlebar {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 5px 8px;
        background: color-mix(in srgb, var(--style-bg) 82%, var(--style-fg));
        border-bottom: 1px solid rgba(0, 0, 0, 0.3);
    }

    .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--style-fg) 35%, transparent);
    }

    .title {
        margin-left: auto;
        font-size: 0.62rem;
        color: color-mix(in srgb, var(--style-fg) 60%, transparent);
    }

    .terminal {
        padding: 8px 10px 10px;
    }

    .line {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .cursor {
        display: inline-block;
        width: 6px;
        height: 10px;
        vertical-align: -1px;
    }

    .swatches {
        display: flex;
        height: 5px;
    }

    .swatches span {
        flex: 1;
    }
</style>
