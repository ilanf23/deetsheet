import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { PENDING_CLOSING, PENDING_DEADLINE } from './copy.ts'
import {
  Cta,
  DeadlineStrip,
  H1,
  P,
  Quote,
  ReasonBox,
  SITE_URL,
  Shell,
  SuggestionsBox,
} from './_shell.tsx'

/**
 * Generic admin → author message, styled to the same green-banner brand as the
 * automated review emails. Keeps the review-slip structure
 * (Status / Post / Reason / Suggestions / Deadline) as brand blocks.
 */
interface Props {
  eyebrow?: string
  statusLabel?: string
  statusValue?: string
  headline?: string
  intro?: string
  quotedTitle?: string
  reason?: string
  reasons?: string[]
  suggestions?: string[]
  bodyText?: string
  callout?: string
  ctaLabel?: string
  ctaUrl?: string
  footerReason?: string
  /** Legacy admin messages authored with a plain subject. */
  subject?: string
}

const Email = ({
  eyebrow = 'POST REVIEW',
  statusLabel = 'Status:',
  statusValue,
  headline,
  intro,
  quotedTitle,
  reason,
  reasons,
  suggestions,
  bodyText,
  callout,
  ctaLabel,
  ctaUrl,
  footerReason = "You're receiving this email because of activity on your DeetSheet account.",
  subject,
}: Props) => {
  const reasonItems = reasons && reasons.length > 0 ? reasons : reason ? [reason] : []
  return (
    <Shell
      eyebrow={eyebrow}
      preview={headline || subject || quotedTitle || 'A message from DeetSheet'}
      statusLabel={statusLabel}
      statusValue={statusValue}
      footerReason={footerReason}
    >
      {(headline || subject) && <H1>{headline || subject}</H1>}
      {intro && <P>{intro}</P>}
      {quotedTitle && <Quote>{quotedTitle}</Quote>}
      {reasonItems.length > 0 && <ReasonBox items={reasonItems} />}
      {suggestions && suggestions.length > 0 && <SuggestionsBox items={suggestions} />}
      {bodyText &&
        bodyText
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map((line, i) => (
            <Text
              key={i}
              style={{ color: '#1a1a1a', fontSize: '16px', lineHeight: 1.55, margin: '0 0 14px' }}
            >
              {line}
            </Text>
          ))}
      {callout && <DeadlineStrip>{callout}</DeadlineStrip>}
      {ctaUrl && ctaLabel && <Cta href={ctaUrl} label={ctaLabel} />}
      {!ctaUrl && <Cta href={`${SITE_URL}/profile`} label="Open DeetSheet" />}
    </Shell>
  )
}

export const template = {
  component: Email,
  subject: (data: Props) => data?.headline || data?.subject || 'A message from DeetSheet',
  displayName: 'Admin message',
  previewData: {
    eyebrow: 'POST REVIEW',
    statusValue: 'Pending — not yet approved',
    headline: 'Your post is almost there.',
    intro:
      'Thank you for posting on DeetSheet. Your recent post has not been approved yet:',
    quotedTitle: '1980s: Clothing',
    reasons: ['Too vague'],
    suggestions: ['Preppy clothing', 'Spandex clothing'],
    bodyText: PENDING_CLOSING,
    callout: PENDING_DEADLINE,
    ctaLabel: 'Edit your post',
    ctaUrl: 'https://deetsheet.com/profile',
    footerReason: "You're receiving this email because you submitted a post on DeetSheet.",
  },
} satisfies TemplateEntry
