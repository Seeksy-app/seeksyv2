import { Button, Text } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { BaseEmail, buttonStyle, textStyle, subtextStyle } from '../base.tsx';

interface MeetingInvitationProps {
  hostName: string;
  meetingTitle: string;
  date: string;
  time: string;
  meetingLink: string;
}

export const MeetingInvitation = ({
  hostName,
  meetingTitle,
  date,
  time,
  meetingLink,
}: MeetingInvitationProps) => (
  <BaseEmail
    preview={`You're invited to ${meetingTitle}`}
    heading="Meeting Invitation"
  >
    <Text style={textStyle}>
      <strong>{hostName}</strong> has invited you to join:
    </Text>
    <Text style={meetingTitleStyle}>
      {meetingTitle}
    </Text>
    <Text style={textStyle}>
      <strong>When:</strong> {date} at {time}
    </Text>
    <Button href="{{MEETING_LINK}}" style={buttonStyle}>
      Join Meeting
    </Button>
    <Text style={subtextStyle}>
      You can join the meeting 5 minutes before the scheduled start time.
    </Text>
  </BaseEmail>
);

const meetingTitleStyle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '16px 0',
};
