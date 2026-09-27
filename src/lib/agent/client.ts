import {
  createModels,
  createProvider,
  type Api,
  type AssistantMessageEventStream,
  type Context,
  type Model,
  type MutableModels,
  type Provider,
} from '@earendil-works/pi-ai';
import { PROVIDERS, type ProviderSpec } from './providers';
import type { Connection } from './settings';

/**
 * The assistant's line to a model, through pi-ai, straight from the browser.
 *
 * Each provider is imported only when it is chosen, so a map whose learners
 * never use the assistant downloads none of this, and one who picks Claude
 * downloads only Anthropic's SDK. pi-ai already asks each SDK to allow browser
 * use (and sends Anthropic's direct-browser header).
 */
export interface AgentClient {
  model: Model<Api>;
  /** Shown under answers: which model wrote them. */
  label: string;
  stream(context: Context, signal: AbortSignal): AssistantMessageEventStream;
}

/** A local server or a proxy: an OpenAI-compatible endpoint pi-ai has no catalog for. */
function compatibleModel(c: Connection, spec: ProviderSpec): Model<'openai-completions'> {
  return {
    id: c.model,
    name: c.model,
    api: 'openai-completions',
    provider: c.provider,
    baseUrl: (c.baseURL || spec.defaultBaseURL || '').replace(/\/+$/, ''),
    reasoning: false,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 32_768,
    maxTokens: 4_096,
    // Local servers and gateways implement the common core of the API only.
    compat: {
      supportsStore: false,
      supportsDeveloperRole: false,
      supportsReasoningEffort: false,
      maxTokensField: 'max_tokens',
    },
  };
}

async function builtinProvider(spec: ProviderSpec): Promise<Provider> {
  switch (spec.piProvider) {
    case 'openai':
      return (await import('@earendil-works/pi-ai/providers/openai')).openaiProvider();
    case 'anthropic':
      return (await import('@earendil-works/pi-ai/providers/anthropic')).anthropicProvider();
    case 'google':
      return (await import('@earendil-works/pi-ai/providers/google')).googleProvider();
    case 'openrouter':
      return (await import('@earendil-works/pi-ai/providers/openrouter')).openrouterProvider();
    case 'azure-openai-responses':
      return (
        await import('@earendil-works/pi-ai/providers/azure-openai-responses')
      ).azureOpenAIResponsesProvider();
    default:
      throw new Error(`no built-in provider for ${spec.piProvider}`);
  }
}

/**
 * The catalog's entry for the model, or one shaped like its neighbours: a new
 * model or an Azure deployment name is not in pi-ai's catalog, and the
 * provider still accepts it.
 */
function catalogModel(provider: Provider, spec: ProviderSpec, id: string): Model<Api> {
  const catalog = provider.getModels();
  const found = catalog.find((m) => m.id === id);
  // OpenRouter's Anthropic-compatible endpoint refuses browser calls (its CORS
  // does not allow Anthropic's direct-browser header), and pi-ai's catalog
  // sends Claude models there. Its OpenAI-compatible endpoint serves every
  // model and accepts them, so from the browser everything goes through it.
  const api = spec.piProvider === 'openrouter' ? 'openai-completions' : found?.api;
  if (found && found.api === api) return found;
  const template = catalog.find((m) => m.api === (api ?? 'openai-completions')) ?? catalog[0];
  return {
    ...template,
    ...(found ?? {}),
    api: template.api,
    baseUrl: template.baseUrl,
    id,
    name: found?.name ?? id,
  };
}

export async function connect(c: Connection): Promise<AgentClient> {
  const spec = PROVIDERS[c.provider];
  const models: MutableModels = createModels();
  let model: Model<Api>;

  if (spec.piProvider === 'openai-compatible') {
    model = compatibleModel(c, spec);
    const { openAICompletionsApi } = await import('@earendil-works/pi-ai/api/openai-completions.lazy');
    models.setProvider(
      createProvider({
        id: c.provider,
        name: spec.label,
        baseUrl: model.baseUrl,
        // The key, if any, is passed with each request; a keyless server needs nothing here.
        auth: { apiKey: { name: spec.label, resolve: async () => ({ auth: {} }) } },
        models: [model],
        api: openAICompletionsApi(),
      }),
    );
  } else {
    const provider = await builtinProvider(spec);
    models.setProvider(provider);
    model = catalogModel(provider, spec, c.model);
  }

  const azure = c.provider === 'azure' ? { azureBaseUrl: c.baseURL, azureDeploymentName: c.model } : {};

  return {
    model,
    label: model.name || model.id,
    stream: (context, signal) =>
      models.stream(model, context, {
        // The OpenAI SDK refuses to run without a key; a keyless endpoint ignores this one.
        apiKey: c.key || 'none',
        signal,
        maxTokens: Math.min(model.maxTokens, 4_096),
        // A browser does not let a page set its User-Agent, and a preflight
        // that asks to may be refused; leave it to the browser.
        transformHeaders: (headers) => ({ ...headers, 'User-Agent': null }),
        ...azure,
      }),
  };
}

/**
 * What went wrong, said as what to do about it. Provider messages are kept
 * after the advice: they are often the most specific thing we have.
 */
export function explain(error: string, c: Pick<Connection, 'provider'>): string {
  const spec = PROVIDERS[c.provider];
  const e = error.toLowerCase();
  if (/\b401\b|invalid.*(api[ _-]?key|x-api-key)|unauthori[sz]ed|incorrect api key/.test(e))
    return `${spec.label} did not accept the key. Check it was copied whole, and that it has not been revoked.`;
  if (/\b402\b|insufficient|credit|quota|billing|balance/.test(e))
    return `${spec.label} refused the request for billing: add credit to the account the key belongs to.`;
  if (/\b404\b|model.*not.*found|does not exist|deploymentnotfound|unknown model/.test(e))
    return c.provider === 'azure'
      ? 'Azure has no deployment by that name at this URL. The model field is the deployment name.'
      : `${spec.label} does not know that model id. Check it against the provider's list.`;
  if (/\b429\b|rate.?limit/.test(e))
    return `${spec.label} is rate limiting this key. Wait a minute and try again.`;
  if (/failed to fetch|networkerror|load failed|cors|connection error|fetch failed/.test(e)) {
    // OpenAI answers a refused key without the header that lets a page read
    // the answer, so a bad key looks like a network failure from here.
    if (c.provider === 'openai')
      return 'OpenAI refused the request. Most often the key is wrong or the account has no credit; OpenAI does not tell web pages which.';
    return spec.piProvider === 'openai-compatible' && c.provider !== 'custom'
      ? `Could not reach ${spec.label}. Is it running, and started so this page may call it (see the steps)?`
      : `The browser could not reach ${spec.label}. The provider may not accept calls from web pages; ${
          c.provider === 'azure' ? 'ask for a proxy URL and use "Your organisation".' : 'check your network.'
        }`;
  }
  return error;
}

/**
 * One tiny request, to find out now rather than mid-answer whether the key,
 * the model and the endpoint work. Resolves to a sentence saying what to fix,
 * or null when it answered.
 */
export async function test(c: Connection): Promise<string | null> {
  try {
    const client = await connect(c);
    const stream = client.stream(
      { messages: [{ role: 'user', content: 'Reply with the word ready.', timestamp: Date.now() }] },
      AbortSignal.timeout(30_000),
    );
    const message = await stream.result();
    return message.stopReason === 'error' ? explain(message.errorMessage ?? 'Unknown error', c) : null;
  } catch (error) {
    return explain(error instanceof Error ? error.message : String(error), c);
  }
}
