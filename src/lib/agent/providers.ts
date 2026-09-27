// A relative import, not $core: the docs site renders this table too (docs/src/components/ProviderGuide.astro).
import type { AssistantProvider } from '../../core/model';

/**
 * Every provider the assistant can run on, and exactly how a learner sets one
 * up. One table drives the connection, the setup shown where the learner first
 * asks, and the docs page, so a moved console link is fixed in one place.
 * Logos live in logos.ts, loaded only with the setup.
 *
 * Steps name the page to open, the button to press and what to paste. A step
 * that only says "get an API key" leaves the learner to find the page, which
 * is the part they needed help with.
 */

/** What the setup asks the learner for. */
export type Field = 'key' | 'baseURL' | 'model';

export interface GuideStep {
  /** One instruction. `{origin}` is this page's origin, filled in where it is shown. */
  text: string;
  /** The page the step happens on. */
  link?: { label: string; url: string };
  /** A command to copy, e.g. starting a local server. */
  command?: string;
}

export interface ProviderSpec {
  id: AssistantProvider;
  label: string;
  /** One line: why pick this one. */
  pitch: string;
  needs: Field[];
  /** pi-ai's provider id: which catalog and API implementation to use. */
  piProvider:
    'openai' | 'anthropic' | 'google' | 'openrouter' | 'azure-openai-responses' | 'openai-compatible';
  /** Offered in the model field; any id the provider accepts works. */
  defaultModel: string;
  /** Default endpoint for local servers. */
  defaultBaseURL?: string;
  /** What a key looks like, shown as the field's placeholder. */
  keyHint?: string;
  modelHint?: string;
  baseURLHint?: string;
  steps: GuideStep[];
  /** Said plainly because people get stuck on it. */
  notes: string[];
}

export const PROVIDERS: Record<AssistantProvider, ProviderSpec> = {
  openai: {
    id: 'openai',
    label: 'OpenAI',
    pitch: 'GPT models, billed to your OpenAI account.',
    needs: ['key', 'model'],
    piProvider: 'openai',
    defaultModel: 'gpt-5.4-mini',
    keyHint: 'sk-…',
    steps: [
      {
        text: 'Sign in and open API keys, then press "Create new secret key". Copy it now: it is shown once.',
        link: { label: 'platform.openai.com/api-keys', url: 'https://platform.openai.com/api-keys' },
      },
      {
        text: 'Add credit under Billing. A new account has none, and requests fail until it does.',
        link: {
          label: 'Billing',
          url: 'https://platform.openai.com/settings/organization/billing/overview',
        },
      },
      { text: 'Paste the key below.' },
    ],
    notes: ['A ChatGPT subscription does not include API access; the API is billed separately.'],
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    pitch: 'Claude models, billed to your Anthropic Console account.',
    needs: ['key', 'model'],
    piProvider: 'anthropic',
    defaultModel: 'claude-sonnet-5',
    keyHint: 'sk-ant-…',
    steps: [
      {
        text: 'Sign in to the Claude Console, open API keys and press "Create Key". Copy it now: it is shown once.',
        link: {
          label: 'platform.claude.com/settings/keys',
          url: 'https://platform.claude.com/settings/keys',
        },
      },
      {
        text: 'Buy credit under Billing; the API does not work on an empty balance.',
        link: { label: 'Billing', url: 'https://platform.claude.com/settings/billing' },
      },
      { text: 'Paste the key below.' },
    ],
    notes: ['A Claude.ai Pro or Max plan does not include API access; the Console is billed separately.'],
  },
  google: {
    id: 'google',
    label: 'Google Gemini',
    pitch: 'Gemini models, with a free tier to start on.',
    needs: ['key', 'model'],
    piProvider: 'google',
    defaultModel: 'gemini-3.5-flash',
    keyHint: 'AIza…',
    steps: [
      {
        text: 'Sign in to Google AI Studio and press "Create API key". Pick or create a Google Cloud project when asked.',
        link: { label: 'aistudio.google.com/apikey', url: 'https://aistudio.google.com/apikey' },
      },
      { text: 'Paste the key below.' },
    ],
    notes: ['The free tier has low rate limits; if answers stop mid-way, wait a minute or add billing.'],
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    pitch: 'One key for models from every vendor, Claude and GPT included.',
    needs: ['key', 'model'],
    piProvider: 'openrouter',
    defaultModel: 'anthropic/claude-sonnet-5',
    keyHint: 'sk-or-…',
    modelHint: 'vendor/model, e.g. anthropic/claude-sonnet-5',
    steps: [
      {
        text: 'Sign in, open Keys and press "Create". Copy it now: it is shown once.',
        link: { label: 'openrouter.ai/settings/keys', url: 'https://openrouter.ai/settings/keys' },
      },
      {
        text: 'Add credit; most models need it.',
        link: { label: 'Credits', url: 'https://openrouter.ai/settings/credits' },
      },
      {
        text: 'Pick a model and copy its id (the vendor/model line under its name). It must support tool calling.',
        link: {
          label: 'openrouter.ai/models',
          url: 'https://openrouter.ai/models?supported_parameters=tools',
        },
      },
      { text: 'Paste the key and the model id below.' },
    ],
    notes: [],
  },
  azure: {
    id: 'azure',
    label: 'Azure OpenAI',
    pitch: "OpenAI models in your organisation's Azure subscription.",
    needs: ['baseURL', 'key', 'model'],
    piProvider: 'azure-openai-responses',
    defaultModel: '',
    keyHint: 'the deployment’s key',
    modelHint: 'your deployment name, e.g. gpt-5-mini',
    baseURLHint: 'https://<resource>.openai.azure.com',
    steps: [
      {
        text: 'Open Azure AI Foundry, then your project, then "Models + endpoints".',
        link: { label: 'ai.azure.com', url: 'https://ai.azure.com' },
      },
      {
        text: 'Deploy a model if the list is empty ("Deploy model", then "Deploy base model"). Note the deployment name you give it.',
      },
      {
        text: 'Open the deployment. Copy the Target URI up to and including the host (https://<resource>.openai.azure.com) and the Key.',
      },
      { text: 'Paste the URL, the key and the deployment name below.' },
    ],
    notes: [
      'The model field is your deployment name, not the model family.',
      'Azure may refuse calls made straight from a browser. If the test says the request was blocked, ask whoever runs your Azure subscription for a proxy URL and choose "Your organisation" instead.',
    ],
  },
  ollama: {
    id: 'ollama',
    label: 'Ollama',
    pitch: 'Runs on your own machine; nothing leaves it.',
    needs: ['model'],
    piProvider: 'openai-compatible',
    defaultModel: 'qwen3',
    defaultBaseURL: 'http://localhost:11434/v1',
    modelHint: 'a model you have pulled, e.g. qwen3',
    steps: [
      {
        text: 'Install Ollama.',
        link: { label: 'ollama.com/download', url: 'https://ollama.com/download' },
      },
      { text: 'Download a model that can call tools.', command: 'ollama pull qwen3' },
      {
        text: 'Quit Ollama if it is running, then start it allowing this page to reach it.',
        command: 'OLLAMA_ORIGINS={origin} ollama serve',
        link: { label: 'Allowing browser access', url: 'https://docs.ollama.com/faq' },
      },
    ],
    notes: ['Small models follow the map less well; pick the largest your machine runs comfortably.'],
  },
  lmstudio: {
    id: 'lmstudio',
    label: 'LM Studio',
    pitch: 'Runs on your own machine, with a desktop app to manage models.',
    needs: ['model'],
    piProvider: 'openai-compatible',
    defaultModel: '',
    defaultBaseURL: 'http://localhost:1234/v1',
    modelHint: 'the model id shown in the Developer tab',
    steps: [
      {
        text: 'Install LM Studio and download a model that can call tools.',
        link: { label: 'lmstudio.ai', url: 'https://lmstudio.ai' },
      },
      {
        text: 'Open the Developer tab, load the model, turn on "Enable CORS" in the server settings and start the server.',
      },
      { text: "Copy the model's id from the Developer tab and paste it below." },
    ],
    notes: [],
  },
  custom: {
    id: 'custom',
    label: 'Your organisation',
    pitch: 'An OpenAI-compatible endpoint your organisation runs.',
    needs: ['baseURL', 'key', 'model'],
    piProvider: 'openai-compatible',
    defaultModel: '',
    baseURLHint: 'https://…/v1',
    keyHint: 'if your endpoint needs one',
    steps: [
      {
        text: 'Ask whoever runs your internal AI gateway for its OpenAI-compatible URL (it usually ends in /v1), a key if it needs one, and a model name.',
      },
      { text: 'Paste them below.' },
    ],
    notes: [],
  },
};

export const PROVIDER_ORDER: AssistantProvider[] = [
  'openrouter',
  'anthropic',
  'openai',
  'google',
  'azure',
  'ollama',
  'lmstudio',
  'custom',
];
