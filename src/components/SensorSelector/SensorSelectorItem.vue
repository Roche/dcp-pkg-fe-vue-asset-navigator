<template>
    <v-tooltip :disabled="!item.raw.description" :text="item.raw.description" :open-delay="200">
        <template #activator="{ props: tooltipProps }">
            <v-list-item v-bind="{ ...itemProps, ...tooltipProps }" :disabled="disabled" :title="item.raw.label" density="compact" />
        </template>
    </v-tooltip>
</template>

<script setup lang="ts">
import { AssetNavigatorOption } from '@/types/AssetNavigator';

defineProps<{
    itemProps: Record<string, unknown>
    item: {
        raw: AssetNavigatorOption
    }
    disabled?: boolean
}>()
</script>