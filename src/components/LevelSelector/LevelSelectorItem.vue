<template>
    <v-tooltip v-model="isTooltipOpen" :disabled="!item.raw.description" :open-delay="500" location="end">
        <template #activator="{ props: tooltipProps }">
            <v-list-item v-bind="{ ...itemProps, ...tooltipProps }" :disabled="disabled" :title="item.raw.label"
                density="compact" />
        </template>

        <div class="asset-navigator-tooltip-content">
            <div v-if="loading">{{ t('loading') }}...</div>
            <div v-else>{{ tooltipContent }}</div>
        </div>
    </v-tooltip>
</template>

<script setup lang="ts">
import { ref, inject, watch, onBeforeUnmount } from 'vue';
import { AssetNavigatorOption } from '@/types/AssetNavigator';

const props = defineProps<{
    itemProps: Record<string, unknown>
    item: { raw: AssetNavigatorOption }
    disabled: boolean
}>()

const isTooltipOpen = ref(false)
const loading = ref(false)
const tooltipContent = ref(props.item.raw.description)
const loaded = ref(false);
const navService = inject('navService');
const t = inject('t') as (key: string) => string;

let abortController: AbortController | null = null;

watch(isTooltipOpen, async (open) => {
    if (!open) {
        abortController?.abort();
        return;
    }
    if (loaded.value || loading.value) return;

    abortController = new AbortController();
    loading.value = true;
    try {
        const valueParts = props.item.raw.value.split('/');
        const meta = await (navService as any).fetchElementMetaData(valueParts[0], undefined, abortController.signal);
        tooltipContent.value = meta?.description || props.item.raw.description;
        loaded.value = true;
    } catch (e) {
        if ((e as any)?.name !== 'CanceledError' && (e as any)?.name !== 'AbortError') throw e;
    } finally {
        abortController = null;
        loading.value = false;
    }
});

onBeforeUnmount(() => abortController?.abort());
</script>

<style lang="scss">
.asset-navigator-tooltip-content {
    max-width: 320px;
}
</style>