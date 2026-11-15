import AssetNavigator from "@/components/AssetNavigator.vue";
import NavigatorLevelType from "@/enums/NavigatorLevelType";
import { AssetNavigatorService } from "@/services/AssetNavigatorService";

const dcpComponents = {
  AssetNavigator
};

export default {
  install(app: any) {
    for (const [name, component] of Object.entries(dcpComponents)) {
      app.component(name, component);
    }
  },
};

export {
  AssetNavigator
};

export { AssetNavigatorService };
export { NavigatorLevelType };
export type { AssetNavigatorOption, AssetNavigatorChange } from '@/types/AssetNavigator';
export { useTranslation } from '@/composables/useTranslation';
export type { TranslatorLike } from '@/composables/useTranslation';
