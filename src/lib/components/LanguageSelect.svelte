<script lang="ts">
    import {i18n, localeOptions, setLocale, t} from "$lib/i18n";
</script>

<div class="language-select" title={t("ui.nav.languageHint")}>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" />
    </svg>
    <select
        id="interface-language"
        class="language-input"
        value={i18n.locale}
        onchange={(event) => setLocale(event.currentTarget.value)}
        aria-label={t("ui.nav.languageHint")}
    >
        {#each localeOptions as locale (locale.code)}
            <option value={locale.code}>{locale.label}</option>
        {/each}
    </select>
</div>

<style>
    .language-select {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 6px 10px 4px;
        padding: 6px 10px;
        border-radius: var(--radius-level-4);
        color: var(--font-color-muted);
        background: rgba(255, 255, 255, 0.05);
    }

    .language-select svg {
        flex-shrink: 0;
        width: 14px;
        height: 14px;
    }

    .language-input {
        flex: 1;
        min-width: 0;
        border: 0;
        padding: 0;
        background: transparent;
        color: var(--font-color);
        font: inherit;
        font-size: 0.8rem;
        cursor: pointer;
        outline: none;
        appearance: none;
    }

    .language-input:focus-visible {
        outline: var(--border-input-focus);
        border-radius: var(--radius-level-5);
    }

    .language-input option {
        background: var(--bg-level-2);
        color: var(--font-color);
    }
</style>
