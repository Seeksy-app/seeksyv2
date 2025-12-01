import { Button, Text, Section } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { BaseEmail, buttonStyle, textStyle, subtextStyle } from '../base.tsx';

interface VerifyEmailProps {
  code: string;
}

export const VerifyEmail = ({ code }: VerifyEmailProps) => (
  <BaseEmail
    preview="Confirm your email address"
    heading="Verify Your Email"
  >
    <Text style={textStyle}>
      Please confirm your email address by entering this verification code:
    </Text>
    <Section style={codeContainer}>
      <Text style={codeStyle}>{code}</Text>
    </Section>
    <Button href="{{BASE_URL}}/verify-email?code={{CODE}}" style={buttonStyle}>
      Confirm Email
    </Button>
    <Text style={subtextStyle}>
      This code will expire in 24 hours. If you didn't request this email, you can safely ignore it.
    </Text>
  </BaseEmail>
);

const codeContainer = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const codeStyle = {
  fontSize: '32px',
  fontWeight: '700',
  letterSpacing: '8px',
  color: '#1a1a1a',
  margin: '0',
};
