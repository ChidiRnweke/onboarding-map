// A relative import, not $core: the docs site renders this table too (docs/src/components/ProviderGuide.astro).
import type { AssistantProvider } from '../../core/model';
import openai from '@lobehub/icons-static-svg/icons/openai.svg?raw';
import anthropic from '@lobehub/icons-static-svg/icons/anthropic.svg?raw';
import gemini from '@lobehub/icons-static-svg/icons/gemini.svg?raw';
import openrouter from '@lobehub/icons-static-svg/icons/openrouter.svg?raw';
import azure from '@lobehub/icons-static-svg/icons/azure.svg?raw';
import ollama from '@lobehub/icons-static-svg/icons/ollama.svg?raw';
import lmstudio from '@lobehub/icons-static-svg/icons/lmstudio.svg?raw';

/**
 * Provider marks, monochrome (currentColor) from @lobehub/icons-static-svg
 * (MIT), so they take the panel's ink rather than seven brand colours. Kept
 * apart from providers.ts so only the setup downloads them. A custom endpoint
 * has no mark; the setup shows a generic one.
 */
export const LOGOS: Partial<Record<AssistantProvider, string>> = {
  openai,
  anthropic,
  google: gemini,
  openrouter,
  azure,
  ollama,
  lmstudio,
};
