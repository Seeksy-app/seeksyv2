import { Card } from '@/components/ui/card';
import { Mic, Megaphone, Users, Calendar, Building, Sparkles, Code, Shield } from 'lucide-react';
import { type AccountType } from '@/hooks/useAccountType';

interface RoleOption {
  type: AccountType;
  label: string;
  description: string;
  icon: any;
  gradient: string;
}

const roleOptions: RoleOption[] = [
  {
    type: 'creator',
    label: 'I create content',
    description: 'Video, audio, social media, and more',
    icon: Sparkles,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    type: 'podcaster',
    label: 'I run a podcast',
    description: 'Host, produce, and distribute podcasts',
    icon: Mic,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    type: 'advertiser',
    label: 'I represent brands or run ads',
    description: 'Advertise, sponsor, and promote',
    icon: Megaphone,
    gradient: 'from-orange-500 to-red-500',
  },
  {
    type: 'agency',
    label: 'I manage multiple creators',
    description: 'Agency, management, or talent representation',
    icon: Users,
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    type: 'event_planner',
    label: 'I run events or bookings',
    description: 'Virtual, hybrid, or physical events',
    icon: Calendar,
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    type: 'brand',
    label: 'I want to explore Seeksy tools',
    description: 'Discover features and capabilities',
    icon: Building,
    gradient: 'from-slate-500 to-gray-500',
  },
];

interface RoleSelectionStepProps {
  onSelect: (type: AccountType) => void;
}

export function RoleSelectionStep({ onSelect }: RoleSelectionStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Welcome to Seeksy</h1>
        <p className="text-xl text-muted-foreground">
          Let's personalize your experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roleOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Card
              key={option.type}
              className="p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-primary group"
              onClick={() => onSelect(option.type)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${option.gradient} text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{option.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
