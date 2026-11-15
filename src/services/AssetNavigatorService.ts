import { AxiosInstance, AxiosResponse } from 'axios';
import { AssetNavigatorDataTransformer, AssetNavigatorLevel, DcpHierarchyResponse, DcpResponse } from '@/types/AssetNavigator';
import NavigatorLevelType from '@/enums/NavigatorLevelType';

function uncapitalizeKeys<T extends Record<string, unknown>>(
    obj: T,
    renames: Record<string, string> = {}
): { [K in keyof T as Uncapitalize<string & K>]: T[K] } {
    return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => {
            const lowKey = k.charAt(0).toLowerCase() + k.slice(1)
            return [renames[lowKey] ?? lowKey, v]
        })
    ) as any
}

function mapLinkToLevelType(link: string | null | undefined): NavigatorLevelType {
  const value = (link ?? '').toLowerCase()
  const match = value.match(/\/(level|group|sensor)(?:\?|$)/)

  switch (match?.[1]) {
    case 'level':
      return NavigatorLevelType.Level
    case 'group':
      return NavigatorLevelType.Group
    case 'sensor':
      return NavigatorLevelType.Sensor
    default:
      return NavigatorLevelType.Level
  }
}

export class AssetNavigatorService {
    private axios: AxiosInstance;
    private defaultSiteId: number;
    private dataTransformer?: AssetNavigatorDataTransformer;

    constructor(axiosInstance: AxiosInstance, defaultSiteId: number, dataTransformer?: AssetNavigatorDataTransformer) {
        this.axios = axiosInstance;
        this.defaultSiteId = defaultSiteId;
        this.dataTransformer = dataTransformer;
    }

    async fetchHierarchy(link?: string, siteId?: number): Promise<AssetNavigatorLevel> {
        const effectiveSiteId = siteId ?? this.defaultSiteId;

        if (!effectiveSiteId) {
            throw new Error('Site ID is required');
        }

        let requestUrl = `/${effectiveSiteId}/asset-hierarchy/hierarchy/next`;
        if (link) {
            requestUrl += `?link=${encodeURIComponent(link)}`;
        }

        const response: AxiosResponse<DcpResponse<DcpHierarchyResponse>> = await this.axios.get(requestUrl);
        return {
            value: null,
            options: response.data.Data.map((el: any) => {
                const transformedElement = this.dataTransformer?.(el) ?? el;
                const base = uncapitalizeKeys(transformedElement as any) as any;
                const { link, ...baseWithoutLink } = base;
                return {
                    ...baseWithoutLink,
                    label: base.name,
                    value: link ?? base.webId ?? null,
                    webId: base.webId,
                    isDevice: base.isDevice === true,
                };
            }),
            levelType: mapLinkToLevelType(link)
        };
    }

    async fetchElementMetaData(webId: string, siteId?: number, signal?: AbortSignal): Promise<any> {
        const effectiveSiteId = siteId ?? this.defaultSiteId;
        const requestUrl = `/${effectiveSiteId}/asset-hierarchy/hierarchy/${webId}/meta-data`;
        const response = await this.axios.get(requestUrl, { signal });
        return response.data;
    }
}
