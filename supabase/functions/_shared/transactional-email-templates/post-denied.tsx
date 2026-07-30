import * as React from 'npm:react@18.3.1'
import { Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { H1, P, Quote, ReasonBox, SITE_URL, Shell, subtleLink } from './_shell.tsx'

interface Props {
  topic?: string
  title?: string
  reasons?: string[]
}

const Email = ({ topic, title, reasons }: Props) => (
  <Shell
    eyebrow="POST REVIEW"
    preview="Your DeetSheet post has been denied."
    statusValue="Denied — account on probation"
    footerReason="You're receiving this email because you submitted a post on DeetSheet."
  >
    <H1>Your post has been denied.</H1>
    <P>
      Thank you for posting on DeetSheet, but your recent post has been denied:
    </P>
    {(topic || title) && <Quote>{[topic, title].filter(Boolean).join(': ')}</Quote>}
    <P>It was denied for the following reason:</P>
    {reasons && reasons.length > 0 && <ReasonBox items={reasons} />}
    <P>
      DeetSheet does not tolerate vulgar or hateful language. We built this
      platform to help others and not bring them down. Your post has been
      deleted.
    </P>
    <P>
      You may post again, but this is a warning that your account is now on
      probation and will be blocked if you post again and don&apos;t follow the{' '}
      <Link href={`${SITE_URL}/rules`} style={subtleLink}>
        Rules and Guidelines
      </Link>{' '}
      of DeetSheet.
    </P>

  </Shell>
)

export const template = {
  component: Email,
  subject: 'Your DeetSheet post has been denied',
  displayName: 'Post denied',
  previewData: {
    topic: 'Life: Roommates',
    title: 'Dealing with a bad roommate',
    reasons: ['Vulgar language directed at another person'],
  },
} satisfies TemplateEntry
