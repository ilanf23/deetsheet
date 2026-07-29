import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

/**
 * Shared brand shell for every DeetSheet user email.
 *
 * Design (client-approved "green banner"):
 *  - solid green header banner + white logo chip + uppercase eyebrow label
 *  - darker green status band with the one-line outcome
 *  - white content card
 *  - required footer (nav links, "you're receiving this…", manage prefs, copyright)
 *
 * The one-click Unsubscribe link is appended automatically by the email
 * pipeline (handle-email-unsubscribe token), so templates must not add one.
 */

export const SITE_URL = 'https://deetsheet.com'
export const LOGO_URL = 'https://deetsheet.com/logo.png'

/* Brand tokens — mirror src/index.css */
export const GREEN = '#27593c' // hsl(146 38% 25%)
export const GREEN_DARK = '#1b3f2a'
export const GREEN_PALE = '#eff6f2' // hsl(146 38% 95%)
export const GREEN_BORDER = '#cde5d6'
export const ORANGE = '#ff6633' // hsl(20 100% 60%)
export const ORANGE_BG = '#fff7ed'
export const ORANGE_BORDER = '#fed7aa'
export const ORANGE_LABEL = '#c2540a'
export const TEXT = '#1a1a1a'
export const MUTED = '#6b7280'
export const BORDER = '#e5e7eb'

export const SERIF = "Merriweather, Georgia, 'Times New Roman', serif"
export const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export interface ShellProps {
  /** Small uppercase label on the right of the green banner. */
  eyebrow: string
  /** Preview / inbox snippet text. */
  preview: string
  /** One-line outcome shown in the darker green band. Omit to hide the band. */
  statusLabel?: string
  statusValue?: string
  /** Explains to the recipient why they got this email. */
  footerReason: string
  children: React.ReactNode
}

export const Shell = ({
  eyebrow,
  preview,
  statusLabel = 'Status:',
  statusValue,
  footerReason,
  children,
}: ShellProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={outer}>
        <Section style={header}>
          <Img
            src={LOGO_URL}
            alt="DeetSheet"
            height={52}
            style={{ display: 'block', height: '52px', width: 'auto' }}
          />
        </Section>


        {statusValue && (
          <Section style={statusBand}>
            <Text style={statusText}>
              <span style={{ fontWeight: 400 }}>{statusLabel} </span>
              <strong>{statusValue}</strong>
            </Text>
          </Section>
        )}

        <Section style={card}>
          {children}

          <Hr style={hr} />

          <Section style={{ textAlign: 'center' }}>
            <Link href={`${SITE_URL}/about`} style={footNav}>About</Link>
            <span style={footDot}>·</span>
            <Link href={`${SITE_URL}/faq`} style={footNav}>FAQ</Link>
            <span style={footDot}>·</span>
            <Link href={`${SITE_URL}/contact`} style={footNav}>Contact</Link>
            <span style={footDot}>·</span>
            <Link href={`${SITE_URL}/terms`} style={footNav}>Terms</Link>
            <span style={footDot}>·</span>
            <Link href={`${SITE_URL}/privacy`} style={footNav}>Privacy</Link>
          </Section>

          <Text style={footerNote}>{footerReason}</Text>
          <Text style={footerNote}>
            <Link href={`${SITE_URL}/email-preferences`} style={subtleLink}>
              Manage email preferences
            </Link>
          </Text>

          <Text style={copyright}>
            © {new Date().getFullYear()} DeetSheet. All rights reserved. ·{' '}
            <Link href={SITE_URL} style={subtleLink}>
              deetsheet.com
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

/* ---------- shared blocks ---------- */

export const H1 = ({ children }: { children: React.ReactNode }) => (
  <Heading style={h1}>{children}</Heading>
)

export const P = ({ children }: { children: React.ReactNode }) => (
  <Text style={paragraph}>{children}</Text>
)

export const Quote = ({ children }: { children: React.ReactNode }) => (
  <div style={quoteBox}>
    <Text style={quoteText}>{children}</Text>
  </div>
)

export const ReasonBox = ({
  label = 'REASON',
  items,
}: {
  label?: string
  items: string[]
}) => (
  <div style={reasonBox}>
    <Text style={reasonLabel}>{label}</Text>
    {items.map((t, i) => (
      <Text key={i} style={infoText}>
        {t}
      </Text>
    ))}
  </div>
)

export const SuggestionsBox = ({
  label = 'SUGGESTIONS',
  items,
}: {
  label?: string
  items: string[]
}) => (
  <div style={suggestionsBox}>
    <Text style={suggestionsLabel}>{label}</Text>
    {items.map((t, i) => (
      <Text key={i} style={infoText}>
        {t}
      </Text>
    ))}
  </div>
)

export const DeadlineStrip = ({ children }: { children: React.ReactNode }) => (
  <div style={deadlineBox}>
    <Text style={deadlineText}>&#9200;&nbsp; {children}</Text>
  </div>
)

export const Cta = ({ href, label }: { href: string; label: string }) => (
  <Section style={{ textAlign: 'center', margin: '28px 0 4px' }}>
    <Link href={href} style={ctaButton}>
      {label}
    </Link>
  </Section>
)

/** Small card summarising a post (topic, title, thumbnail, anonymous flag). */
export const PostCard = ({
  topic,
  title,
  imageUrl,
  isAnonymous,
}: {
  topic?: string
  title?: string
  imageUrl?: string
  isAnonymous?: boolean
}) => (
  <div style={postCard}>
    {topic && <Text style={postCardTopic}>{topic.toUpperCase()}</Text>}
    {title && <Text style={postCardTitle}>{title}</Text>}
    {imageUrl && (
      <Img
        src={imageUrl}
        alt=""
        style={{
          display: 'block',
          maxWidth: '100%',
          borderRadius: '6px',
          margin: '12px 0 4px',
        }}
      />
    )}
    <Text style={postCardMeta}>
      Posted {isAnonymous ? 'anonymously' : 'under your username'}
    </Text>
  </div>
)

/* ---------- styles ---------- */

const main = {
  backgroundColor: '#ffffff',
  fontFamily: SANS,
  margin: 0,
  padding: '24px 0',
}

const outer = {
  width: '100%',
  maxWidth: '640px',
  margin: '0 auto',
  backgroundColor: '#f3f2ed',
  borderRadius: '12px',
  overflow: 'hidden',
  padding: '0',
}

const header = {
  backgroundColor: '#ffffff',
  padding: '28px 32px 24px',
  textAlign: 'left' as const,
}


const statusBand = { backgroundColor: GREEN_DARK, padding: '13px 32px' }

const statusText = { color: '#ffffff', fontSize: '15px', margin: 0 }

const card = { backgroundColor: '#ffffff', padding: '32px' }

const h1 = {
  color: TEXT,
  fontFamily: SERIF,
  fontSize: '26px',
  lineHeight: 1.25,
  margin: '0 0 18px',
  fontWeight: 700,
}

export const paragraph = {
  color: TEXT,
  fontSize: '16px',
  lineHeight: 1.55,
  margin: '0 0 16px',
}

const quoteBox = {
  borderLeft: `4px solid ${GREEN}`,
  padding: '4px 0 4px 16px',
  margin: '20px 0',
}

const quoteText = {
  color: TEXT,
  fontFamily: SERIF,
  fontSize: '20px',
  fontWeight: 700,
  margin: 0,
}

const reasonBox = {
  backgroundColor: ORANGE_BG,
  border: `1px solid ${ORANGE_BORDER}`,
  borderRadius: '8px',
  padding: '16px 18px',
  margin: '16px 0',
}

const reasonLabel = {
  color: ORANGE_LABEL,
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.14em',
  margin: '0 0 8px',
}

const suggestionsBox = {
  backgroundColor: GREEN_PALE,
  border: `1px solid ${GREEN_BORDER}`,
  borderRadius: '8px',
  padding: '16px 18px',
  margin: '16px 0',
}

const suggestionsLabel = {
  color: GREEN_DARK,
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.14em',
  margin: '0 0 8px',
}

const infoText = {
  color: TEXT,
  fontSize: '15px',
  lineHeight: 1.45,
  margin: '2px 0',
}

const deadlineBox = {
  border: '1.5px dashed #d1d5db',
  borderRadius: '8px',
  padding: '14px 20px',
  margin: '18px 0 4px',
  textAlign: 'center' as const,
}

const deadlineText = { color: '#4b5563', fontSize: '14px', margin: 0 }

const ctaButton = {
  backgroundColor: GREEN,
  color: '#ffffff',
  textDecoration: 'none',
  padding: '15px 38px',
  borderRadius: '6px',
  fontSize: '16px',
  fontWeight: 600,
  display: 'inline-block',
}

const postCard = {
  border: `1px solid ${BORDER}`,
  borderRadius: '10px',
  padding: '18px',
  margin: '18px 0',
  backgroundColor: '#fbfbfa',
}

const postCardTopic = {
  color: GREEN,
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.14em',
  margin: '0 0 6px',
}

const postCardTitle = {
  color: TEXT,
  fontFamily: SERIF,
  fontSize: '19px',
  fontWeight: 700,
  margin: 0,
}

const postCardMeta = { color: MUTED, fontSize: '13px', margin: '10px 0 0' }

const hr = { borderColor: BORDER, margin: '28px 0 20px' }

const footNav = {
  color: MUTED,
  fontSize: '14px',
  textDecoration: 'none',
  margin: '0 4px',
}

const footDot = { color: '#9ca3af', fontSize: '14px', margin: '0 2px' }

const footerNote = {
  color: MUTED,
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: '12px 0 0',
}

export const subtleLink = {
  color: GREEN_DARK,
  textDecoration: 'underline',
  fontWeight: 500,
}

const copyright = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '14px 0 0',
}
