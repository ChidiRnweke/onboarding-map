/**
 * Text helpers. These exist so that no part of the interface has to build HTML
 * strings: Svelte escapes every interpolation, so the old esc()/md()/fmt() trio
 * — and the injection risk it existed to manage — is gone.
 */

export interface TextSegment {
  code: boolean;
  text: string;
}

/** Splits `backtick` spans out of a string, for rendering as <code>. */
export function parseInlineCode(input: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const pattern = /`([^`]+)`/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > last) segments.push({ code: false, text: input.slice(last, match.index) });
    segments.push({ code: true, text: match[1] });
    last = match.index + match[0].length;
  }
  if (last < input.length) segments.push({ code: false, text: input.slice(last) });
  return segments;
}

export type TemplatePart = { kind: 'text'; value: string } | { kind: 'slot'; name: string };

/**
 * Splits a label such as "An alternative to {node}" into literal text and named
 * placeholders, so a caller can render an element — a link, a button — in place
 * of a placeholder instead of splicing HTML into a string.
 */
export function parseTemplate(input: string): TemplatePart[] {
  const parts: TemplatePart[] = [];
  const pattern = /\{(\w+)\}/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > last) parts.push({ kind: 'text', value: input.slice(last, match.index) });
    parts.push({ kind: 'slot', name: match[1] });
    last = match.index + match[0].length;
  }
  if (last < input.length) parts.push({ kind: 'text', value: input.slice(last) });
  return parts;
}

/** Fills {placeholders} with plain text. Safe: the result is interpolated, never injected. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

/**
 * Splits a paragraph into its first sentence and the rest, so the first can
 * lead. A full stop inside `inline code` (a file name, a command) is not the
 * end of a sentence, and neither is one followed by a lower-case word.
 */
export function splitLead(text: string): { lead: string; rest: string } {
  const pattern = /[.!?](?=\s+[A-Z“"(`])/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const ticks = (text.slice(0, match.index).match(/`/g) ?? []).length;
    if (ticks % 2 === 0) {
      return { lead: text.slice(0, match.index + 1), rest: text.slice(match.index + 1).trim() };
    }
  }
  return { lead: text, rest: '' };
}
