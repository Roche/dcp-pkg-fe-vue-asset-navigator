import { describe, expect, it } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import SensorSelector from '../SensorSelector.vue';

const VAutocompleteStub = {
    name: 'VAutocomplete',
    props: ['items'],
    template: '<div />'
};

describe('SensorSelector', () => {
    it('disables only options whose id is in disabledIds (webId first, value fallback)', () => {
        const wrapper = shallowMount(SensorSelector, {
            props: {
                isLoading: false,
                options: [
                    {
                        label: 'WebId based sensor',
                        description: 'Uses webId for disabling',
                        value: 'sensor/webid-based/data',
                        webId: 'sensor/webid-based'
                    },
                    {
                        label: 'Value based sensor',
                        description: 'Uses value for disabling',
                        value: 'sensor/value-based'
                    },
                    {
                        label: 'Enabled sensor',
                        description: 'Not disabled',
                        value: 'sensor/enabled/data',
                        webId: 'sensor/enabled'
                    }
                ],
                disabledIds: ['sensor/webid-based', 'sensor/value-based'],
                hideDisabledIds: false
            },
            global: {
                provide: {
                    t: (key: string) => key,
                    selectedSensorValues: ref([])
                },
                stubs: {
                    VAutocomplete: VAutocompleteStub,
                    SensorSelectorItem: true
                }
            }
        });

        const items = wrapper.getComponent(VAutocompleteStub).props('items') as Array<{
            label: string;
            disabled: boolean;
        }>;

        const disabledByLabel = Object.fromEntries(
            items.map(item => [item.label, item.disabled])
        );

        expect(disabledByLabel['WebId based sensor']).toBe(true);
        expect(disabledByLabel['Value based sensor']).toBe(true);
        expect(disabledByLabel['Enabled sensor']).toBe(false);
    });
});