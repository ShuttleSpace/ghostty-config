<script lang="ts">
    import {scrollMultiplierCodec} from "$lib/settings/codecs";
    import DualNumber from "./DualNumber.svelte";
    import {tWidgetLabel} from "$lib/i18n";

    interface Props {
        value: string;
    }
    let {value = $bindable("")}: Props = $props();

    // The codec translates Ghostty's `precision:x,discrete:y` <-> DualNumber's `"x,y"` pair form.
    const dualValue = $derived(scrollMultiplierCodec.parse(value));

    function onChange(next: string) {
        value = scrollMultiplierCodec.serialize(next);
    }
</script>

<DualNumber
    bind:value={() => dualValue, onChange}
    labels={[tWidgetLabel("Precision"), tWidgetLabel("Discrete")]}
    min={0.01}
    max={10000}
    step={0.1}
/>
