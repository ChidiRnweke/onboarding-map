<script lang="ts">
  import * as Tooltip from '$lib/components/shadcn/tooltip/index.js';
  import { cn, type WithElementRef } from '$lib/utils.js';
  import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON } from './constants.js';
  import { setSidebar } from './context.svelte.js';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    open = $bindable(true),
    onOpenChange = () => {},
    shortcut,
    class: className,
    style,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    shortcut?: string;
  } = $props();

  const sidebar = setSidebar({
    open: () => open,
    setOpen: (value: boolean) => {
      open = value;
      // Persistence is left to the caller (the page is prerendered, so a
      // cookie would never reach the server that could read it).
      onOpenChange(value);
    },
    get shortcut() {
      return shortcut;
    },
  });
</script>

<svelte:window onkeydown={sidebar.handleShortcutKeydown} />

<Tooltip.Provider delayDuration={0}>
  <div
    data-slot="sidebar-wrapper"
    style="--sidebar-width: {SIDEBAR_WIDTH}; --sidebar-width-icon: {SIDEBAR_WIDTH_ICON}; {style}"
    class={cn('group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar', className)}
    bind:this={ref}
    {...restProps}
  >
    {@render children?.()}
  </div>
</Tooltip.Provider>
