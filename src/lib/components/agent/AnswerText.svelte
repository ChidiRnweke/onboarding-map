<script lang="ts">
  import { Markdown } from '$lib/components/ai/markdown';

  // An answer's text as markdown (sv-prompt-kit, on streamdown). Its own module
  // because the renderer is most of the assistant's weight: the setup and the
  // touched rows do not wait for it.
  let { text }: { text: string } = $props();
</script>

<Markdown
  content={text}
  class="type-small min-w-0 text-ink [&_a]:text-route [&_code]:text-[0.92em] [&_ol]:pl-5 [&_p]:my-2 [&_ul]:pl-5"
/>
