<script lang="ts">
  import type { Layout } from '$lib/map/layout';
  import { getAppState } from '$lib/state.svelte';

  let { layout }: { layout: Layout } = $props();

  const app = getAppState();

  // Cross-links are only drawn for whatever the pointer or the panel is on.
  const relations = $derived.by(() => {
    const focus = [app.hovered, app.selected].filter(Boolean) as string[];
    if (!focus.length) return [];

    return app.map.edges
      .filter(
        (edge) =>
          (focus.includes(edge.from) || focus.includes(edge.to)) &&
          layout.byId[edge.from]?.presence === 1 &&
          layout.byId[edge.to]?.presence === 1,
      )
      .map((edge) => {
        const a = layout.byId[edge.from];
        const b = layout.byId[edge.to];
        // Pull the curve towards the middle; category links bow less.
        const k = a.node.kind === 'category' || b.node.kind === 'category' ? 0.9 : 0.55;
        const c1 = [a.x * k, a.y * k];
        const c2 = [b.x * k, b.y * k];

        // Midpoint of the cubic, for the label.
        const t = 0.5;
        const mt = 1 - t;
        const mid = [0, 1].map(
          (i) =>
            mt ** 3 * [a.x, a.y][i] +
            3 * mt * mt * t * c1[i] +
            3 * mt * t * t * c2[i] +
            t ** 3 * [b.x, b.y][i],
        );

        return {
          key: edge.from + edge.to,
          d: `M${a.x},${a.y} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${b.x},${b.y}`,
          label: edge.label || edge.kind.replace(/-/g, ' '),
          mx: mid[0],
          my: mid[1],
        };
      });
  });
</script>

<g>
  {#each relations as relation (relation.key)}
    <g class="rel">
      <path
        class="fill-none stroke-ink opacity-[0.55] [stroke-dasharray:4_4] [stroke-width:1.2]"
        d={relation.d}
      />
      <text
        class="fill-ink stroke-paper font-serif text-[13px] italic [paint-order:stroke] [stroke-width:4px]"
        text-anchor="middle"
        x={relation.mx}
        y={relation.my}>{relation.label}</text
      >
    </g>
  {/each}
</g>
