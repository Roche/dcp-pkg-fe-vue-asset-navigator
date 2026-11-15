<template>
    <div class="sensor-selector-block">
        <SensorSelector v-if="!isFormulaEditorVisible" :multiple="multiple" :options="sensors" :is-loading="isLoading"
            :clearable="clearable" :disabled-ids="disabledIds" :hide-disabled-ids="hideDisabledIds" />
        <v-btn class="clear-sensors-button" size="small" variant="outlined" v-if="clearable"
            @click="emit('clear-sensors')">
            {{ t('clear-sensors') }}
        </v-btn>
        <v-btn class="activate-formula-button" size="small" v-if="supportFormula && !isFormulaEditorVisible"
            @click="formulaModeEnabled = true">
            {{ t('define-formula') }}
        </v-btn>
    </div>

    <EquationEditor v-if="supportFormula && isFormulaEditorVisible" :translation="translation"
        :options="processedSensors" :functions="functions" :operators="operators"
        :ignore-description="ignoreDescription" :allow-cancel="!formulaOnly" :reset-token="equationResetToken"
        @cancel="onFormulaCancel" @apply="formula => emit('formula-apply', formula)" @copy="$emit('copy')" />
</template>

<script setup lang="ts">
import { ref, inject, type PropType, computed } from 'vue';
import SensorSelector from './SensorSelector/SensorSelector.vue';
import EquationEditor from './EquationEditor/EquationEditor.vue';
import { AssetNavigatorOption, AssetNavigatorSensorOption, type FunctionInput, type FormulaDescriptionVisibility } from '@/types/AssetNavigator';
import { TranslatorLike } from '@/composables/useTranslation';
import { type Operator } from '@open-dcp/vue-equation-editor';

const formulaModeEnabled = ref(false);
const t = inject('t') as (key: string) => string;

const props = defineProps({
    supportFormula: {
        type: Boolean,
        default: false
    },
    formulaOnly: {
        type: Boolean,
        default: false
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
    sensors: {
        type: Array as () => (AssetNavigatorOption | AssetNavigatorSensorOption)[],
        required: true
    },
    functions: {
        type: Array as () => FunctionInput[],
        required: false
    },
    operators: {
        type: Array as () => Operator[],
        required: false
    },
    ignoreDescription: {
        type: Object as PropType<FormulaDescriptionVisibility>,
        required: false
    },
    translation: {
        type: Object as PropType<TranslatorLike>,
        required: false,
    },
    equationResetToken: {
        type: Number,
        default: 0,
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

const isFormulaEditorVisible = computed(() => props.formulaOnly || formulaModeEnabled.value);

// Filter and mark sensors based on disabledIds (match against webId for sensors, value for others)
const processedSensors = computed(() => {
    let result = props.sensors;

    if (props.hideDisabledIds) {
        result = result.filter(sensor => {
            const sensorId = (sensor as any).webId ?? sensor.value;
            return !props.disabledIds.includes(sensorId);
        });
    }

    return result.map(sensor => ({
        ...sensor,
        disabled: props.disabledIds.includes((sensor as any).webId ?? sensor.value)
    }));
});

const onFormulaCancel = () => {
    if (props.formulaOnly) {
        return;
    }

    formulaModeEnabled.value = false;
}

const emit = defineEmits<{
    (e: 'sensor-select', values: string[]): void
    (e: 'formula-apply', formula: unknown): void
    (e: 'clear-sensors'): void
    (e: 'copy'): void
}>()
</script>

<style scoped lang="scss">
.sensor-selector-block {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
}

.activate-formula-button {
    margin-top: 10px;
}

.clear-sensors-button {
    margin-top: 10px;
}
</style>