import { Button, Text } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { BaseEmail, buttonStyle, textStyle } from '../base.tsx';

interface EventRegistrationProps {
  eventName: string;
  date: string;
  time: string;
  location: string;
  addToCalendarLink: string;
}

export const EventRegistration = ({
  eventName,
  date,
  time,
  location,
  addToCalendarLink,
}: EventRegistrationProps) => (
  <BaseEmail
    preview="Your event registration is confirmed"
    heading="Event Registration Confirmed"
    enableMascot={true}
  >
    <Text style={textStyle}>
      You're all set! Your registration for <strong>{eventName}</strong> is confirmed.
    </Text>
    <Text style={textStyle}>
      <strong>Date:</strong> {date}<br />
      <strong>Time:</strong> {time}<br />
      <strong>Location:</strong> {location}
    </Text>
    <Button href="{{ADD_TO_CALENDAR_LINK}}" style={buttonStyle}>
      Add to Calendar
    </Button>
    <Text style={textStyle}>
      We'll send you a reminder before the event. See you there!
    </Text>
  </BaseEmail>
);
