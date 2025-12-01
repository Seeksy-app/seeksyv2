import { Button, Text } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { BaseEmail, buttonStyle, textStyle } from '../base.tsx';

interface AIProductionReadyProps {
  sessionTitle: string;
  downloadLink: string;
  clipsLink: string;
}

export const AIProductionReady = ({
  sessionTitle,
  downloadLink,
  clipsLink,
}: AIProductionReadyProps) => (
  <BaseEmail
    preview="Your AI post-production is complete"
    heading="Your Content is Ready"
    enableMascot={true}
  >
    <Text style={textStyle}>
      Great news! The AI post-production for <strong>{sessionTitle}</strong> is complete.
    </Text>
    <Text style={textStyle}>
      Your edited content is ready to download, and we've generated social media clips for you.
    </Text>
    <Button href="{{DOWNLOAD_LINK}}" style={buttonStyle}>
      Download Assets
    </Button>
    <Button href="{{CLIPS_LINK}}" style={{...buttonStyle, backgroundColor: '#10b981'}}>
      View Clips
    </Button>
    <Text style={textStyle}>
      Your assets will be available for 30 days.
    </Text>
  </BaseEmail>
);
