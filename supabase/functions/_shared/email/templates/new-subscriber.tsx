import { Button, Text } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { BaseEmail, buttonStyle, textStyle } from '../base.tsx';

interface NewSubscriberProps {
  subscriberEmail: string;
  preferencesLink: string;
}

export const NewSubscriber = ({
  subscriberEmail,
  preferencesLink,
}: NewSubscriberProps) => (
  <BaseEmail
    preview="New subscriber to your content"
    heading="New Subscriber!"
    enableMascot={true}
  >
    <Text style={textStyle}>
      You have a new subscriber! <strong>{subscriberEmail}</strong> just subscribed to your content.
    </Text>
    <Text style={textStyle}>
      Your audience is growing — keep creating amazing content!
    </Text>
    <Button href="{{PREFERENCES_LINK}}" style={buttonStyle}>
      View Subscriber
    </Button>
    <Text style={textStyle}>
      Manage all your subscribers and their preferences in your dashboard.
    </Text>
  </BaseEmail>
);
