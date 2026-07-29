import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BORDER, Cta, H1, P, Quote, SITE_URL, Shell, TEXT } from './_shell.tsx'

interface Props {
  commenterName?: string
  postTitle?: string
  commentText?: string
  postUrl?: string
}

const Email = ({
  commenterName = 'Someone',
  postTitle = 'your post',
  commentText,
  postUrl,
}: Props) => (
  <Shell
    eyebrow="NEW COMMENT"
    preview={`${commenterName} commented on ${postTitle}`}
    statusLabel="Status:"
    statusValue="You have a new comment"
    footerReason="You're receiving this email because someone commented on your DeetSheet post."
  >
    <H1>{`${commenterName} commented on your post`}</H1>
    <Quote>{postTitle}</Quote>
    {commentText && (
      <Text
        style={{
          color: TEXT,
          fontSize: '16px',
          lineHeight: 1.55,
          margin: '0 0 20px',
          padding: '14px 16px',
          border: `1px solid ${BORDER}`,
          borderRadius: '10px',
          backgroundColor: '#f7f7f7',
        }}
      >
        {commentText}
      </Text>
    )}
    <P>Log in to read the full conversation and reply.</P>
    <Cta href={postUrl || SITE_URL} label="View the comment" />
  </Shell>
)

export const template = {
  component: Email,
  subject: (data: Props) =>
    `${data?.commenterName || 'Someone'} commented on your post${
      data?.postTitle ? ` “${data.postTitle}”` : ''
    }`,
  displayName: 'Comment notification',
  previewData: {
    commenterName: 'Jordan',
    postTitle: 'Best neighborhoods for new grads in Austin',
    commentText: 'This matches my experience exactly — I would add that parking is rough downtown.',
    postUrl: 'https://deetsheet.com/topic/austin/post/best-neighborhoods-abc12345',
  },
} satisfies TemplateEntry
