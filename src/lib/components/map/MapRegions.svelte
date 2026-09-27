<script lang="ts">
  import { isLowerHalf, rimArc, type DomainPlacement } from '$lib/map/layout';
  import { getAppState } from '$lib/state.svelte';
  import { getTheme } from '$lib/theme.svelte';

  let {
    domains,
    band,
    lit,
  }: {
    domains: DomainPlacement[];
    band: { inner: number; outer: number };
    lit: Record<string, boolean>;
  } = $props();

  const app = getAppState();
  const theme = getTheme();

  /*
   * A region's name is set along its stretch of the rim, which is only as long
   * as the region is wide. So each name is measured and given the first set-up
   * that fits: one line, one smaller line, two lines, the dataset's short name,
   * or as a last resort two lines squeezed to the arc. It never clips.
   */
  const FULL = 36;
  const SHRUNK = 28;
  const SMALLEST = 24;
  const ROOM = 0.9;

  /*
   * Two lines share the band a single name sits in: between the wedges and the
   * outer ring, with some air. Per em, this italic serif rises 0.9 above its
   * baseline (tall capitals and the f's ascender) and drops 0.25 below, and
   * the lines sit one em apart, so two lines take 2.15 em: that caps their size.
   */
  const ASCENT = 0.9;
  const DESCENT = 0.25;
  const top = $derived(band.outer - 8);
  const twoLineMax = $derived((top - (band.inner + 4)) / (ASCENT + 1 + DESCENT));

  let probe = $state<SVGTextElement | null>(null);
  /** Width at FULL size of every string a name might be set as, in map units. */
  let widths = $state<Record<string, number>>({});

  /** The two lines a name splits into: at the space that balances them best. */
  function split(name: string): [string, string] | null {
    const words = name.split(' ');
    if (words.length < 2) return null;
    let best: [string, string] | null = null;
    let score = Infinity;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      const s = Math.abs(a.length - b.length);
      if (s < score) [best, score] = [[a, b], s];
    }
    return best;
  }

  $effect(() => {
    const el = probe;
    if (!el) return;
    const texts = domains.flatMap(({ domain }) => [
      domain.label,
      ...(split(domain.label) ?? []),
      ...(domain.shortLabel ? [domain.shortLabel] : []),
    ]);
    const measure = () => {
      const out: Record<string, number> = {};
      for (const t of texts) {
        el.textContent = t;
        out[t] = el.getComputedTextLength();
      }
      el.textContent = '';
      widths = out;
    };
    measure();
    // Widths change once the web fonts arrive; measure again for real.
    document.fonts?.ready.then(measure);
  });

  interface Setting {
    lines: string[];
    size: number;
    /** Set when the text is squeezed to the arc, the last resort. */
    squeeze?: number;
  }

  function setting(p: DomainPlacement): Setting {
    const room = p.rimLength * ROOM;
    const name = p.domain.label;
    const w = widths[name];
    if (!w || w <= room) return { lines: [name], size: FULL };
    if ((w * SHRUNK) / FULL <= room) return { lines: [name], size: (FULL * room) / w };

    const lines = split(name);
    if (lines) {
      const widest = Math.max(widths[lines[0]] ?? w, widths[lines[1]] ?? w);
      const size = Math.min(FULL, twoLineMax, (FULL * room) / widest);
      if (size >= SMALLEST) return { lines, size };
    }
    const short = p.domain.shortLabel;
    if (short && widths[short]) {
      const size = Math.min(FULL, (FULL * room) / widths[short]);
      if (size >= SMALLEST) return { lines: [short], size };
    }
    return { lines: lines ?? [name], size: Math.min(SMALLEST, twoLineMax), squeeze: room };
  }

  /**
   * The arcs for a name on two lines, the first always on top. On the upper
   * half letters point outward, so the first line is the outer one and sits
   * just inside the ring; on the lower half the name is flipped, letters point
   * inward, and the first line is the inner one.
   */
  function twoLineArcs(p: DomainPlacement, size: number): [string, string] {
    if (isLowerHalf(p.a0, p.a1)) {
      const second = top - DESCENT * size;
      return [rimArc(p.a0, p.a1, second - size), rimArc(p.a0, p.a1, second)];
    }
    const first = top - ASCENT * size;
    return [rimArc(p.a0, p.a1, first), rimArc(p.a0, p.a1, first - size)];
  }

  function activate(id: string, event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      app.selectRegion(id);
    }
  }
</script>

<!-- Region names set along the rim, on paths defined in <defs>. Regions the
     journey has not reached yet are dimmed rather than hidden. Each name opens
     its region. -->
<g>
  <text bind:this={probe} class="font-serif italic" style="font-size:{FULL}px; visibility:hidden"></text>
  {#each domains as placement (placement.domain.id)}
    {@const set = setting(placement)}
    {#if set.lines.length > 1}
      {@const arcs = twoLineArcs(placement, set.size)}
      <defs>
        <path id="{placement.rimId}-1" d={arcs[0]} />
        <path id="{placement.rimId}-2" d={arcs[1]} />
      </defs>
    {/if}
    <g
      class="region-name cursor-pointer transition-opacity duration-[600ms] hover:opacity-100 focus:outline-none {lit[
        placement.domain.id
      ]
        ? ''
        : 'opacity-[0.35]'}"
      style:opacity={placement.presence < 1 ? placement.presence : null}
      role="button"
      tabindex="0"
      aria-label={placement.domain.label}
      onclick={() => app.selectRegion(placement.domain.id)}
      onkeydown={(e) => activate(placement.domain.id, e)}
    >
      {#each set.lines as line, i (i)}
        <text
          class="font-serif italic"
          style="font-size:{set.size}px"
          fill={theme.tone(placement.domain.id)}
          textLength={set.squeeze}
          lengthAdjust={set.squeeze ? 'spacingAndGlyphs' : undefined}
        >
          <textPath
            href="#{placement.rimId}{set.lines.length > 1 ? `-${i + 1}` : ''}"
            startOffset="50%"
            text-anchor="middle">{line}</textPath
          >
        </text>
      {/each}
    </g>
  {/each}
</g>
