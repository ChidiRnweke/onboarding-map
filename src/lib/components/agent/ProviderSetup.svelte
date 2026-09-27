<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import ServerIcon from '@lucide/svelte/icons/server';
  import type { AssistantProvider } from '$core/model';
  import { getAgent } from '$lib/agent/agent.svelte';
  import { LOGOS } from '$lib/agent/logos';
  import { PROVIDER_ORDER, PROVIDERS } from '$lib/agent/providers';
  import { isComplete, loadKey, preset } from '$lib/agent/settings';

  /**
   * Choosing and connecting a model, shown where the learner first asked for
   * help rather than on a settings page they would have to find. Once the test
   * answers, whatever was asked runs by itself.
   *
   * Each provider's steps name the page to open, the button to press and what
   * to paste; local servers get the exact command, with this page's origin
   * already filled in.
   */
  let { ondone }: { ondone?: () => void } = $props();

  const agent = getAgent();
  const map = agent.map;
  const labels = $derived(map.labels.agent);
  const author = preset(map);

  const initial = agent.connection ?? null;
  let provider = $state<AssistantProvider>(initial?.provider ?? author?.provider ?? 'openrouter');
  const spec = $derived(PROVIDERS[provider]);
  // svelte-ignore state_referenced_locally
  let key = $state(initial?.key ?? loadKey(map, provider));
  // svelte-ignore state_referenced_locally
  let model = $state(initial?.model || author?.model || spec.defaultModel);
  // svelte-ignore state_referenced_locally
  let baseURL = $state(initial?.baseURL ?? author?.baseURL ?? spec.defaultBaseURL ?? '');
  let remember = $state(initial?.remember ?? true);
  let testing = $state(false);
  let problem = $state<string | null>(null);
  let copied = $state<string | null>(null);

  const origin = typeof location === 'undefined' ? '' : location.origin;
  const connection = $derived({ provider, model, baseURL: baseURL || undefined, remember, key });
  const complete = $derived(isComplete(connection, agent.keyless));

  function choose(id: AssistantProvider) {
    provider = id;
    const s = PROVIDERS[id];
    // The author's preset applies to the provider they named; others start from their own defaults.
    const own = author?.provider === id;
    model = (own && author?.model) || s.defaultModel;
    baseURL = (own && author?.baseURL) || s.defaultBaseURL || '';
    key = loadKey(map, id);
    problem = null;
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      copied = text;
      setTimeout(() => (copied = null), 1500);
    } catch {
      /* selectable by hand */
    }
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!complete || testing) return;
    testing = true;
    problem = null;
    const { test } = await import('$lib/agent/client');
    problem = await test(connection);
    testing = false;
    if (!problem) {
      agent.configure(connection);
      ondone?.();
    }
  }

  const field =
    'type-small mt-1 block w-full rounded-lg border border-rule bg-paper px-3 py-2 text-ink outline-none placeholder:text-muted focus:border-route';
</script>

<form class="grid gap-4 rounded-xl border border-rule bg-panel p-4" onsubmit={submit}>
  <div>
    <h3 class="type-heading m-0 text-ink">{labels.setup}</h3>
    <p class="type-small m-0 mt-1 text-ink-2">{labels.setupIntro}</p>
  </div>

  {#if !agent.keyless}
    <fieldset class="m-0 grid grid-cols-4 gap-1.5 border-0 p-0 max-sm:grid-cols-2" aria-label="Provider">
      {#each PROVIDER_ORDER as id (id)}
        {@const logo = LOGOS[id]}
        <button
          type="button"
          class="type-meta flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-1 py-2.5 text-center leading-tight {provider ===
          id
            ? 'border-route bg-route-soft text-ink'
            : 'border-rule-soft bg-paper text-ink-2 hover:border-rule hover:text-ink'}"
          aria-pressed={provider === id}
          onclick={() => choose(id)}
        >
          <span class="grid size-6 place-items-center text-[22px] text-ink">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- a bundled SVG from @lobehub/icons-static-svg -->
            {#if logo}{@html logo}{:else}<ServerIcon size={20} />{/if}
          </span>
          {PROVIDERS[id].label.replace(/ \(.*\)$/, '')}
        </button>
      {/each}
    </fieldset>

    <div>
      <p class="type-small m-0 text-ink-2">{spec.pitch}</p>
      <ol class="type-small m-0 mt-3 grid list-none gap-2.5 p-0 [counter-reset:step]">
        {#each spec.steps as step, i (i)}
          <li class="flex gap-2.5">
            <span
              class="type-meta mt-px grid size-5 flex-none place-items-center rounded-full bg-route-soft font-semibold text-route tabular-nums"
              >{i + 1}</span
            >
            <div class="min-w-0 flex-1 text-ink">
              {step.text}
              {#if step.link}
                <a
                  class="mt-0.5 flex w-fit items-center gap-1 font-semibold text-route underline-offset-2 hover:underline"
                  href={step.link.url}
                  target="_blank"
                  rel="noopener noreferrer">{step.link.label} <ExternalLinkIcon size={12} /></a
                >
              {/if}
              {#if step.command}
                {@const command = step.command.replace('{origin}', origin)}
                <div
                  class="mt-1.5 flex items-center gap-2 rounded-lg border border-rule-soft bg-paper px-3 py-1.5"
                >
                  <code class="min-w-0 flex-1 truncate font-mono text-[12.5px]" title={command}
                    >{command}</code
                  >
                  <button
                    type="button"
                    class="grid size-6 flex-none cursor-pointer place-items-center rounded-md border-0 bg-transparent text-ink-2 hover:text-ink"
                    aria-label="Copy"
                    onclick={() => copy(command)}
                    >{#if copied === command}<CheckIcon size={13} />{:else}<CopyIcon size={13} />{/if}</button
                  >
                </div>
              {/if}
            </div>
          </li>
        {/each}
      </ol>
      {#each spec.notes as note (note)}
        <p class="type-small m-0 mt-3 rounded-lg bg-paper-2 px-3 py-2 text-ink-2">{note}</p>
      {/each}
    </div>
  {/if}

  <div class="grid gap-3">
    {#if spec.needs.includes('baseURL') && !(agent.keyless && author?.baseURL)}
      <label class="type-meta block font-semibold text-ink-2"
        >Endpoint URL
        <input
          class={field}
          type="url"
          required
          bind:value={baseURL}
          placeholder={spec.baseURLHint}
          autocomplete="off"
        />
      </label>
    {/if}
    {#if spec.needs.includes('key') && !agent.keyless}
      <label class="type-meta block font-semibold text-ink-2"
        >API key
        <input
          class="{field} font-mono"
          type="password"
          bind:value={key}
          placeholder={spec.keyHint}
          autocomplete="off"
          spellcheck="false"
        />
      </label>
    {/if}
    {#if spec.needs.includes('model')}
      <label class="type-meta block font-semibold text-ink-2"
        >{provider === 'azure' ? 'Deployment name' : 'Model'}
        <input
          class="{field} font-mono"
          bind:value={model}
          placeholder={spec.modelHint ?? spec.defaultModel}
          autocomplete="off"
          spellcheck="false"
        />
      </label>
    {/if}
    {#if !agent.keyless}
      <label class="type-small flex cursor-pointer items-center gap-2 text-ink-2">
        <input type="checkbox" class="accent-(--route)" bind:checked={remember} />
        Remember on this device (otherwise only until this tab closes)
      </label>
    {/if}
  </div>

  {#if problem}
    <p class="type-small m-0 rounded-lg border border-rule bg-paper px-3 py-2 text-ink" role="alert">
      {problem}
    </p>
  {/if}

  <button
    type="submit"
    class="type-small cursor-pointer justify-self-start rounded-full border border-route bg-route px-4 py-1.5 font-semibold text-paper disabled:cursor-default disabled:opacity-50"
    disabled={!complete || testing}>{testing ? 'Testing…' : labels.test}</button
  >
</form>
