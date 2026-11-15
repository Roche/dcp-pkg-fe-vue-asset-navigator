<template>
    <div class="dcp-input dcp-autocomplete asset-navigator-combobox">
        <v-autocomplete v-model="selected" v-model:search="searchText" :disabled="isLoading" :label="displayLabel"
            hide-details autocomplete="off" density="comfortable" :items="processedOptions" item-title="label"
            item-value="value" :item-props="true" :filter-keys="['title', 'raw.description']" :multiple="isDeviceMode"
            :chips="isDeviceMode" :clearable="clearable || (clearableFinalStep && isDeviceSelection)">
            <template #item="{ props, item }">
                <LevelSelectorItem :item-props="props" :item="item"
                    :disabled="item.raw.disabled || (isDeviceMode && item.raw.isDevice !== true)" />
            </template>
        </v-autocomplete>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, inject } from 'vue';
import LevelSelectorItem from './LevelSelectorItem.vue';
import { AssetNavigatorOption, AssetNavigatorSelection } from '@/types/AssetNavigator';
import { isSelectedValueDevice } from '@/composables/useDeviceValue';

type SelectedValue = string | string[] | null;

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
    device: {
        type: Boolean,
        default: false
    },
    clearable: {
        type: Boolean,
        default: false
    },
    clearableFinalStep: {
        type: Boolean,
        default: false
    },
    selectedValue: {
        type: [String, Array] as unknown as () => SelectedValue,
        required: false,
        default: null
    },
    disabledIds: {
        type: Array as () => string[],
        default: () => []
    },
    hideDisabledIds: {
        type: Boolean,
        default: false
    }
});

const t = inject('t') as (key: string) => string;

// Filter and mark options based on disabledIds
const processedOptions = computed(() => {
    let result = props.options;

    if (props.hideDisabledIds) {
        result = result.filter(option => !props.disabledIds.includes(option.value));
    }

    return result.map(option => ({
        ...option,
        disabled: props.disabledIds.includes(option.value)
    }));
});

const emit = defineEmits<{
    (e: 'select', value: AssetNavigatorSelection): void;
    (e: 'cleared'): void;
}>()

const normalizeSelection = (val: SelectedValue | undefined): SelectedValue =>
    Array.isArray(val) ? [...val] : (val ?? null);

const selectionsEqual = (
    left: SelectedValue,
    right: SelectedValue
): boolean => {
    if (Array.isArray(left) && Array.isArray(right)) {
        return left.length === right.length && left.every((item, index) => item === right[index]);
    }

    return left === right;
};

const selected = ref<SelectedValue>(normalizeSelection(props.selectedValue));
const searchText = ref('');
const suppressNextEmit = ref(false);

watch(
    () => props.selectedValue,
    (val) => {
        const normalized = normalizeSelection(val);
        if (selectionsEqual(selected.value, normalized)) {
            return;
        }

        suppressNextEmit.value = true;
        selected.value = normalized;
    }
);

const hasSelection = computed(() => {
    const val = selected.value;
    if (Array.isArray(val)) {
        return val.length > 0;
    }

    return !!val;
});

const isDeviceSelection = computed(() => {
    return isSelectedValueDevice(selected.value, processedOptions.value);
});

const isDeviceMode = computed(() =>
    props.device && props.multiple && hasSelection.value && isDeviceSelection.value
);

watch(selected, (val) => {
    if (suppressNextEmit.value) {
        suppressNextEmit.value = false;
        return;
    }

    if (val === null || (Array.isArray(val) && val.length === 0) || val === '') {
        emit('cleared')
        return;
    }
    const isDevice = isSelectedValueDevice(val, processedOptions.value);
    if (Array.isArray(val)) {
        emit('select', { value: val, isDevice });
    } else {
        if (isDevice && props.multiple && props.device) {
            selected.value = [val];
            searchText.value = '';
            return;
        }
        emit('select', { value: val, isDevice });
    }
})
const displayLabel = computed(() => {
    if (isDeviceSelection.value) {
        return t('device');
    }

    return props.label;
});
</script>

<style scoped lang="scss">
.asset-navigator-combobox {
    width: 260px !important;
    flex-shrink: 0 !important;

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
}
</style>
