import { BaseProvider, getOpenAILikeModel } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';

export default class SiliconBasedProvider extends BaseProvider {
  name = '硅基';
  getApiKeyLink = 'https://cloud.siliconflow.cn/account/ak';

  config = {
    baseUrlKey: 'SILICON_BASED_API_BASE_URL',
    apiTokenKey: 'SILICON_BASED_API_KEY',
  };

  staticModels: ModelInfo[] = [
    { name: 'silicon-base', label: '硅基-Base', provider: '硅基', maxTokenAllowed: 8000 },
    { name: 'silicon-pro', label: '硅基-Pro', provider: '硅基', maxTokenAllowed: 16000 },
  ];

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'SILICON_BASED_API_BASE_URL',
      defaultApiTokenKey: 'SILICON_BASED_API_KEY',
    });
    const baseUrl = 'https://api.siliconflow.cn/v1';

    if (!baseUrl || !apiKey) {
      throw new Error(`Missing configuration for ${this.name} provider`);
    }

    return getOpenAILikeModel(baseUrl, apiKey, model);
  }
  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'SILICON_BASED_API_BASE_URL',
      defaultApiTokenKey: 'SILICON_BASED_API_KEY',
    });
    const baseUrl = 'https://api.siliconflow.cn/v1';

    if (!baseUrl || !apiKey) {
      return [];
    }

    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      console.log(`${baseUrl}/models`, `Bearer ${apiKey}`);

      const res = (await response.json()) as any;
      const staticModelIds = this.staticModels.map((m) => m.name);

      // 根据实际API响应格式调整过滤条件
      const data = res.data.filter((model: any) => !staticModelIds.includes(model.id));

      return data.map((m: any) => ({
        name: m.id,
        label: m.id,
        provider: this.name,
        maxTokenAllowed: m.context_window || 8000,
      }));
    } catch (error) {
      console.error('Error fetching models from 硅基:', error);
      return [];
    }
  }
}
