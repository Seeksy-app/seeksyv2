import { Button, Text } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { BaseEmail, buttonStyle, textStyle } from '../base.tsx';

interface IdentityVerifiedProps {
  type: 'Face' | 'Voice';
  certificateUrl: string;
}

export const IdentityVerified = ({
  type,
  certificateUrl,
}: IdentityVerifiedProps) => (
  <BaseEmail
    preview={`Your ${type} identity is verified`}
    heading={`${type} Identity Verified`}
    enableMascot={true}
  >
    <Text style={textStyle}>
      Congratulations! Your <strong>{type.toLowerCase()}</strong> identity has been successfully verified
      and secured on the blockchain.
    </Text>
    <Text style={textStyle}>
      Your identity is now protected by cryptographic certification, ensuring authenticity and
      security across all platforms.
    </Text>
    <Button href="{{CERTIFICATE_URL}}" style={buttonStyle}>
      View Certificate
    </Button>
    <Text style={textStyle}>
      This certificate is permanent and can be used to verify your identity anywhere.
    </Text>
  </BaseEmail>
);
