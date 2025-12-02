import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type AccountType } from '@/hooks/useAccountType';
import { Sparkles, CheckCircle } from 'lucide-react';

interface CompletionStepProps {
  accountType: AccountType;
  onFinish: () => void;
  isLoading: boolean;
}

const accountTypeLabels: Record<AccountType, string> = {
  creator: 'Creator',
  podcaster: 'Podcaster',
  advertiser: 'Advertiser',
  agency: 'Agency',
  event_planner: 'Event Planner',
  brand: 'Brand Explorer',
  studio_team: 'Studio Team',
  admin: 'Administrator',
};

const dashboardDescriptions: Record<AccountType, string> = {
  creator: 'Access your personalized creator dashboard with content tools, analytics, and monetization features.',
  podcaster: 'Start creating episodes, manage your podcast, and grow your audience.',
  advertiser: 'Launch campaigns, discover creators, and track performance.',
  agency: 'Manage your creators, coordinate campaigns, and streamline operations.',
  event_planner: 'Set up events, manage bookings, and engage attendees.',
  brand: 'Explore Seeksy tools and discover what is possible.',
  studio_team: 'Collaborate with your team on productions and content.',
  admin: 'Access admin tools and platform management.',
};

export function CompletionStep({ accountType, onFinish, isLoading }: CompletionStepProps) {
  return (
    <Card className="p-8">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <div className="relative bg-primary/10 p-4 rounded-full">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold">You're all set!</h2>
          <p className="text-xl text-muted-foreground">
            Welcome to Seeksy as a {accountTypeLabels[accountType]}
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 text-left space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Account configured</p>
              <p className="text-sm text-muted-foreground">
                Your account is ready with the right tools for your needs
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Personalized dashboard</p>
              <p className="text-sm text-muted-foreground">
                {dashboardDescriptions[accountType]}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Ready to grow</p>
              <p className="text-sm text-muted-foreground">
                All features unlocked and ready for you to explore
              </p>
            </div>
          </div>
        </div>

        <Button 
          size="lg" 
          className="w-full" 
          onClick={onFinish}
          disabled={isLoading}
        >
          {isLoading ? 'Setting up...' : 'Go to Dashboard'}
        </Button>
      </div>
    </Card>
  );
}
