import NavigatorLevelType from '@/enums/NavigatorLevelType';

type DeviceOption = {
    value: string;
    isDevice?: boolean;
};

const isDeviceOption = (value: string, options: DeviceOption[]): boolean =>
    options.some((option) => option.value === value && option.isDevice === true);

export const isSelectedValueDevice = (
    value: null | string | string[],
    options: DeviceOption[]
): boolean => {
    if (Array.isArray(value)) {
        return value.length > 0 && value.every((item) => isDeviceOption(item, options));
    }

    return !!value && isDeviceOption(value, options);
};

export const deriveSelectedDeviceValue = (
    levels: Array<{
        levelType: NavigatorLevelType;
        value: null | string | string[];
        options: DeviceOption[];
    }>
): null | string | string[] => {
    for (const level of levels) {
        const currentValue = level.value;

        if (!currentValue) {
            continue;
        }

        if (
            level.levelType === NavigatorLevelType.Device ||
            isSelectedValueDevice(currentValue, level.options)
        ) {
            return currentValue;
        }
    }

    return null;
};