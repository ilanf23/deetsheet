/**
 * Conservative HTML sanitizer for user/admin supplied message bodies.
 * Allowlist of basic formatting tags + safe links; everything else is dropped.
 * No scripts, no inline event handlers, no iframes, no style/attribute tricks.
 */
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "span",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
]);

const SAFE_HREF = /^(https?:|mailto:|\/|#)/i;

export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined" || !html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");

  const walk = (node: Element) => {
    Array.from(node.children).forEach((child) => {
      const tag = child.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        // Keep readable text but discard the disallowed element itself.
        const text = child.textContent ?? "";
        child.replaceWith(doc.createTextNode(tag === "script" || tag === "style" ? "" : text));
        return;
      }
      Array.from(child.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const keep =
          tag === "a" && (name === "href" || name === "title") && SAFE_HREF.test(attr.value.trim());
        if (!keep) child.removeAttribute(attr.name);
      });
      if (tag === "a") {
        child.setAttribute("target", "_blank");
        child.setAttribute("rel", "noopener noreferrer nofollow");
      }
      walk(child);
    });
  };

  walk(doc.body);
  return doc.body.innerHTML;
}
