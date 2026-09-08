import * as React from 'npm:react@18.3.1'
import { Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { H1, P, Quote, ReasonBox, SITE_URL, Shell, subtleLink } from './_shell.tsx'

interface Props {
  topic?: string
  title?: string
  reasons?: string[]
  /** Conduct violations carry the probation warning. Content-fit denials do not. */
  probationWarning?: boolean
}

const Email = ({ topic, title, reasons, probationWarning = true }: Props) => (
  <Shell
    eyebrow="POST REVIEW"
    preview={
      probationWarning
        ? 'Your DeetSheet post has been denied.'
        : 'Your DeetSheet post was not approved.'
    }
    statusValue={probationWarning ? 'Denied, account on probation' : 'Denied'}
    footerReason="You're receiving this email because you submitted a post on DeetSheet."
  >
    <H1>Your post has been denied.</H1>
    <P>
      Thank you for posting on DeetSheet, but your recent post has been denied:
    </P>
    {(topic || title) && <Quote>{[topic, title].filter(Boolean).join(': ')}</Quote>}
    <P>It was denied for the following reason:</P>
    {reasons && reasons.length > 0 && <ReasonBox items={reasons} />}
    {probationWarning ? (
      <>
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
      </>
    ) : (
      <P>
        This is not a Rules violation and it does not affect your account. You are
        welcome to revise the post and submit it again, or post something new. See the{' '}
        <Link href={`${SITE_URL}/rules`} style={subtleLink}>
          Rules and Guidelines
        </Link>
        .
      </P>
    )}
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
