import { describe, it, expect, vi } from 'vitest';
import { AssetNavigatorService } from '../AssetNavigatorService';
import type { AxiosInstance } from 'axios';

describe('AssetNavigatorService', () => {
    describe('fetchHierarchy - navigation and formula identity', () => {
        it('should map the new Data response format by default', async () => {
            const mockAxios = {
                get: vi.fn().mockResolvedValue({
                    data: {
                        Data: [
                            {
                                Name: 'Area - 92',
                                Description: 'Description - Element 92',
                                WebId: 'D1C009HQPI1EmMr97kyj9o0-TFm03LBSKaAOGOiuY2oXEGhc6Of0UhV8g',
                                Link: 'D1C009HQPI1EmMr97kyj9o0-TFm03LBSKaAOGOiuY2oXEGhc6Of0UhV8g/level',
                                UoM: null,
                                IsDevice: false,
                                ValueType: null,
                                IsChromUnit: false,
                                CategoryNames: [],
                                Step: false,
                            },
                        ],
                        Info: {
                            Message: 'Operation completed successfully.',
                            Type: 'Success',
                            Params: [],
                        },
                    },
                }),
            } as unknown as AxiosInstance;

            const service = new AssetNavigatorService(mockAxios, 1);
            const result = await service.fetchHierarchy('asset/area');

            expect(result.options).toHaveLength(1);
            expect(result.options[0]).toMatchObject({
                label: 'Area - 92',
                description: 'Description - Element 92',
                value: 'D1C009HQPI1EmMr97kyj9o0-TFm03LBSKaAOGOiuY2oXEGhc6Of0UhV8g/level',
                webId: 'D1C009HQPI1EmMr97kyj9o0-TFm03LBSKaAOGOiuY2oXEGhc6Of0UhV8g',
                isDevice: false,
            });
        });

        it('should allow transforming raw elements before default mapping', async () => {
            const mockAxios = {
                get: vi.fn().mockResolvedValue({
                    data: {
                        Data: [
                            {
                                assetName: 'Custom Sensor',
                                assetDescription: 'Mapped through a transformer',
                                assetLink: 'sensor/custom/data',
                                assetWebId: 'sensor/custom',
                            },
                        ],
                    },
                }),
            } as unknown as AxiosInstance;

            const service = new AssetNavigatorService(mockAxios, 1, (element) => ({
                Name: element.assetName,
                Description: element.assetDescription,
                Link: element.assetLink,
                WebId: element.assetWebId,
            }));

            const result = await service.fetchHierarchy('asset/sensor');

            expect(result.options[0].label).toBe('Custom Sensor');
            expect(result.options[0].value).toBe('sensor/custom/data');
            expect((result.options[0] as any).webId).toBe('sensor/custom');
            expect(result.options[0].description).toBe('Mapped through a transformer');
        });

        it('should use link for navigation (option.value) while webId is available for formulas', async () => {
            const mockAxios = {
                get: vi.fn().mockResolvedValue({
                    data: {
                        Data: [
                            {
                                Name: 'Supply Temperature',
                                Description: 'AHU supply temp sensor',
                                Link: 'sensor/supply-temp/data',
                                WebId: 'sensor/supply-temp',
                            },
                            {
                                Name: 'Return Temperature',
                                Description: 'AHU return temp sensor',
                                Link: 'sensor/return-temp/data',
                                WebId: 'sensor/return-temp',
                            },
                        ],
                    },
                }),
            } as unknown as AxiosInstance;

            const service = new AssetNavigatorService(mockAxios, 1);
            const result = await service.fetchHierarchy('asset/sensor');

            expect(result.options[0].value).toBe('sensor/supply-temp/data');
            expect(result.options[1].value).toBe('sensor/return-temp/data');
            expect((result.options[0] as any).webId).toBe('sensor/supply-temp');
            expect((result.options[1] as any).webId).toBe('sensor/return-temp');
            expect(result.options[0].label).toBe('Supply Temperature');
            expect(result.options[1].label).toBe('Return Temperature');
            expect(result.options[0].description).toBe('AHU supply temp sensor');
            expect(result.options[1].description).toBe('AHU return temp sensor');
        });

        it('should fallback gracefully when webId is not present', async () => {
            const mockAxios = {
                get: vi.fn().mockResolvedValue({
                    data: {
                        Data: [
                            {
                                Name: 'Plant Group',
                                Description: 'Group asset',
                                Link: 'webid/group/plant-1',
                            },
                        ],
                    },
                }),
            } as unknown as AxiosInstance;

            const service = new AssetNavigatorService(mockAxios, 1);
            const result = await service.fetchHierarchy();

            expect(result.options[0].value).toBe('webid/group/plant-1');
            expect(result.options[0].label).toBe('Plant Group');
        });

        it('should preserve navigation chain by using link values in option.value', async () => {
            const mockAxios = {
                get: vi.fn()
                    .mockResolvedValueOnce({
                        data: {
                            Data: [
                                {
                                    Name: 'Boiler Room',
                                    Description: 'Main boiler area',
                                    Link: 'webid/boiler-room',
                                },
                            ],
                        },
                    })
                    .mockResolvedValueOnce({
                        data: {
                            Data: [
                                {
                                    Name: 'Temp Sensor 01',
                                    Description: 'Temperature sensor',
                                    Link: 'webid/temp-01/data',
                                    WebId: 'webid/temp-01',
                                },
                            ],
                        },
                    }),
            } as unknown as AxiosInstance;

            const service = new AssetNavigatorService(mockAxios, 1);

            const groupResult = await service.fetchHierarchy('root');
            expect(groupResult.options[0].value).toBe('webid/boiler-room');

            const sensorResult = await service.fetchHierarchy('webid/boiler-room');
            expect(sensorResult.options[0].value).toBe('webid/temp-01/data');
            expect((sensorResult.options[0] as any).webId).toBe('webid/temp-01');
        });

        it('should provide both link (for navigation) and webId (for formulas) in sensor options', async () => {
            const mockAxios = {
                get: vi.fn().mockResolvedValue({
                    data: {
                        Data: [
                            {
                                Name: 'Flow Sensor',
                                Description: 'Air flow measurement',
                                Link: 'sensor/air-flow/data',
                                WebId: 'sensor/air-flow',
                            },
                        ],
                    },
                }),
            } as unknown as AxiosInstance;

            const service = new AssetNavigatorService(mockAxios, 1);
            const result = await service.fetchHierarchy('asset/sensors');

            expect(result.options[0].value).toBe('sensor/air-flow/data');
            expect((result.options[0] as any).webId).toBe('sensor/air-flow');
        });
    });
});