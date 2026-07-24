import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Link, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  subject?: string
  bodyHtml?: string
}

const Email = ({ subject, bodyHtml }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{subject || 'A message from DeetSheet'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={badge}>DeetSheet — message from the team</Text>
        <Heading style={h1}>{subject || 'A message from DeetSheet'}</Heading>
        <div
          style={bodyBox}
          // Body is authored by the admin via the internal messaging tool;
          // rendered as-is so paragraph breaks and formatting come through.
          dangerouslySetInnerHTML={{ __html: bodyHtml || '' }}
        />
        <Text style={muted}>
          Reply on DeetSheet:{' '}
          <Link href="https://deetsheet.com/inbox" style={link}>
            deetsheet.com/inbox
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Props) => data?.subject || 'A message from DeetSheet',
  displayName: 'Admin message',
  previewData: {
    subject: 'Update on your post',
    bodyHtml: '<p>Hi — an editor reviewed your post and here are the details.</p>',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '600px' }
const badge = {
  color: '#1a3d2e',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}
const h1 = { color: '#1a1a1a', fontSize: '20px', margin: '0 0 16px' }
const bodyBox = {
  color: '#1a1a1a',
  fontSize: '15px',
  lineHeight: '1.55',
  padding: '16px 18px',
  border: '1px solid #e6e8ee',
  borderRadius: '6px',
  background: '#fafbfc',
}
const muted = { color: '#64708b', fontSize: '13px', margin: '24px 0 0' }
const link = { color: '#1a3d2e' }
