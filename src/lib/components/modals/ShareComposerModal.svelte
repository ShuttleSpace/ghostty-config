<script lang="ts">
    import {onMount} from "svelte";
    import ShareIcon from "$lib/components/icons/ShareIcon.svelte";
    import DialogModal from "$lib/components/modals/DialogModal.svelte";
    import Button from "$lib/components/Button.svelte";
    import {error, success} from "$lib/stores/toasts.svelte";
    import {debounce} from "$lib/utils/debounce";
    import {writeClipboard} from "$lib/platform/clipboard";
    import {t} from "$lib/i18n";

    // Prereq
    onMount(() => {
        canUseNativeShare = !isTooLong && !!window.navigator.share;
    });

    // Local props and state
    interface Props {
        isTooLong: boolean;
        shareUrl: string | null;
        configText: string;
        onclose?: () => void;
        ondownload?: () => void;
    }

    const {isTooLong, shareUrl, configText, onclose, ondownload}: Props = $props();

    let notice = $state<string | null>(null);
    let canUseNativeShare = $state(false);

    const displayNotice = $derived(notice ?? (isTooLong ? null : t("ui.modals.shareLinkNotice")));

    // Button handlers
    async function copyToClipboard(text: string, successNotice: string, failureNotice: string) {
        try {
            await writeClipboard(text);
            notice = successNotice;
            success(successNotice);
        }
 catch {
            notice = failureNotice;
            error(failureNotice);
        }
    }

    const onClickCopy = debounce(() => {
        if (isTooLong) {
            void copyToClipboard(
                configText,
                t("ui.modals.configCopiedPlain"),
                t("ui.modals.clipboardFailedExport")
            );
        }
 else if (shareUrl) {
            void copyToClipboard(
                shareUrl,
                t("ui.modals.linkCopied"),
                t("ui.modals.selectManually")
            );
        }
    }, 300);

    async function nativeShareLink() {
        if (!shareUrl) return;
        try {
            await navigator.share({
                title: t("ui.modals.shareTitle"),
                text: t("ui.modals.shareText"),
                url: shareUrl
            });
        }
 catch {
            // User cancellation should not show an error.
        }
    }
</script>

<DialogModal title={t("ui.modals.shareConfig")} {onclose}>
    {#snippet icon()}
        <ShareIcon />
    {/snippet}

    {#if isTooLong}
        <p class="share-modal-desc">{t("ui.modals.shareTooLong")}</p>
    {:else}
        <p class="share-modal-desc">{t("ui.modals.shareReview")}</p>
        <input
            type="text"
            class="share-link-input"
            value={shareUrl ?? ""}
            readonly
            onclick={(event) => event.currentTarget.select()}
        />
    {/if}
    {#if displayNotice}
        <p class="status-text" role="status">{displayNotice}</p>
    {/if}

    {#snippet footer()}
        <Button onclick={onclose}>{t("ui.modals.close")}</Button>

        {#if isTooLong}
            <Button onclick={ondownload}>{t("ui.modals.downloadFile")}</Button>
        {:else if canUseNativeShare}
            <Button onclick={nativeShareLink}>{t("ui.modals.shareEllipsis")}</Button>
        {/if}

        <Button primary onclick={onClickCopy}
            >{isTooLong ? t("ui.modals.copyConfigText") : t("ui.modals.copyLink")}</Button
        >
    {/snippet}
</DialogModal>

<style>
    .share-modal-desc {
        color: var(--font-color-muted);
        font-size: 0.9rem;
        margin: 0;
        line-height: 1.5;
    }

    .status-text {
        color: var(--font-color-muted);
        font-size: 0.9rem;
        line-height: 1.4;
        margin: 8px 0 0;
    }

    .share-link-input {
        width: 100%;
        resize: vertical;
        font-family: var(--config-font-family);
        border: 1px solid var(--border-level-3);
        border-radius: var(--radius-level-4);
        background: var(--bg-input);
        color: var(--font-color);
        padding: 8px;
    }

    .share-link-input:focus-visible {
        outline: 1px solid var(--color-input-accent);
    }
</style>
