<script lang="ts">
    import Page from "$lib/views/Page.svelte";
    import FontPreview from "$lib/views/FontPreview.svelte";
    import {t} from "$lib/i18n";
</script>

<Page title={t("ui.nav.fontPlayground")}>
    <FontPreview />
</Page>
