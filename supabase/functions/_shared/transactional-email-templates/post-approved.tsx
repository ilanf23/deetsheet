import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { Cta, H1, P, Quote, SITE_URL, Shell } from './_shell.tsx'

interface Props {
  topic?: string
  title?: string
  ctaUrl?: string
}

const Email = ({ topic, title, ctaUrl }: Props) => (
  <Shell
    eyebrow="POST REVIEW"
    preview="Your DeetSheet post has been approved."
    statusValue="Approved — your post is live"
    footerReason="You're receiving this email because you submitted a post on DeetSheet."
  >
    <H1>Your post has been approved.</H1>
    <P>Thank you for posting on DeetSheet. Your recent post has been approved!</P>
    {(topic || title) && <Quote>{[topic, title].filter(Boolean).join(': ')}</Quote>}
    <P>
      We appreciate you adding to the DeetSheet community. Please post, rank, or
      comment on other areas of DeetSheet. Your few suggestions could help
      someone for a lifetime.
    </P>
    <Cta href={ctaUrl || `${SITE_URL}/profile`} label="See your post live" />
  </Shell>
)

export const template = {
  component: Email,
  subject: 'Your DeetSheet post has been approved',
  displayName: 'Post approved',
  previewData: { topic: 'Cities: Austin', title: 'Street parking is free after 6pm downtown' },
} satisfies TemplateEntry
