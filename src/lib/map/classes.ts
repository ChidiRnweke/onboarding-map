/**
 * Classes shared between a rendered item label and the offscreen probe that
 * measures it.
 *
 * The layout depends on the width of the longest label, which is measured by
 * rendering one offscreen. While the labels were styled by a `.leaf text` rule
 * the probe inherited it for free; as utilities on the element, the probe has
 * to be given exactly the same classes or it measures the wrong font and the
 * whole map is laid out to the wrong radius.
 */
export const LEAF_LABEL =
  'stroke-paper font-sans text-[16.5px] [font-stretch:82%] [paint-order:stroke] [stroke-linejoin:round] [stroke-width:3px]';

/** Route items are set slightly heavier than the rest. */
export const LEAF_LABEL_PATH = 'fill-ink font-semibold';
export const LEAF_LABEL_OTHER = 'fill-ink-2';
