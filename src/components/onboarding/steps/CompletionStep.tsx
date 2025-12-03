import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type AccountType } from '@/hooks/useAccountType';
import { Trophy, CheckCircle, Loader2, Sparkles, Rocket, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CompletionStepProps {
  accountType: AccountType;
  onFinish: () => void;
  isLoading: boolean;
}

const accountTypeLabels: Record<AccountType, string> = {
  creator: 'Content Creator',
  podcaster: 'Podcaster',
  advertiser: 'Advertiser',
  agency: 'Agency Manager',
  event_planner: 'Event Host',
  brand: 'Explorer',
  studio_team: 'Studio Team',
  admin: 'Administrator',
  influencer: 'Influencer',
};

const accountTypeGradients: Record<AccountType, string> = {
  creator: 'from-purple-500 to-pink-500',
  podcaster: 'from-blue-500 to-cyan-500',
  influencer: 'from-amber-500 to-yellow-500',
  advertiser: 'from-orange-500 to-red-500',
  agency: 'from-green-500 to-emerald-500',
  event_planner: 'from-indigo-500 to-purple-500',
  brand: 'from-slate-500 to-gray-500',
  studio_team: 'from-rose-500 to-pink-500',
  admin: 'from-gray-500 to-slate-500',
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
  influencer: 'Grow your audience, track analytics, and land brand deals.',
};

// Confetti particle component
function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#3B82F6'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: color, left: `${x}%` }}
      initial={{ top: '0%', opacity: 1, scale: 1 }}
      animate={{ 
        top: '100%', 
        opacity: 0, 
        scale: 0,
        x: Math.random() * 100 - 50,
        rotate: Math.random() * 360
      }}
      transition={{ 
        duration: 2, 
        delay, 
        ease: 'easeOut' 
      }}
    />
  );
}

export function CompletionStep({ accountType, onFinish, isLoading }: CompletionStepProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const gradient = accountTypeGradients[accountType];

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="p-8 shadow-xl border-border/50 bg-gradient-to-br from-card via-card to-muted/30 overflow-hidden relative">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <ConfettiParticle key={i} delay={i * 0.1} x={Math.random() * 100} />
          ))}
        </div>
      )}

      <div className="text-center space-y-6 relative z-10">
        {/* Trophy with gradient glow */}
        <motion.div 
          className="flex justify-center"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
        >
          <div className="relative">
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br blur-2xl opacity-50 rounded-full scale-150",
              gradient
            )} />
            <div className={cn(
              "relative p-6 rounded-full bg-gradient-to-br shadow-xl",
              gradient
            )}>
              <Trophy className="h-12 w-12 text-white" />
            </div>
            {/* Floating stars */}
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            </motion.div>
            <motion.div
              className="absolute -bottom-1 -left-3"
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4 text-pink-400" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold">You're all set!</h2>
          <p className="text-lg text-muted-foreground">
            Welcome to Seeksy as a <span className={cn("font-semibold bg-gradient-to-r bg-clip-text text-transparent", gradient)}>{accountTypeLabels[accountType]}</span>
          </p>
        </motion.div>

        <motion.div 
          className="bg-muted/30 rounded-xl p-5 text-left space-y-3 border border-border/50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {[
            { title: 'Account configured', desc: 'Your account is ready with the right tools' },
            { title: 'Personalized dashboard', desc: dashboardDescriptions[accountType] },
            { title: 'Ready to grow', desc: 'All features unlocked and ready to explore' },
          ].map((item, index) => (
            <motion.div 
              key={item.title}
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <div className={cn("p-1 rounded-full bg-gradient-to-br", gradient)}>
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button 
            size="lg" 
            className={cn(
              "w-full h-12 text-base font-semibold shadow-lg",
              "bg-gradient-to-r text-white",
              gradient
            )}
            onClick={onFinish}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Go to Dashboard
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </Card>
  );
}
