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

interface Props {
  topic?: string
  title?: string
  reasons?: string[]
  suggestions?: string[]
  ctaUrl?: string
}

const Email = ({ topic, title, reasons, suggestions, ctaUrl }: Props) => (
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
    <P>
      If you would like to change your post to the suggestions above, you may do
      so.
    </P>
    <DeadlineStrip>
      You will have 30 days to adjust your post, or it will be automatically
      deleted.
    </DeadlineStrip>
    <Cta href={ctaUrl || `${SITE_URL}/profile`} label="Edit your post" />
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
