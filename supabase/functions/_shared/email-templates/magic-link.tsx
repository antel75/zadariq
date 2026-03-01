/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="hr" dir="ltr">
    <Head />
    <Preview>Tvoj link za prijavu — ZadarIQ</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>
          <span style={logoMain}>Zadar</span>
          <span style={logoAccent}>IQ</span>
        </Text>
        <Hr style={divider} />
        <Heading style={h1}>Tvoj link za prijavu</Heading>
        <Text style={text}>
          Klikni na gumb ispod za prijavu na ZadarIQ. Link vrijedi kratko vrijeme.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Prijavi se
        </Button>
        <Text style={footer}>
          Ako nisi zatražio/la ovaj link, slobodno zanemari ovaj email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const logo = { fontSize: '24px', fontWeight: 'bold' as const, margin: '0 0 8px', textAlign: 'center' as const }
const logoMain = { color: 'hsl(215, 25%, 12%)' }
const logoAccent = { color: 'hsl(187, 72%, 50%)' }
const divider = { borderColor: 'hsl(214, 20%, 90%)', margin: '16px 0 24px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(215, 25%, 12%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(215, 15%, 50%)',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const button = {
  backgroundColor: 'hsl(215, 70%, 28%)',
  color: 'hsl(210, 40%, 98%)',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}
const footer = { fontSize: '12px', color: 'hsl(215, 15%, 65%)', margin: '30px 0 0' }
