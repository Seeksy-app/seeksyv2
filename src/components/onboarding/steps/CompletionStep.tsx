import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type AccountType } from '@/hooks/useAccountType';
import { Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <Card className="p-8 shadow-xl border-border/50">
      <div className="text-center space-y-6">
        <motion.div 
          className="flex justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <div className="relative bg-primary/10 p-5 rounded-full">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold">You're all set!</h2>
          <p className="text-lg text-muted-foreground">
            Welcome to Seeksy as a {accountTypeLabels[accountType]}
          </p>
        </motion.div>

        <motion.div 
          className="bg-muted/50 rounded-xl p-6 text-left space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {[
            { title: 'Account configured', desc: 'Your account is ready with the right tools for your needs' },
            { title: 'Personalized dashboard', desc: dashboardDescriptions[accountType] },
            { title: 'Ready to grow', desc: 'All features unlocked and ready for you to explore' },
          ].map((item, index) => (
            <motion.div 
              key={item.title}
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button 
            size="lg" 
            className="w-full h-12 text-base font-semibold shadow-lg" 
            onClick={onFinish}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              'Go to Dashboard'
            )}
          </Button>
        </motion.div>
      </div>
    </Card>
  );
}
