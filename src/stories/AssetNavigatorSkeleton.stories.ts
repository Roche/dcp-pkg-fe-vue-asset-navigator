import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { AxiosInstance } from 'axios';
import AssetNavigator from '../components/AssetNavigator.vue';
import type { AssetNavigatorLevel } from '../types/AssetNavigator';

const pendingAxiosMock = {
    async get() {
        return new Promise(() => {
            // Intentionally never resolved to keep navigator in loading state.
        });
    },
} as unknown as AxiosInstance;

const meta: Meta<typeof AssetNavigator> = {
    title: 'Components/AssetNavigator/Skeleton',
    component: AssetNavigator,
    args: {
        initialState: [] as AssetNavigatorLevel[],
        axiosInstance: pendingAxiosMock,
        siteId: 1,
        multiple: false,
        supportFormula: false,
        nbrSkeletonItems: 3,
    },
    parameters: {
        layout: 'padded',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
