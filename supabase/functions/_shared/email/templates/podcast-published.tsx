import { Button, Text } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { BaseEmail, buttonStyle, textStyle } from '../base.tsx';

interface PodcastPublishedProps {
  episodeTitle: string;
  showName: string;
  episodeLink: string;
}

export const PodcastPublished = ({
  episodeTitle,
  showName,
  episodeLink,
}: PodcastPublishedProps) => (
  <BaseEmail
    preview={`New episode: ${episodeTitle}`}
    heading="New Podcast Episode"
    enableMascot={true}
  >
    <Text style={textStyle}>
      A new episode of <strong>{showName}</strong> is now available:
    </Text>
    <Text style={episodeTitleStyle}>
      {episodeTitle}
    </Text>
    <Button href="{{EPISODE_LINK}}" style={buttonStyle}>
      Listen Now
    </Button>
    <Text style={textStyle}>
      Don't miss out on this latest episode!
    </Text>
  </BaseEmail>
);

const episodeTitleStyle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '16px 0',
};
