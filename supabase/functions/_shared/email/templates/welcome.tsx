import { Button, Text } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { BaseEmail, buttonStyle, textStyle } from '../base.tsx';

interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <BaseEmail
    preview="Welcome to Seeksy — your new home for creators."
    heading={`Welcome to Seeksy, ${name}!`}
    enableMascot={true}
  >
    <Text style={textStyle}>
      We're thrilled to have you join the Seeksy community. You now have access to powerful tools
      for creating, managing, and monetizing your content.
    </Text>
    <Text style={textStyle}>
      Here's what you can do:
    </Text>
    <Text style={textStyle}>
      • Create and manage podcasts with AI-powered editing<br />
      • Build your creator profile and monetize your content<br />
      • Connect with your audience through meetings and live streams<br />
      • Verify your identity with blockchain-backed certificates
    </Text>
    <Button href="{{BASE_URL}}/dashboard" style={buttonStyle}>
      Get Started
    </Button>
    <Text style={textStyle}>
      If you have any questions, our team is here to help. Just reply to this email.
    </Text>
  </BaseEmail>
);
