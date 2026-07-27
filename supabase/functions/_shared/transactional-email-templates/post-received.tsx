import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { Cta, H1, P, PostCard, SITE_URL, Shell } from './_shell.tsx'

interface Props {
  topic?: string
  title?: string
  imageUrl?: string
  isAnonymous?: boolean
  ctaUrl?: string
}

const Email = ({ topic, title, imageUrl, isAnonymous, ctaUrl }: Props) => (
  <Shell
    eyebrow="POST RECEIVED"
    preview="We received your post — it's queued for review."
    statusValue="Received — in the review queue"
    footerReason="You're receiving this email because you submitted a post on DeetSheet."
  >
    <H1>We got your post.</H1>
    <P>
      Thank you for posting on DeetSheet. Your post will be reviewed for
      approval shortly. You may change the text, photo, or the anonymous
      setting at any point.
    </P>
    <PostCard topic={topic} title={title} imageUrl={imageUrl} isAnonymous={isAnonymous} />
    <Cta href={ctaUrl || `${SITE_URL}/profile`} label="View or edit your post" />
  </Shell>
)

export const template = {
  component: Email,
  subject: 'We received your DeetSheet post',
  displayName: 'Post received',
  previewData: {
    topic: 'Jobs: Work from Home',
    title: 'Block two hours a day with no meetings',
    isAnonymous: false,
  },
} satisfies TemplateEntry
