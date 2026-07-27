import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Cta, H1, P, SITE_URL, Shell, SuggestionsBox } from './_shell.tsx'

interface Props {
  firstName?: string
}

// The welcome CTA always points at the generic own-profile route. Never build
// a /profile/:userId URL in email — the recipient may not be signed in yet.
const Email = ({ firstName }: Props) => (
  <Shell
    eyebrow="WELCOME"
    preview="Welcome to DeetSheet — here's how to make your first post count."
    statusLabel="Status:"
    statusValue="Your account is ready"
    footerReason="You're receiving this email because you created a DeetSheet account."
  >
    <H1>Welcome to DeetSheet{firstName ? `, ${firstName}` : ''}.</H1>
    <P>
      DeetSheet is a place for short, ranked insights — the kind of detail you
      only learn from doing something yourself. Here are three tips before you
      start:
    </P>
    <SuggestionsBox
      label="THREE TIPS"
      items={[
        '1. Post one concrete, uncommon fact — something most people would not already know.',
        '2. No opinions, no exclamation points, few words.',
        '3. Rank what you know. Your ratings help the best deets rise to the top.',
      ]}
    />
    <Text style={{ color: '#1a1a1a', fontSize: '16px', lineHeight: 1.55, margin: '0 0 4px' }}>
      That's it. Add your first deet and see where it lands.
    </Text>
    <Cta href={`${SITE_URL}/profile`} label="Make your first post" />
  </Shell>
)

export const template = {
  component: Email,
  subject: 'Welcome to DeetSheet',
  displayName: 'Welcome',
  previewData: { firstName: 'Ilan' },
} satisfies TemplateEntry
