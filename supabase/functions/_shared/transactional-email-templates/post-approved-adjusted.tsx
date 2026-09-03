import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  Cta,
  GREEN_BORDER,
  GREEN_PALE,
  H1,
  P,
  Quote,
  ReasonBox,
  SITE_URL,
  Shell,
  subtleLink,
} from './_shell.tsx'
import { Link } from 'npm:@react-email/components@0.0.22'

interface Props {
  topic?: string
  title?: string
  originalText?: string
  finalText?: string
  reasons?: string[]
  ctaUrl?: string
}

const Email = ({ topic, title, originalText, finalText, reasons, ctaUrl }: Props) => (
  <Shell
    eyebrow="POST REVIEW"
    preview="Your post was approved with a slight adjustment."
    statusValue="Approved with a slight adjustment"
    footerReason="You're receiving this email because you submitted a post on DeetSheet."
  >
    <H1>Approved, with a small change.</H1>
    <P>
      Thank you for posting on DeetSheet. Congratulations! The following post has
      been approved with a slight adjustment.
    </P>
    {(topic || title) && <Quote>{[topic, title].filter(Boolean).join(': ')}</Quote>}

    {originalText && (
      <>
        <Text style={label}>ORIGINAL</Text>
        <div style={originalBox}>
          <Text style={{ ...bodyText, textDecoration: 'line-through', color: '#6b7280' }}>
            {originalText}
          </Text>
        </div>
      </>
    )}
    {finalText && (
      <>
        <Text style={label}>FINAL</Text>
        <div style={finalBox}>
          <Text style={bodyText}>{finalText}</Text>
        </div>
      </>
    )}

    {reasons && reasons.length > 0 && (
      <ReasonBox label="THE REASON IT WAS ADJUSTED" items={reasons} />
    )}

    <P>
      If you do not like the new version, you can delete the post in your user
      profile. You can also go to the{' '}
      <Link href={`${SITE_URL}/faq`} style={subtleLink}>
        Rules and Guidelines
      </Link>{' '}
      page to read all the guidelines for posting.
    </P>
    <Cta href={ctaUrl || `${SITE_URL}/profile`} label="See your post live" />
  </Shell>
)

export const template = {
  component: Email,
  subject: 'Your DeetSheet post was approved with an adjustment',
  displayName: 'Post approved (adjusted)',
  previewData: {
    topic: 'Life: Moving',
    title: 'Book movers mid-month',
    originalText: 'Book your movers mid month its way cheaper!!!',
    finalText: 'Movers cost less mid-month than at the start or end of a month.',
    reasons: ['Removed exclamation points', 'Tightened wording for clarity'],
  },
} satisfies TemplateEntry

const label = {
  color: '#6b7280',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.14em',
  margin: '18px 0 6px',
}

const bodyText = { color: '#1a1a1a', fontSize: '15px', lineHeight: 1.5, margin: 0 }

const originalBox = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '14px 16px',
  backgroundColor: '#fafafa',
}

const finalBox = {
  border: `1px solid ${GREEN_BORDER}`,
  borderRadius: '8px',
  padding: '14px 16px',
  backgroundColor: GREEN_PALE,
}
