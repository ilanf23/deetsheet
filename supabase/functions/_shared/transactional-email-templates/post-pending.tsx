import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
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
import { PENDING_CLOSING, PENDING_DEADLINE, REVIEWER_NOTE_LABEL } from './copy.ts'

interface Props {
  topic?: string
  title?: string
  reasons?: string[]
  suggestions?: string[]
  /** Optional custom note the reviewer typed (only sent when customised). */
  adminNote?: string
  ctaUrl?: string
}

const Email = ({ topic, title, reasons, suggestions, adminNote, ctaUrl }: Props) => (
  <Shell
    eyebrow="POST REVIEW"
    preview="Your post is pending — here's how to get it approved."
    statusValue="Pending — not yet approved"
    footerReason="You're receiving this email because you submitted a post on DeetSheet."
  >
    <H1>Your post is almost there.</H1>
    <P>
      Thank you for posting on DeetSheet. Your recent post has NOT been approved:
    </P>
    {(topic || title) && <Quote>{[topic, title].filter(Boolean).join(': ')}</Quote>}
    <P>It&apos;s pending for the following reason:</P>
    {reasons && reasons.length > 0 && <ReasonBox items={reasons} />}
    {suggestions && suggestions.length > 0 && (
      <>
        <P>Below are some suggestions on how it could read:</P>
        <SuggestionsBox items={suggestions} />
      </>
    )}
    {adminNote && adminNote.trim() && (
      <ReasonBox label={REVIEWER_NOTE_LABEL} items={adminNote.trim().split('\n').filter((l) => l.trim())} />
    )}
    <P>{PENDING_CLOSING}</P>
    <Cta href={ctaUrl || `${SITE_URL}/profile`} label="Edit your post" />
    <DeadlineStrip>{PENDING_DEADLINE}</DeadlineStrip>
  </Shell>
)

export const template = {
  component: Email,
  subject: 'Your DeetSheet post is pending approval',
  displayName: 'Post pending',
  previewData: {
    topic: '1980s',
    title: 'Clothing',
    reasons: ['Too vague'],
    suggestions: ['Preppy clothing', 'Spandex clothing'],
  },
} satisfies TemplateEntry
