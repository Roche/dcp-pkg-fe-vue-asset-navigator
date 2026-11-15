<template>
    <div class="dcp-asset-navigator-equation-editor">
        <DcpEquationEditor :key="editorInstanceKey" v-model="equation" :variables="variables" :functions="functions"
            :operators="operators" :ignore-description="ignoreDescription" :translation="translation" :fence="fence"
            @copy="emit('copy')" @errors="handleError" class="dcp-asset-navigator-equation-editor-instance" />

        <div class="dcp-asset-navigator-equation-editor-buttons">
            <v-btn size="small" v-if="allowCancel" @click="$emit('cancel')">{{ t('cancel') }}</v-btn>
            <v-btn size="small" color="primary" :disabled="hasEquationErrors" @click="emit('apply', equation)">
                {{ t('apply-formula') }}
            </v-btn>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, watch, type PropType } from 'vue';
import { DcpEquationEditor, Variable, type Operator } from '@open-dcp/vue-equation-editor';
import { TranslatorLike } from '@/composables/useTranslation';
import { type FunctionInput, type FormulaDescriptionVisibility } from '@/types/AssetNavigator';

const props = defineProps({
    options: {
        type: Array,
        required: true
    },
    translation: {
        type: Object as PropType<TranslatorLike>,
        required: false,
    },
    allowCancel: {
        type: Boolean,
        default: true,
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
    resetToken: {
        type: Number,
        default: 0,
    }
});

const t = inject('t') as (key: string) => string;
const fence = inject('editorFence') as {
    variableOpen?: string;
    variableClose?: string;
    numberOpen?: string | null;
    numberClose?: string | null;
};

const emit = defineEmits(['cancel', 'apply', 'copy', 'errors']);

const equation = ref();
const hasEquationErrors = ref(false);
const editorInstanceKey = ref(0);

const variables = computed<Variable[]>(() => {
    return props.options.map((o: any) => {
        return {
            label: o.name,
            value: o.webId ?? o.value,
            data: {
                valueType: o.valueType ?? undefined,
                uoM: o.uoM ?? undefined,
                description: o.description ?? undefined
            }
        };
    })
});

const handleError = (errors: any) => {
    hasEquationErrors.value = Array.isArray(errors) ? errors.length > 0 : !!errors;
    emit('errors', errors);
};

watch(() => props.resetToken, () => {
    equation.value = undefined;
    hasEquationErrors.value = false;
    editorInstanceKey.value += 1;
});
</script>

<style scoped lang="scss">
.dcp-asset-navigator-equation-editor {
    display: flex;
    gap: 10px;
    min-width: 260px !important;
    width: 80% !important;
    align-items: top;

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
}

.dcp-asset-navigator-equation-editor-buttons {
    display: flex;
    gap: 10px;
    padding-top: 10px;
}
</style>
