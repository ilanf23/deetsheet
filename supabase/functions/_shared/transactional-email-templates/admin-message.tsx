import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  // Header
  eyebrow?: string // e.g. "POST REVIEW"
  // Status banner (dark green strip under header). Omit to hide.
  statusLabel?: string // e.g. "Status:"
  statusValue?: string // e.g. "Pending — not yet approved"
  // Main content
  headline?: string // e.g. "Your post is almost there."
  intro?: string // paragraph above the quoted title
  quotedTitle?: string // e.g. "1980s: Clothing"
  // Optional info boxes
  reason?: string // shown in orange-tinted box
  suggestions?: string[] // shown in green-tinted box
  // Body copy under boxes
  bodyText?: string
  // Callout (dashed box)
  callout?: string
  // Primary CTA
  ctaLabel?: string
  ctaUrl?: string
  // Secondary link (rendered next to CTA)
  secondaryLabel?: string
  secondaryUrl?: string
  // Footer note (explains why the recipient is getting the email)
  footerReason?: string
  // Fallback for legacy admin messages authored as HTML.
  subject?: string
  bodyHtml?: string
}

const BRAND_GREEN = '#2f5233'
const BRAND_GREEN_DARK = '#1a3d2e'
const CREAM = '#eae7db'
const CARD_WHITE = '#ffffff'
const TEXT = '#1a1a1a'
const MUTED = '#6b7280'
const ORANGE = '#c2410c'
const ORANGE_BG = '#fff4ea'
const ORANGE_BORDER = '#f5c497'
const GREEN_BG = '#e8f0ea'
const GREEN_BORDER = '#c7d9cc'

const Email = ({
  eyebrow = 'POST REVIEW',
  statusLabel,
  statusValue,
  headline,
  intro,
  quotedTitle,
  reason,
  suggestions,
  bodyText,
  callout,
  ctaLabel,
  ctaUrl,
  secondaryLabel,
  secondaryUrl,
  footerReason = "You're receiving this email because of activity on your DeetSheet account.",
  subject,
  bodyHtml,
}: Props) => {
  const preview =
    headline || subject || quotedTitle || 'A message from DeetSheet'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={outer}>
          {/* Header */}
          <Section style={header}>
            <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
              <tr>
                <td style={{ verticalAlign: 'middle' }}>
                  <div style={logoCard}>
                    <span style={logoText}>DeetSheet</span>
                  </div>
                </td>
                <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                  <span style={eyebrowStyle}>{eyebrow}</span>
                </td>
              </tr>
            </table>
          </Section>

          {/* Status strip */}
          {statusValue && (
            <Section style={statusStrip}>
              <Text style={statusText}>
                {statusLabel && <span style={statusLabelStyle}>{statusLabel} </span>}
                <strong>{statusValue}</strong>
              </Text>
            </Section>
          )}

          {/* Card */}
          <Section style={card}>
            {headline && <Heading style={h1}>{headline}</Heading>}

            {intro && <Text style={paragraph}>{intro}</Text>}

            {quotedTitle && (
              <div style={quoteBox}>
                <Text style={quoteText}>{quotedTitle}</Text>
              </div>
            )}

            {(reason || (suggestions && suggestions.length > 0)) && (
              <table
                width="100%"
                cellPadding={0}
                cellSpacing={0}
                role="presentation"
                style={{ margin: '20px 0 8px' }}
              >
                <tr>
                  {reason && (
                    <td style={{ verticalAlign: 'top', paddingRight: suggestions?.length ? 8 : 0, width: suggestions?.length ? '50%' : '100%' }}>
                      <div style={reasonBox}>
                        <Text style={reasonLabel}>REASON</Text>
                        <Text style={infoBoxText}>{reason}</Text>
                      </div>
                    </td>
                  )}
                  {suggestions && suggestions.length > 0 && (
                    <td style={{ verticalAlign: 'top', paddingLeft: reason ? 8 : 0, width: reason ? '50%' : '100%' }}>
                      <div style={suggestionsBox}>
                        <Text style={suggestionsLabel}>SUGGESTIONS</Text>
                        {suggestions.map((s, i) => (
                          <Text key={i} style={infoBoxText}>{s}</Text>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              </table>
            )}

            {bodyText && <Text style={paragraph}>{bodyText}</Text>}

            {/* Legacy HTML body support */}
            {!bodyText && bodyHtml && (
              <div
                style={paragraph}
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            )}

            {callout && (
              <div style={calloutBox}>
                <Text style={calloutText}>{callout}</Text>
              </div>
            )}

            {(ctaUrl || secondaryUrl) && (
              <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
                {ctaUrl && ctaLabel && (
                  <Link href={ctaUrl} style={ctaButton}>
                    {ctaLabel}
                  </Link>
                )}
                {secondaryUrl && secondaryLabel && (
                  <span style={secondaryWrap}>
                    or{' '}
                    <Link href={secondaryUrl} style={secondaryLink}>
                      {secondaryLabel}
                    </Link>
                  </span>
                )}
              </Section>
            )}

            <Hr style={hr} />

            <Section style={{ textAlign: 'center' }}>
              <Link href="https://deetsheet.com/about" style={footNav}>About</Link>
              <span style={footDot}>·</span>
              <Link href="https://deetsheet.com/faq" style={footNav}>FAQ</Link>
              <span style={footDot}>·</span>
              <Link href="https://deetsheet.com/contact" style={footNav}>Contact</Link>
              <span style={footDot}>·</span>
              <Link href="https://deetsheet.com/terms" style={footNav}>Terms</Link>
              <span style={footDot}>·</span>
              <Link href="https://deetsheet.com/privacy" style={footNav}>Privacy</Link>
            </Section>

            <Text style={footerNote}>{footerReason}</Text>
            <Text style={copyright}>
              © {new Date().getFullYear()} DeetSheet. All rights reserved. ·{' '}
              <Link href="https://deetsheet.com" style={secondaryLink}>
                deetsheet.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Props) =>
    data?.headline || data?.subject || 'A message from DeetSheet',
  displayName: 'Admin message',
  previewData: {
    eyebrow: 'POST REVIEW',
    statusLabel: 'Status:',
    statusValue: 'Pending — not yet approved',
    headline: 'Your post is almost there.',
    intro:
      'Thank you for posting on DeetSheet. Your recent post has not been approved yet:',
    quotedTitle: '1980s: Clothing',
    reason: 'Too vague',
    suggestions: ['Preppy clothing', 'Spandex clothing'],
    bodyText:
      'If you would like to change your post to the suggestions above, you may do so — or delete it.',
    callout:
      'You will have 30 days to adjust your post, or it will be automatically deleted.',
    ctaLabel: 'Edit your post',
    ctaUrl: 'https://deetsheet.com/profile',
    secondaryLabel: 'delete it instead',
    secondaryUrl: 'https://deetsheet.com/profile',
    footerReason:
      "You're receiving this email because you submitted a post on DeetSheet.",
  },
} satisfies TemplateEntry

/* ---------- styles ---------- */

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  margin: 0,
  padding: '24px 0',
}

const outer = {
  width: '100%',
  maxWidth: '640px',
  margin: '0 auto',
  backgroundColor: CREAM,
  borderRadius: '12px',
  overflow: 'hidden',
  padding: '0',
}

const header = {
  backgroundColor: BRAND_GREEN,
  padding: '28px 32px',
}

const logoCard = {
  display: 'inline-block',
  backgroundColor: CARD_WHITE,
  padding: '14px 26px',
  borderRadius: '6px',
}

const logoText = {
  color: BRAND_GREEN_DARK,
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: '22px',
  fontWeight: 700,
  letterSpacing: '-0.01em',
}

const eyebrowStyle = {
  color: '#ffffff',
  fontSize: '13px',
  letterSpacing: '0.24em',
  fontWeight: 500,
}

const statusStrip = {
  backgroundColor: BRAND_GREEN_DARK,
  padding: '14px 32px',
}

const statusText = {
  color: '#ffffff',
  fontSize: '15px',
  margin: 0,
}

const statusLabelStyle = {
  fontWeight: 400,
}

const card = {
  backgroundColor: CARD_WHITE,
  padding: '32px',
}

const h1 = {
  color: TEXT,
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: '28px',
  lineHeight: 1.2,
  margin: '0 0 18px',
  fontWeight: 700,
}

const paragraph = {
  color: TEXT,
  fontSize: '16px',
  lineHeight: 1.55,
  margin: '0 0 16px',
}

const quoteBox = {
  borderLeft: `4px solid ${BRAND_GREEN}`,
  padding: '4px 0 4px 16px',
  margin: '20px 0',
}

const quoteText = {
  color: TEXT,
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: '22px',
  fontWeight: 700,
  margin: 0,
}

const reasonBox = {
  backgroundColor: ORANGE_BG,
  border: `1px solid ${ORANGE_BORDER}`,
  borderRadius: '8px',
  padding: '18px',
  minHeight: '110px',
}

const reasonLabel = {
  color: ORANGE,
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.14em',
  margin: '0 0 8px',
}

const suggestionsBox = {
  backgroundColor: GREEN_BG,
  border: `1px solid ${GREEN_BORDER}`,
  borderRadius: '8px',
  padding: '18px',
  minHeight: '110px',
}

const suggestionsLabel = {
  color: BRAND_GREEN_DARK,
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.14em',
  margin: '0 0 8px',
}

const infoBoxText = {
  color: TEXT,
  fontSize: '15px',
  lineHeight: 1.4,
  margin: '2px 0',
}

const calloutBox = {
  border: `1.5px dashed #d1d5db`,
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '20px 0 8px',
  textAlign: 'center' as const,
}

const calloutText = {
  color: '#4b5563',
  fontSize: '14px',
  margin: 0,
}

const ctaButton = {
  backgroundColor: BRAND_GREEN_DARK,
  color: '#ffffff',
  textDecoration: 'none',
  padding: '16px 40px',
  borderRadius: '4px',
  fontSize: '17px',
  fontWeight: 600,
  display: 'inline-block',
}

const secondaryWrap = {
  color: MUTED,
  fontSize: '15px',
  marginLeft: '14px',
}

const secondaryLink = {
  color: BRAND_GREEN_DARK,
  textDecoration: 'underline',
  fontWeight: 500,
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '28px 0 20px',
}

const footNav = {
  color: MUTED,
  fontSize: '14px',
  textDecoration: 'none',
  margin: '0 4px',
}

const footDot = {
  color: '#9ca3af',
  fontSize: '14px',
  margin: '0 2px',
}

const footerNote = {
  color: MUTED,
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: '18px 0 6px',
}

const copyright = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0',
}
