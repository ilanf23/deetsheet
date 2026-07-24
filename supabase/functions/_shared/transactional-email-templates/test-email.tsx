import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  message?: string
}

const Email = ({ message }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>DeetSheet email test</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>DeetSheet email test</Heading>
        <Text style={text}>
          {message || "If you're reading this, DeetSheet's email sender is working correctly. 🎉"}
        </Text>
        <Text style={muted}>— DeetSheet</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'DeetSheet email test',
  displayName: 'Test email',
  previewData: { message: 'This is a preview.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px' }
const h1 = { color: '#1a3d2e', fontSize: '22px', margin: '0 0 16px' }
const text = { color: '#1a1a1a', fontSize: '15px', lineHeight: '1.5', margin: '0 0 16px' }
const muted = { color: '#64708b', fontSize: '13px', margin: '24px 0 0' }
