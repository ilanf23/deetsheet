import * as React from 'npm:react@18.3.1'
import { Link, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Cta, GREEN, H1, P, SITE_URL, Shell, TipsBox } from './_shell.tsx'

// The welcome CTA always points at the public site root. Never build a
// /profile/:userId URL in email — the recipient may not be signed in yet.
const Email = () => (
  <Shell
    eyebrow="WELCOME"
    preview="Welcome to DeetSheet — learn and share advice on a wide variety of topics."
    statusLabel="Status:"
    statusValue="Your account is ready"
    footerReason="You're receiving this email because you created a DeetSheet account."
  >
    <H1>Welcome to DeetSheet!</H1>
    <P>Get ready to learn and share advice on a wide variety of topics!</P>
    <P>Now that you created an account, below are a few suggestions.</P>
    <TipsBox
      items={[
        {
          title: 'Rank Your Favorite posts!',
          body: 'We want your feedback on which posts you think are the best. Reward others for sharing great advice by ranking their posts.',
        },
        {
          title: 'Create Your Own Posts!',
          body: 'Share advice about your job, hometown, or life in general.',
        },
        {
          title: 'Comment on Other Posts!',
          body: "If you have more to add on someone else's post, share your own story, experience, or advice.",
        },
      ]}
    />
    <P>
      We appreciate you adding to the DeetSheet community. Your few suggestions
      could help someone for a lifetime.
    </P>
    <P>DeetSheet</P>
    <Cta href={SITE_URL} label="Return to DeetSheet" />
    <Section style={{ textAlign: 'center', margin: '14px 0 0' }}>
      <Link href={`${SITE_URL}/inspiration`} style={smallGreenLink}>
        Inspirations for posts
      </Link>
      <Text style={{ margin: '6px 0 0' }}>
        <Link href={`${SITE_URL}/rules`} style={smallGreenLink}>
          Rules and Guidelines
        </Link>
      </Text>
    </Section>
  </Shell>
)

const smallGreenLink = {
  color: GREEN,
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
}

export const template = {
  component: Email,
  subject: 'Welcome to DeetSheet',
  displayName: 'Welcome',
  previewData: {},
} satisfies TemplateEntry
