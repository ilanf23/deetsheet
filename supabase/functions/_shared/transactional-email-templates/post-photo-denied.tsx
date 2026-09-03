import * as React from 'npm:react@18.3.1'
import { Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Cta, H1, P, Quote, ReasonBox, SITE_URL, Shell, subtleLink } from './_shell.tsx'

interface Props {
  topic?: string
  title?: string
  reasons?: string[]
  ctaUrl?: string
}

const Email = ({ topic, title, reasons, ctaUrl }: Props) => (
  <Shell
    eyebrow="PHOTO REVIEW"
    preview="Your post was approved, but the photo was denied."
    statusValue="Post approved, photo denied"
    footerReason="You're receiving this email because you submitted a post on DeetSheet."
  >
    <H1>Your post is live, the photo isn&apos;t.</H1>
    <P>
      Thank you for posting on DeetSheet. Your recent post has been approved:
    </P>
    {(topic || title) && <Quote>{[topic, title].filter(Boolean).join(': ')}</Quote>}
    <P>Unfortunately, your photo has been denied for the following reason:</P>
    {reasons && reasons.length > 0 && <ReasonBox items={reasons} />}
    <P>
      If you would like to change your picture, it will be subject to the{' '}
      <Link href={`${SITE_URL}/faq`} style={subtleLink}>
        Rules and Guidelines
      </Link>
      .
    </P>
    <Cta href={ctaUrl || `${SITE_URL}/profile`} label="Replace your photo" />
  </Shell>
)

export const template = {
  component: Email,
  subject: 'Your DeetSheet post was approved, photo denied',
  displayName: 'Post photo denied',
  previewData: {
    topic: 'Cities: Chicago',
    title: 'Best months to visit',
    reasons: ['The photo is low resolution and hard to make out'],
  },
} satisfies TemplateEntry
