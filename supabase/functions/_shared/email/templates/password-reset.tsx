import { Button, Text } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { BaseEmail, buttonStyle, textStyle, subtextStyle } from '../base.tsx';

interface PasswordResetProps {
  resetLink: string;
}

export const PasswordReset = ({ resetLink }: PasswordResetProps) => (
  <BaseEmail
    preview="Reset your Seeksy password"
    heading="Reset Your Password"
  >
    <Text style={textStyle}>
      We received a request to reset your Seeksy account password. Click the button below to
      create a new password:
    </Text>
    <Button href="{{RESET_LINK}}" style={buttonStyle}>
      Reset Your Password
    </Button>
    <Text style={subtextStyle}>
      This link will expire in 1 hour for security reasons.
    </Text>
    <Text style={subtextStyle}>
      If you didn't request a password reset, you can safely ignore this email. Your password
      won't be changed.
    </Text>
  </BaseEmail>
);
