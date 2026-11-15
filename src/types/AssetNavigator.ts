import NavigatorLevelType from "@/enums/NavigatorLevelType";

export type FunctionInput = string | {
    label: string;
    value?: string;
    description?: string;
    data?: Record<string, any>;
};

export type FormulaDescriptionVisibility = {
    variables?: boolean;
    operators?: boolean;
    functions?: boolean;
};

export interface DcpResponse<T> {
    Data: T[];
    Info: {
        Message: string;
        Params: any[];
        Type:  string;
    }
}

export interface DcpHierarchyResponse {
    CategoryNames: string[];
    Description: string;
    IsChromUnit: boolean;
    IsDevice: boolean;
    Link: string;
    Name: string;
    Step: boolean;
    UoM: string | null;
    ValueType: string | null;
    WebId: string;
}

export interface AssetNavigatorOption {
    label: string;
    description: string;
    value: string;
    isDevice?: boolean;
}

export interface AssetNavigatorSensorOption extends AssetNavigatorOption {
    step: boolean;
    uom: string;
    categoryNames: string[];
    valueType: string;
}

export interface AssetNavigatorSelection {
    value: null | string | string[];
    isDevice: boolean;
}

export type AssetNavigatorDataTransformer = (element: Record<string, unknown>) => Record<string, unknown>;

export interface AssetNavigatorLevel {
    levelType: NavigatorLevelType;
    options: (AssetNavigatorOption | AssetNavigatorSensorOption)[];
    value: null | string | string[];
}

export type AssetNavigatorChange = {
    levels: AssetNavigatorLevel[]
    selectedDeviceValue?: null | string | string[]
    selectedSensorValues?: string[] | null
    allSelectedSensorValues: string[]
    formulaEnabled: boolean
    formula?: unknown | null
    complete: boolean
    isFormulaApply: boolean
}
