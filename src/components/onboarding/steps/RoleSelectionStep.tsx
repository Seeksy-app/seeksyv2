import { Card } from '@/components/ui/card';
import { Mic, Megaphone, Users, Calendar, Building, Sparkles, Star, Video } from 'lucide-react';
import { type AccountType } from '@/hooks/useAccountType';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RoleOption {
  type: AccountType;
  label: string;
  description: string;
  icon: any;
  gradient: string;
  bgGradient: string;
}

const roleOptions: RoleOption[] = [
  {
    type: 'creator',
    label: 'Content Creator',
    description: 'Video, audio, and social content',
    icon: Sparkles,
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
  },
  {
    type: 'podcaster',
    label: 'Podcaster',
    description: 'Host, produce, and distribute shows',
    icon: Mic,
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
  },
  {
    type: 'influencer',
    label: 'Influencer',
    description: 'Grow and monetize your presence',
    icon: Star,
    gradient: 'from-amber-500 to-yellow-500',
    bgGradient: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30',
  },
  {
    type: 'advertiser',
    label: 'Brand / Advertiser',
    description: 'Advertise, sponsor, and promote',
    icon: Megaphone,
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30',
  },
  {
    type: 'agency',
    label: 'Agency / Manager',
    description: 'Manage multiple creators or clients',
    icon: Users,
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
  },
  {
    type: 'event_planner',
    label: 'Event Host / Speaker',
    description: 'Virtual, hybrid, or physical events',
    icon: Calendar,
    gradient: 'from-indigo-500 to-purple-500',
    bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30',
  },
  {
    type: 'studio_team',
    label: 'Studio / Production',
    description: 'Collaborate on productions',
    icon: Video,
    gradient: 'from-rose-500 to-pink-500',
    bgGradient: 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30',
  },
  {
    type: 'brand',
    label: 'Explorer',
    description: 'Discover what Seeksy can do',
    icon: Building,
    gradient: 'from-slate-500 to-gray-500',
    bgGradient: 'from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30',
  },
];

interface RoleSelectionStepProps {
  onSelect: (type: AccountType) => void;
}

export function RoleSelectionStep({ onSelect }: RoleSelectionStepProps) {
  return (
    <div className="space-y-8">
      {/* Gradient header background */}
      <div className="relative">
        <div className="absolute inset-0 -mx-8 -mt-8 h-32 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-t-3xl" />
        <div className="relative text-center space-y-3 pt-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Welcome to Seeksy</h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
            What brings you here today?
          </p>
        </div>
      </div>

      {/* 4x2 Grid - larger, premium tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        {roleOptions.map((option, index) => {
          const Icon = option.icon;
          return (
            <motion.div
              key={option.type}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={cn(
                  "p-5 sm:p-6 cursor-pointer transition-all duration-200 h-[180px] sm:h-[200px]",
                  "border-2 border-transparent hover:border-primary/50",
                  "shadow-sm hover:shadow-xl rounded-2xl",
                  `bg-gradient-to-br ${option.bgGradient}`
                )}
                onClick={() => onSelect(option.type)}
              >
                <div className="flex flex-col items-center text-center gap-4 h-full justify-center">
                  <div className={cn(
                    "p-4 rounded-2xl bg-gradient-to-br text-white shadow-lg",
                    option.gradient
                  )}>
                    <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-sm sm:text-base">{option.label}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
