import { Fragment } from "react";
import { parseMarkdownLinks } from "@/lib/markdownLinks";

interface Props {
  /** Plain text that may contain `[label](url)` markdown links. */
  text: string;
  className?: string;
}

/**
 * Renders admin-authored plain text, turning `[label](url)` into real anchors.
 * Text with no markdown link renders byte-identically to the raw string.
 */
export default function MarkdownLinkText({ text, className }: Props) {
  const tokens = parseMarkdownLinks(text);
  return (
    <span className={className}>
      {tokens.map((t, i) =>
        t.type === "link" ? (
          <a
            key={i}
            href={t.href}
            target={t.href.startsWith("/") ? undefined : "_blank"}
            rel={t.href.startsWith("/") ? undefined : "noopener noreferrer nofollow"}
          >
            {t.text}
          </a>
        ) : (
          <Fragment key={i}>{t.text}</Fragment>
        ),
      )}
    </span>
  );
}
