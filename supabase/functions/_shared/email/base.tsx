import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface BaseEmailProps {
  preview: string;
  heading: string;
  children: React.ReactNode;
  enableMascot?: boolean;
  darkMode?: boolean;
}

export const BaseEmail = ({
  preview,
  heading,
  children,
  enableMascot = false,
  darkMode = false,
}: BaseEmailProps) => (
  <Html>
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header with logo */}
        <Section style={header}>
          <Img
            src={darkMode ? "{{LOGO_DARK_URL}}" : "{{LOGO_URL}}"}
            width="120"
            height="40"
            alt="Seeksy"
            style={logo}
          />
        </Section>

        {/* Optional mascot */}
        {enableMascot && (
          <Section style={mascotSection}>
            <Img
              src="{{MASCOT_URL}}"
              width="80"
              height="80"
              alt="Seeksy Spark"
              style={mascot}
            />
          </Section>
        )}

        {/* Main content card */}
        <Section style={contentCard}>
          <Heading style={h1}>{heading}</Heading>
          {children}
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Hr style={divider} />
          <Text style={footerText}>
            © {new Date().getFullYear()} Seeksy. All rights reserved.
          </Text>
          <Text style={footerLinks}>
            <Link href="{{BASE_URL}}/email-preferences" style={link}>
              Update Preferences
            </Link>
            {' · '}
            <Link href="{{BASE_URL}}/unsubscribe?email={{EMAIL}}" style={link}>
              Unsubscribe
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const header = {
  padding: '32px 40px',
};

const logo = {
  margin: '0 auto',
};

const mascotSection = {
  textAlign: 'center' as const,
  padding: '0 40px 20px',
};

const mascot = {
  margin: '0 auto',
};

const contentCard = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '32px 40px',
  margin: '0 20px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 20px',
};

const footer = {
  padding: '32px 40px 0',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 0',
  textAlign: 'center' as const,
};

const footerLinks = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 0',
  textAlign: 'center' as const,
};

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
};

// Export button style for reuse
export const buttonStyle = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  margin: '24px 0',
};

export const textStyle = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

export const subtextStyle = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '12px 0',
};
