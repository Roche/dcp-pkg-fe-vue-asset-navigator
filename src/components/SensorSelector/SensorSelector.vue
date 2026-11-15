<template>
    <div class="dcp-input dcp-autocomplete asset-navigator-combobox">
        <v-autocomplete v-model="selected" :multiple="multiple" :chips="multiple" :clearable="clearable"
            :label="multiple ? t('select-sensors') : t('select-sensor')" hide-details autocomplete="off"
            density="comfortable" :items="processedOptions" item-title="label" item-value="value"
            :item-props="true" :filter-keys="['title', 'raw.description']">
            <template #item="{ props, item }">
                <SensorSelectorItem :item-props="props" :item="item" :disabled="item.raw.disabled" />
            </template>
        </v-autocomplete>
    </div>
</template>

<script lang="ts" setup>
import { computed, inject, ref, type Ref } from 'vue';
import SensorSelectorItem from './SensorSelectorItem.vue';
import { AssetNavigatorOption } from '@/types/AssetNavigator';

const t = inject('t') as (key: string) => string;
const selectedSensorValues = inject('selectedSensorValues') as Ref<string[]> | undefined;

const emit = defineEmits<{
    (e: 'select', value: string[]): void
}>()

const props = defineProps({
    options: {
        type: Array as () => AssetNavigatorOption[],
        required: true
    },
    label: {
        type: String,
        default: ''
    },
    isLoading: {
        type: Boolean,
        required: true
    },
    multiple: {
        type: Boolean,
        default: false
    },
    clearable: {
        type: Boolean,
        default: false
    },
    preselectedValues: {
        type: Array as () => string[],
        default: () => []
    },
    disabledIds: {
        type: Array as () => string[],
        default: () => []
    },
    hideDisabledIds: {
        type: Boolean,
        default: false
    }
})
const localSelected = ref<string | string[] | null>(props.multiple ? [] : null);

// Filter and mark options based on disabledIds (match against webId for sensors, value for others)
const processedOptions = computed(() => {
    let result = props.options;
    
    if (props.hideDisabledIds) {
        result = result.filter(option => {
            const optionId = (option as any).webId ?? option.value;
            return !props.disabledIds.includes(optionId);
        });
    }
    
    return result.map(option => ({
        ...option,
        disabled: props.disabledIds.includes((option as any).webId ?? option.value)
    }));
});

// Extract webId from option value for storage in selectedSensorValues
const getWebIdForOption = (value: string): string => {
    const option = props.options.find(o => o.value === value);
    return (option as any)?.webId ?? value;
};

const selected = computed<string | string[] | null>({
    get() {
        if (!selectedSensorValues) {
            return localSelected.value;
        }

        // selectedSensorValues contains webIds; convert back to links for v-autocomplete
        const available = selectedSensorValues.value
            .map(webId => {
                const option = props.options.find(o => (o as any).webId ?? o.value === webId);
                return option?.value;
            })
            .filter((v): v is string => v !== undefined);
        
        return props.multiple
            ? available
            : (available[0] ?? null);
    },
    set(val) {
        if (!selectedSensorValues) {
            localSelected.value = val;
            return;
        }

        if (val === null || val === undefined) {
            selectedSensorValues.value = [];
            return;
        }

        // val contains links from v-autocomplete; convert to webIds for storage
        const webIds = (Array.isArray(val) ? val : [val])
            .map(getWebIdForOption);
        
        selectedSensorValues.value = webIds;
    }
});
</script>

<style scoped lang="scss">
.asset-navigator-combobox {
    min-width: 260px;
    flex-shrink: 1;

    :deep(.v-field),
    :deep(.v-field__field),
    :deep(.v-field__input),
    :deep(input) {
        background: transparent !important;
        padding-left: 0 !important;
    }

    :deep(.v-field__overlay) {
        background: transparent !important;
        opacity: 0 !important;
    }

    :deep(.v-field__append-inner .v-icon) {
        color: rgb(var(--v-theme-primary)) !important;
    }

    :deep(label.v-field-label--floating) {
        margin-left: 0 !important;
    }

    :deep(.v-chip) {
        margin-bottom: 2px !important;
    }

}
</style>
