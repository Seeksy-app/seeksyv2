import { Button, Text, Section } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { BaseEmail, buttonStyle, textStyle } from '../base.tsx';

interface CampaignEmailProps {
  subject: string;
  body: string;
  ctaText?: string;
  ctaLink?: string;
}

export const CampaignEmail = ({
  subject,
  body,
  ctaText,
  ctaLink,
}: CampaignEmailProps) => (
  <BaseEmail
    preview={subject}
    heading={subject}
  >
    <Section dangerouslySetInnerHTML={{ __html: body }} style={textStyle} />
    {ctaText && ctaLink && (
      <Button href={ctaLink} style={buttonStyle}>
        {ctaText}
      </Button>
    )}
  </BaseEmail>
);
