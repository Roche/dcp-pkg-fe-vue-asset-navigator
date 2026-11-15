import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, provide } from 'vue';
import SensorSelector from '../components/SensorSelector/SensorSelector.vue';
import type { AssetNavigatorOption } from '../types/AssetNavigator';

// ─── Shared mock data ────────────────────────────────────────────────────────

const baseSensors: AssetNavigatorOption[] = [
    { label: 'Supply Temperature',  description: 'AHU supply temperature sensor',  value: 'sensor/supply-temp' },
    { label: 'Return Temperature',  description: 'AHU return temperature sensor',  value: 'sensor/return-temp' },
    { label: 'Air Flow',            description: 'AHU air flow meter',              value: 'sensor/air-flow' },
    { label: 'Humidity',            description: 'Relative humidity sensor',        value: 'sensor/humidity' },
    { label: 'Pressure',            description: 'Differential pressure sensor',    value: 'sensor/pressure' },
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof SensorSelector> = {
    title: 'Components/SensorSelector',
    component: SensorSelector,
    parameters: { layout: 'padded' },
    args: {
        options: baseSensors,
        isLoading: false,
        multiple: false,
        clearable: true,
        preselectedValues: [],
        disabledIds: [],
        hideDisabledIds: false,
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Helper wrapper that supplies required provide() values ───────────────────

function makeWrapper(slotTemplate: string, extraProvides?: Record<string, unknown>) {
    return (args: Record<string, unknown>) => ({
        components: { SensorSelector },
        setup() {
            // SensorSelector injects 't' (translator) and optionally 'selectedSensorValues'
            provide('t', (key: string) => key);

            const selectedSensorValues = ref<string[]>([]);
            provide('selectedSensorValues', selectedSensorValues);

            if (extraProvides) {
                for (const [key, val] of Object.entries(extraProvides)) {
                    provide(key, val);
                }
            }

            return { args, selectedSensorValues };
        },
        template: slotTemplate,
    });
}

// ─── Stories ─────────────────────────────────────────────────────────────────

/** Default single-select with all sensors enabled. */
export const Default: Story = {
    render: makeWrapper(`
        <div style="max-width: 400px; padding: 1rem;">
            <SensorSelector v-bind="args" />
            <p style="margin-top: 1rem; font-size: 0.85rem; color: #555;">
                Selected: {{ selectedSensorValues.join(', ') || '–' }}
            </p>
        </div>
    `),
};

/** Disabled items are visible but should NOT be selectable. */
export const DisabledVisible: Story = {
    args: {
        disabledIds: ['sensor/air-flow', 'sensor/humidity'],
        hideDisabledIds: false,
    },
    render: makeWrapper(`
        <div style="max-width: 400px; padding: 1rem;">
            <p style="margin-bottom: 0.75rem; font-size: 0.85rem; color: #555;">
                <strong>Air Flow</strong> and <strong>Humidity</strong> are disabled but visible in the list.
                They should appear greyed-out and must not be selectable.
            </p>
            <SensorSelector v-bind="args" />
            <p style="margin-top: 1rem; font-size: 0.85rem; color: #555;">
                Selected: {{ selectedSensorValues.join(', ') || '–' }}
            </p>
        </div>
    `),
};

/** Disabled items are completely hidden from the dropdown list. */
export const DisabledHidden: Story = {
    args: {
        disabledIds: ['sensor/air-flow', 'sensor/humidity'],
        hideDisabledIds: true,
    },
    render: makeWrapper(`
        <div style="max-width: 400px; padding: 1rem;">
            <p style="margin-bottom: 0.75rem; font-size: 0.85rem; color: #555;">
                <strong>Air Flow</strong> and <strong>Humidity</strong> are hidden from the dropdown entirely.
            </p>
            <SensorSelector v-bind="args" />
            <p style="margin-top: 1rem; font-size: 0.85rem; color: #555;">
                Selected: {{ selectedSensorValues.join(', ') || '–' }}
            </p>
        </div>
    `),
};

/** Multiple-select mode with some items disabled (visible). */
export const MultipleWithDisabled: Story = {
    args: {
        multiple: true,
        clearable: true,
        disabledIds: ['sensor/pressure'],
        hideDisabledIds: false,
    },
    render: makeWrapper(`
        <div style="max-width: 500px; padding: 1rem;">
            <p style="margin-bottom: 0.75rem; font-size: 0.85rem; color: #555;">
                Multi-select mode — <strong>Pressure</strong> is disabled (visible but not selectable).
            </p>
            <SensorSelector v-bind="args" />
            <p style="margin-top: 1rem; font-size: 0.85rem; color: #555;">
                Selected: {{ selectedSensorValues.join(', ') || '–' }}
            </p>
        </div>
    `),
};

/** Multiple-select mode with disabled items hidden. */
export const MultipleWithDisabledHidden: Story = {
    args: {
        multiple: true,
        clearable: true,
        disabledIds: ['sensor/pressure', 'sensor/return-temp'],
        hideDisabledIds: true,
    },
    render: makeWrapper(`
        <div style="max-width: 500px; padding: 1rem;">
            <p style="margin-bottom: 0.75rem; font-size: 0.85rem; color: #555;">
                Multi-select mode — <strong>Pressure</strong> and <strong>Return Temperature</strong>
                are hidden from the dropdown.
            </p>
            <SensorSelector v-bind="args" />
            <p style="margin-top: 1rem; font-size: 0.85rem; color: #555;">
                Selected: {{ selectedSensorValues.join(', ') || '–' }}
            </p>
        </div>
    `),
};

/** Loading skeleton state while sensors are being fetched. */
export const Loading: Story = {
    args: {
        isLoading: true,
        options: [],
    },
    render: makeWrapper(`
        <div style="max-width: 400px; padding: 1rem;">
            <p style="margin-bottom: 0.75rem; font-size: 0.85rem; color: #555;">
                isLoading = true — the selector should show a loading/skeleton state.
            </p>
            <SensorSelector v-bind="args" />
        </div>
    `),
};

