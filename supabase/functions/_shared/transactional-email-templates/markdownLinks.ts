/**
 * MARKDOWN LINK PARSER (edge / email side).
 *
 * Mirrored verbatim from `src/lib/markdownLinks.ts`. Any change here MUST be
 * mirrored there. A true shared import is impossible: this file runs in Deno
 * inside `supabase/functions/`, which cannot reach into `src/`.
 *
 * Scope is deliberately small:
 * - `[label](url)` becomes a link.
 * - Only `https:`, `http:`, `mailto:` and site-relative `/...` hrefs are
 *   accepted. Anything else renders as the literal label text, no link.
 * - Bare URLs are NOT autolinked.
 * - All other characters, including newlines, pass through untouched.
 */

export type MarkdownToken =
  | { type: 'text'; text: string }
  | { type: 'link'; text: string; href: string }

const LINK_RE = /\[([^\]\n]+)\]\(([^)\s]+)\)/g

/** True when the href is a scheme we are willing to emit. */
export function isSafeHref(href: string): boolean {
  return /^(https?:\/\/|mailto:)/i.test(href) || /^\/(?!\/)/.test(href)
}

/**
 * Split plain text into text/link tokens. Text with no markdown links yields a
 * single `text` token holding the original string, byte for byte.
 */
export function parseMarkdownLinks(input: string): MarkdownToken[] {
  const tokens: MarkdownToken[] = []
  if (!input) return tokens
  let last = 0
  LINK_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = LINK_RE.exec(input)) !== null) {
    const [full, label, href] = m
    if (m.index > last) tokens.push({ type: 'text', text: input.slice(last, m.index) })
    if (isSafeHref(href)) {
      tokens.push({ type: 'link', text: label, href })
    } else {
      // Unsafe/unknown scheme — fall back to the literal source span so no
      // stray bracket or paren leaks out.
      tokens.push({ type: 'text', text: full })
    }
    last = m.index + full.length
  }
  if (last < input.length) tokens.push({ type: 'text', text: input.slice(last) })
  return tokens
}

/** True when the text contains at least one markdown link. */
export function hasMarkdownLink(input: string): boolean {
  LINK_RE.lastIndex = 0
  return LINK_RE.test(input ?? '')
}
