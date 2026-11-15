<template>
    <div class="asset-navigator-levels-row">
        <AssetNavigatorSkeleton v-if="showSkeleton" :items="nbrSkeletonItems" />

        <template v-else>
            <LevelSelector v-for="(level, index) in noneSensorLevels" :key="index"
                :label="getLevelLabel(level.levelType, index)" :options="level.options" :device="device"
                :multiple="multiple" @select="selection => levelSelected(index, selection)"
                @cleared="onLevelCleared(index)" :clearable="clearable" :clearable-final-step="clearableFinalStep"
                :is-loading="isLoading" :selected-value="level.value" :disabled-ids="disabledIds"
                :hide-disabled-ids="hideDisabledIds" />

            <FinalStep v-if="sensorLevel && !device" :is-loading="isLoading" :multiple="multiple"
                :clearable="clearableFinalStep || clearable" :support-formula="effectiveSupportFormula"
                :formula-only="formulaOnly" :sensors="sensorLevel.options" :translation="translation"
                :functions="formulaFunctions" :operators="formulaOperators" :ignore-description="ignoreDescription"
                :equation-reset-token="effectiveEquationResetToken" :disabled-ids="disabledIds"
                :hide-disabled-ids="hideDisabledIds" @formula-apply="onFormulaApply" @clear-sensors="onClearSensors"
                @copy="$emit('formula-copied')" />
        </template>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, watch, provide, type PropType } from 'vue';
import LevelSelector from './LevelSelector/LevelSelector.vue';
import { AssetNavigatorService } from '@/services/AssetNavigatorService';
import { AxiosInstance } from 'axios';
import { AssetNavigatorDataTransformer, AssetNavigatorLevel, AssetNavigatorSelection, AssetNavigatorChange, type FunctionInput, type FormulaDescriptionVisibility } from '@/types/AssetNavigator';
import NavigatorLevelType from '@/enums/NavigatorLevelType';
import FinalStep from './FinalStep.vue';
import AssetNavigatorSkeleton from './AssetNavigatorSkeleton.vue';
import { useTranslation, TranslatorLike } from '@/composables/useTranslation';
import { deriveSelectedDeviceValue, isSelectedValueDevice } from '@/composables/useDeviceValue';
import { type Operator } from '@open-dcp/vue-equation-editor';

const props = defineProps({
    initialState: {
        type: Array as () => AssetNavigatorLevel[],
        required: false
    },
    startLink: {
        type: String,
        required: false
    },
    axiosInstance: {
        type: [Object, Function] as unknown as () => AxiosInstance,
        required: true
    },
    siteId: {
        type: Number,
        required: true
    },
    device: {
        type: Boolean,
        default: false
    },
    multiple: {
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
    formulaOnly: {
        type: Boolean,
        default: false
    },
    supportFormula: {
        type: Boolean,
        default: false
    },
    formulaFunctions: {
        type: Array as () => FunctionInput[],
        required: false
    },
    formulaOperators: {
        type: Array as () => Operator[],
        required: false
    },
    ignoreDescription: {
        type: Object as PropType<FormulaDescriptionVisibility>,
        required: false
    },
    resetToken: {
        type: Number,
        default: 0
    },
    translation: {
        type: Object as PropType<TranslatorLike>,
        required: false,
    },
    nbrSkeletonItems: {
        type: Number,
        default: 3
    },
    editorFence: {
        type: Object as PropType<{
            variableOpen?: string;
            variableClose?: string;
            numberOpen?: string | null;
            numberClose?: string | null;
        }>,
        default: () => ({
            variableOpen: '{',
            variableClose: '}',
            numberOpen: null,
            numberClose: null
        })
    },
    disabledIds: {
        type: Array as () => string[],
        default: () => []
    },
    hideDisabledIds: {
        type: Boolean,
        default: false
    },
    dataTransformer: {
        type: Function as PropType<AssetNavigatorDataTransformer>,
        required: false,
    }
});

const { t } = useTranslation(props.translation);
provide('t', t);
provide('editorFence', props.editorFence);

const emits = defineEmits<{
    (e: 'change', payload: AssetNavigatorChange): void,
    (e: 'complete', payload: AssetNavigatorChange): void,
    (e: 'formula-copied'): void
}>();

const noneSensorLevels = computed(() => {
    return assetNavigatorLevels.value.filter(level => level.levelType !== NavigatorLevelType.Sensor);
})

const sensorLevel = computed(() => {
    return assetNavigatorLevels.value.find(level => level.levelType === NavigatorLevelType.Sensor);
})

const effectiveSupportFormula = computed(() => props.supportFormula || props.formulaOnly);

const getLevelLabel = (levelType: NavigatorLevelType, index: number) => {
    if (levelType !== NavigatorLevelType.Level) {
        return t(levelType);
    }

    return `${t(levelType)} ${index + 1}`;
}

const assetNavigatorService = new AssetNavigatorService(
    props.axiosInstance,
    props.siteId,
    props.dataTransformer
);

provide('navService', assetNavigatorService);

const cloneLevel = (level: AssetNavigatorLevel): AssetNavigatorLevel => ({
    ...level,
    options: [...level.options],
    value: Array.isArray(level.value) ? [...level.value] : level.value,
});

const getFirstSelectionValue = (value: null | string | string[]): string | null => {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }

    return value ?? null;
}

const levelHasDeviceSelection = (level: AssetNavigatorLevel): boolean => {
    if (level.levelType === NavigatorLevelType.Device) {
        return true;
    }

    return isSelectedValueDevice(level.value, level.options);
}

const findDeviceSelectionIndex = (levels: AssetNavigatorLevel[]): number =>
    levels.findIndex(level => levelHasDeviceSelection(level));

const normalizeInitialLevels = (levels: AssetNavigatorLevel[]): AssetNavigatorLevel[] => {
    const clonedLevels = levels.map(cloneLevel);

    if (!props.device) {
        return clonedLevels;
    }

    const deviceIndex = findDeviceSelectionIndex(clonedLevels);
    if (deviceIndex === -1) {
        return clonedLevels;
    }

    clonedLevels[deviceIndex].levelType = NavigatorLevelType.Device;
    return clonedLevels.slice(0, deviceIndex + 1);
}

const assetNavigatorLevels = ref<AssetNavigatorLevel[]>(normalizeInitialLevels(props.initialState ?? []));
const isLoading = ref(false);
const formulaModeEnabled = ref(false);
const selectedFormula = ref<unknown>(null);
const equationResetToken = ref(0);
const effectiveEquationResetToken = computed(() => props.resetToken + equationResetToken.value);

const showSkeleton = computed(() =>
    isLoading.value && assetNavigatorLevels.value.length === 0
);

// Sensor selection lives inside the sensor level's value — single source of truth.
// Pre-population from initialState is automatic: if the sensor level already carries a value, it surfaces here.
const selectedSensorValues = computed({
    get(): string[] {
        const level = sensorLevel.value;
        if (!level?.value) return [];
        return Array.isArray(level.value) ? level.value : [level.value];
    },
    set(val: string[]) {
        if (sensorLevel.value) {
            sensorLevel.value.value = val.length === 0 ? null : val;
        }
    }
});

provide('selectedSensorValues', selectedSensorValues);

const sensorHistory = ref<Record<string, string[]>>({});

const getPathKey = (): string =>
    assetNavigatorLevels.value
        .filter(l => l.levelType !== NavigatorLevelType.Sensor)
        .map(l => Array.isArray(l.value) ? l.value.join(',') : (l.value ?? ''))
        .join('|');

if (sensorLevel.value && selectedSensorValues.value.length > 0) {
    sensorHistory.value[getPathKey()] = selectedSensorValues.value;
}

const resetCompletionState = () => {
    selectedFormula.value = null;
    formulaModeEnabled.value = false;
}

const buildPayload = (complete: boolean, isFormulaApply: boolean = false): AssetNavigatorChange => ({
    levels: assetNavigatorLevels.value,
    selectedDeviceValue: deriveSelectedDeviceValue(assetNavigatorLevels.value),
    selectedSensorValues: formulaModeEnabled.value ? null : selectedSensorValues.value,
    allSelectedSensorValues: [...new Set(Object.values(sensorHistory.value).flat())],
    formulaEnabled: formulaModeEnabled.value,
    formula: formulaModeEnabled.value ? selectedFormula.value : null,
    complete,
    isFormulaApply
})

watch(
    () => [effectiveSupportFormula.value, sensorLevel.value],
    ([supportsFormula, currentSensorLevel]) => {
        if (!supportsFormula || !currentSensorLevel) {
            formulaModeEnabled.value = false;
        }
    }
);

watch(selectedSensorValues, (values) => {
    if (sensorLevel.value) {
        sensorHistory.value[getPathKey()] = values;
    }
    if (values.length > 0) {
        emits('change', buildPayload(true))
        emits('complete', buildPayload(true))
        return;
    }

    emits('change', buildPayload(false));
});

const levelSelected = async (index: number, selection: AssetNavigatorSelection) => {
    const firstValue = Array.isArray(selection.value) ? (selection.value[0] ?? null) : selection.value;
    assetNavigatorLevels.value[index].value = selection.value
    if (selection.isDevice) {
        assetNavigatorLevels.value[index].levelType = NavigatorLevelType.Device;
    }
    assetNavigatorLevels.value.splice(index + 1)

    if (props.device && selection.isDevice) {
        selectedFormula.value = null;
        formulaModeEnabled.value = false;
        emits('change', buildPayload(true))
        emits('complete', buildPayload(true))
        return
    }

    emits('change', buildPayload(false))

    if (!firstValue) {
        return
    }

    isLoading.value = true;
    let newData = await assetNavigatorService.fetchHierarchy(firstValue!)
    isLoading.value = false;

    if (newData.options.length > 0) {
        if (newData.levelType === NavigatorLevelType.Sensor) {
            const saved = sensorHistory.value[getPathKey()];
            if (saved?.length) {
                newData.value = saved;
            }
        }
        assetNavigatorLevels.value.push(newData)
    }
}

const onLevelCleared = (index: number) => {
    assetNavigatorLevels.value[index].value = null;
    assetNavigatorLevels.value.splice(index + 1);
    resetCompletionState();
    emits('change', buildPayload(false));
}

const onFormulaApply = (formula: unknown) => {
    selectedFormula.value = formula
    formulaModeEnabled.value = true
    emits('change', buildPayload(true, true))
    emits('complete', buildPayload(true, true))
}

const onClearSensors = () => {
    selectedSensorValues.value = [];
    resetCompletionState();
    equationResetToken.value += 1;
    emits('change', buildPayload(false));
}

const hydrateNextLevelFromState = async () => {
    // Mirror runtime selection behavior: after a selected level, render one next level unless completion is reached.
    while (assetNavigatorLevels.value.length > 0) {
        const lastLevel = assetNavigatorLevels.value[assetNavigatorLevels.value.length - 1];
        if (lastLevel.levelType === NavigatorLevelType.Sensor) {
            return;
        }

        if (props.device && levelHasDeviceSelection(lastLevel)) {
            return;
        }

        const selectedValue = getFirstSelectionValue(lastLevel.value);
        if (!selectedValue) {
            return;
        }

        isLoading.value = true;
        const newData = await assetNavigatorService.fetchHierarchy(selectedValue);
        isLoading.value = false;

        if (newData.options.length === 0) {
            return;
        }

        assetNavigatorLevels.value.push(newData);
    }
}

onMounted(async () => {
    if (!props.initialState || props.initialState.length === 0) {
        isLoading.value = true;
        // Precedence: initialState > startLink > root.
        const initialData = await assetNavigatorService.fetchHierarchy(props.startLink?.trim() || undefined)
        isLoading.value = false;
        assetNavigatorLevels.value = [initialData]
        return;
    }

    await hydrateNextLevelFromState();
})
</script>

<style scoped lang="scss">
.asset-navigator-levels-row {
    display: flex;
    flex-wrap: wrap;
    column-gap: 12px;
    row-gap: 8px;
}
</style>