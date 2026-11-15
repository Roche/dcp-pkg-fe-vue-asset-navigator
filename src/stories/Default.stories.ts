import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { AxiosInstance } from 'axios';
import AssetNavigator from '../components/AssetNavigator.vue';
import type { AssetNavigatorLevel } from '../types/AssetNavigator';
import NavigatorLevelType from '../enums/NavigatorLevelType';
import { useI18n } from 'vue-i18n';
import '@open-dcp/vue-equation-editor/style.css';

type ApiElement = {
    Name: string;
    Description: string;
    Link: string;
    WebId?: string;
};

type TransformerApiElement = {
    assetName: string;
    assetDescription: string;
    assetLink: string;
    assetWebId?: string;
};

const hierarchyByLink: Record<string, ApiElement[]> = {
    root: [
        { Name: 'Building A', Description: 'Top level asset', Link: 'webid/building-a' },
        { Name: 'Building B', Description: 'Another top level asset', Link: 'webid/building-b' },
    ],
    'webid/building-a': [
        { Name: 'Boiler Room', Description: 'Area under Building A', Link: 'webid/boiler-room' },
        { Name: 'Electrical', Description: 'Electrical systems', Link: 'webid/electrical' },
    ],
    'webid/boiler-room': [
        { Name: 'Temp Sensor 01', Description: 'Temperature sensor', Link: 'webid/temp-01/data', WebId: 'webid/temp-01' },
        { Name: 'Pressure Sensor 01', Description: 'Pressure sensor', Link: 'webid/press-01/data', WebId: 'webid/press-01' },
    ],
    'asset/sensor': [
        { Name: 'Supply Temp', Description: 'AHU supply temperature', Link: 'sensor/supply-temp/data', WebId: 'sensor/supply-temp' },
        { Name: 'Return Temp', Description: 'AHU return temperature', Link: 'sensor/return-temp/data', WebId: 'sensor/return-temp' },
        { Name: 'Air Flow', Description: 'AHU air flow', Link: 'sensor/air-flow/data', WebId: 'sensor/air-flow' },
    ],
};

const formulaInitialState: AssetNavigatorLevel[] = [
    {
        levelType: NavigatorLevelType.Level,
        options: [
            {
                label: 'Plant 1',
                description: 'Main plant',
                value: 'asset/group/plant-1',
            },
        ],
        value: 'asset/group/plant-1',
    },
    {
        levelType: NavigatorLevelType.Group,
        options: [
            {
                label: 'AHU 01',
                description: 'Air handling unit',
                value: 'asset/sensor',
            },
        ],
        value: 'asset/sensor',
    },
];

function parseLink(url: string): string {
    const match = /[?&]link=([^&]+)/.exec(url);
    return match ? decodeURIComponent(match[1]) : 'root';
}

const axiosMock = {
    async get(url: string, config?: { signal?: AbortSignal }) {
        const link = parseLink(url);
        return {
            data: {
                Data: hierarchyByLink[link] ?? [],
                Errors: [],
                Warnings: [],
            },
        };
    },
} as unknown as AxiosInstance;

const transformerHierarchyByLink: Record<string, TransformerApiElement[]> = {
    root: [
        {
            assetName: 'Building C',
            assetDescription: 'Top level asset mapped by transformer',
            assetLink: 'webid/building-c',
        },
    ],
    'webid/building-c': [
        {
            assetName: 'Transformer Room',
            assetDescription: 'Area under Building C',
            assetLink: 'webid/transformer-room',
        },
    ],
    'webid/transformer-room': [
        {
            assetName: 'Transformer Temp Sensor',
            assetDescription: 'Temperature sensor normalized by transformer',
            assetLink: 'webid/transformer-temp/data',
            assetWebId: 'webid/transformer-temp',
        },
    ],
};

const dataTransformer = (element: Record<string, unknown>) => {
    const raw = element as unknown as TransformerApiElement;

    return {
        Name: raw.assetName,
        Description: raw.assetDescription,
        Link: raw.assetLink,
        WebId: raw.assetWebId,
    };
};

const axiosTransformerMock = {
    async get(url: string) {
        const link = parseLink(url);
        return {
            data: {
                Data: transformerHierarchyByLink[link] ?? [],
                Errors: [],
                Warnings: [],
            },
        };
    },
} as unknown as AxiosInstance;

const meta: Meta<typeof AssetNavigator> = {
    title: 'Components/AssetNavigator/Default',
    component: AssetNavigator,
    args: {
        initialState: [] as AssetNavigatorLevel[],
        startLink: 'webid/building-a',
        axiosInstance: axiosMock,
        siteId: 1,
        multiple: false,
        supportFormula: false,
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FormulaEditor: Story = {
    args: {
        supportFormula: true,
        formulaOnly: true,
        initialState: formulaInitialState,
    },
    render: (args) => ({
        components: { AssetNavigator },
        setup() {
            const { t } = useI18n();
            return { args, t };
        },
        template: `
            <AssetNavigator 
                v-bind="args"
                :translation="{ translator: t, translationPrefix: '@open-dcp/i18n' }"
            />
        `
    })
};

export const DisabledVisible: Story = {
    args: {
        startLink: 'webid/building-a',
        disabledIds: ['webid/boiler-room', 'webid/electrical'],
        hideDisabledIds: false,
    },
    render: (args) => ({
        components: { AssetNavigator },
        setup() {
            const { t } = useI18n();
            return { args, t };
        },
        template: `
            <div>
                <p style="margin-bottom: 1rem; font-size: 0.9rem; color: #666;">
                    Boiler Room and Electrical are disabled but visible in the dropdown
                </p>
                <AssetNavigator 
                    v-bind="args"
                    :translation="{ translator: t, translationPrefix: '@open-dcp/i18n' }"
                />
            </div>
        `
    })
};

export const DisabledHidden: Story = {
    args: {
        startLink: 'webid/building-a',
        disabledIds: ['webid/boiler-room', 'webid/electrical'],
        hideDisabledIds: true,
    },
    render: (args) => ({
        components: { AssetNavigator },
        setup() {
            const { t } = useI18n();
            return { args, t };
        },
        template: `
            <div>
                <p style="margin-bottom: 1rem; font-size: 0.9rem; color: #666;">
                    Boiler Room and Electrical are hidden from the dropdown
                </p>
                <AssetNavigator 
                    v-bind="args"
                    :translation="{ translator: t, translationPrefix: '@open-dcp/i18n' }"
                />
            </div>
        `
    })
};


export const TooltipRequestCancellation: Story = {
    args: {
        startLink: 'webid/building-a',
        axiosInstance: {
            async get(url: string, config?: { signal?: AbortSignal }) {
                const isMetaData = /\/meta-data$/.test(url);
                if (isMetaData) {
                    const match = url.match(/\/hierarchy\/([^/]+)\/meta-data/);
                    const webId = match?.[1] || 'unknown';
                    console.log('[HTTP] Metadata request started for:', webId);
                    try {
                        const response = await fetch(`https://httpbingo.org/delay/3?webId=${webId}`, { signal: config?.signal });
                        const data = await response.json();
                        console.log('[HTTP] Metadata fetched successfully for:', webId);
                        return { data: { description: `Metadata loaded for webId: ${webId}` } };
                    } catch (e) {
                        console.log('[HTTP] Metadata request ABORTED/FAILED for:', webId);
                        throw e;
                    }
                }
                // For hierarchy requests, use mock data
                const link = parseLink(url);
                return {
                    data: { Data: hierarchyByLink[link] ?? [], Errors: [], Warnings: [] },
                };
            },
        } as unknown as AxiosInstance,
    },
    render: (args) => ({
        components: { AssetNavigator },
        setup() {
            const { t } = useI18n();
            return { args, t };
        },
        template: `
            <div>
                <p style="margin-bottom: 1rem; font-size: 0.9rem; color: #666;">
                    Hover an item to trigger a <strong>3-second</strong> real HTTP request to httpbin.org.
                    Move the cursor away before it finishes — the in-flight request will be
                    aborted (visible in Network tab and console). Hovering again retries the fetch.
                </p>
                <AssetNavigator
                    v-bind="args"
                    :translation="{ translator: t, translationPrefix: '@open-dcp/i18n' }"
                />
            </div>
        `
    })
};

export const WithTransformer: Story = {
    args: {
        startLink: 'webid/building-c',
        axiosInstance: axiosTransformerMock,
        dataTransformer,
    },
    render: (args) => ({
        components: { AssetNavigator },
        setup() {
            const { t } = useI18n();
            return { args, t };
        },
        template: `
            <div>
                <p style="margin-bottom: 1rem; font-size: 0.9rem; color: #666;">
                    Raw backend fields are normalized through the dataTransformer prop before mapping.
                </p>
                <AssetNavigator
                    v-bind="args"
                    :translation="{ translator: t, translationPrefix: '@open-dcp/i18n' }"
                />
            </div>
        `
    })
};