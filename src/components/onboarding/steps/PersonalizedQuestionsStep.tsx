import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { type AccountType } from '@/hooks/useAccountType';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PersonalizedQuestionsStepProps {
  accountType: AccountType;
  onComplete: (data: Record<string, any>) => void;
  onBack: () => void;
}

const accountTypeLabels: Record<AccountType, string> = {
  creator: 'Content Creator',
  podcaster: 'Podcaster',
  advertiser: 'Brand / Advertiser',
  agency: 'Agency / Manager',
  event_planner: 'Event Host / Speaker',
  brand: 'Explorer',
  studio_team: 'Studio / Production',
  admin: 'Administrator',
  influencer: 'Influencer',
};

export function PersonalizedQuestionsStep({ 
  accountType, 
  onComplete, 
  onBack 
}: PersonalizedQuestionsStepProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleSubmit = () => {
    onComplete(formData);
  };

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const CheckboxGroup = ({ 
    label, 
    options, 
    fieldKey 
  }: { 
    label: string; 
    options: string[]; 
    fieldKey: string;
  }) => (
    <div className="space-y-3">
      <Label className="text-base font-medium">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <motion.div 
            key={option} 
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
              (formData[fieldKey] || []).includes(option)
                ? "bg-primary/10 border-primary/50"
                : "bg-muted/30 border-border hover:border-primary/30"
            )}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => {
              const current = formData[fieldKey] || [];
              if (current.includes(option)) {
                updateField(fieldKey, current.filter((p: string) => p !== option));
              } else {
                updateField(fieldKey, [...current, option]);
              }
            }}
          >
            <Checkbox
              checked={(formData[fieldKey] || []).includes(option)}
              className="pointer-events-none"
            />
            <label className="text-sm cursor-pointer">{option}</label>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderQuestions = () => {
    switch (accountType) {
      case 'creator':
      case 'podcaster':
        return (
          <div className="space-y-5">
            <div>
              <Label className="text-base font-medium">Do you have an existing podcast?</Label>
              <Select onValueChange={(v) => updateField('hasPodcast', v)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes, I have a podcast</SelectItem>
                  <SelectItem value="no">No, I'm starting fresh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.hasPodcast === 'yes' && (
              <div>
                <Label className="text-base font-medium">RSS Feed URL (optional)</Label>
                <Input
                  className="mt-2"
                  placeholder="https://feeds.example.com/podcast.rss"
                  onChange={(e) => updateField('rssFeedUrl', e.target.value)}
                />
              </div>
            )}

            <CheckboxGroup
              label="Where do you publish content?"
              options={['YouTube', 'Spotify', 'Apple Podcasts', 'TikTok', 'Instagram', 'Twitter/X']}
              fieldKey="platforms"
            />
          </div>
        );

      case 'influencer':
        return (
          <div className="space-y-5">
            <CheckboxGroup
              label="What's your main platform?"
              options={['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn', 'Twitch']}
              fieldKey="platforms"
            />

            <div>
              <Label className="text-base font-medium">Follower range</Label>
              <Select onValueChange={(v) => updateField('followerRange', v)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select range..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<10k">Under 10K</SelectItem>
                  <SelectItem value="10k-100k">10K - 100K</SelectItem>
                  <SelectItem value="100k-1m">100K - 1M</SelectItem>
                  <SelectItem value="1m+">1M+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CheckboxGroup
              label="What are your goals?"
              options={['Brand Deals', 'Grow Audience', 'Monetize Content', 'AI Clips', 'Build Community', 'Events']}
              fieldKey="goals"
            />
          </div>
        );

      case 'advertiser':
      case 'brand':
        return (
          <div className="space-y-5">
            <div>
              <Label className="text-base font-medium">Company Name</Label>
              <Input
                className="mt-2"
                placeholder="Your company name"
                onChange={(e) => updateField('companyName', e.target.value)}
              />
            </div>

            <CheckboxGroup
              label="Advertising Goals"
              options={['Brand Awareness', 'Lead Generation', 'Podcast Ads', 'Creator Sponsorships', 'Event Promotion']}
              fieldKey="goals"
            />

            <div>
              <Label className="text-base font-medium">Budget Range (optional)</Label>
              <Select onValueChange={(v) => updateField('budgetRange', v)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select budget range..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<1k">Less than $1,000/month</SelectItem>
                  <SelectItem value="1k-5k">$1,000 - $5,000/month</SelectItem>
                  <SelectItem value="5k-25k">$5,000 - $25,000/month</SelectItem>
                  <SelectItem value="25k+">$25,000+/month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'agency':
        return (
          <div className="space-y-5">
            <div>
              <Label className="text-base font-medium">Agency Name</Label>
              <Input
                className="mt-2"
                placeholder="Your agency name"
                onChange={(e) => updateField('agencyName', e.target.value)}
              />
            </div>

            <div>
              <Label className="text-base font-medium">How many creators do you manage?</Label>
              <Select onValueChange={(v) => updateField('creatorCount', v)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-5">1-5 creators</SelectItem>
                  <SelectItem value="6-20">6-20 creators</SelectItem>
                  <SelectItem value="21-50">21-50 creators</SelectItem>
                  <SelectItem value="51+">51+ creators</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-medium">Team Members' Emails (optional)</Label>
              <Textarea
                className="mt-2"
                placeholder="john@example.com&#10;jane@example.com"
                rows={3}
                onChange={(e) => updateField('teamEmails', e.target.value)}
              />
            </div>
          </div>
        );

      case 'event_planner':
        return (
          <div className="space-y-5">
            <CheckboxGroup
              label="Event Type"
              options={['Virtual', 'Hybrid', 'In-Person']}
              fieldKey="eventTypes"
            />

            <div>
              <Label className="text-base font-medium">Expected Attendee Size</Label>
              <Select onValueChange={(v) => updateField('attendeeSize', v)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select size..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<50">Less than 50</SelectItem>
                  <SelectItem value="50-200">50-200</SelectItem>
                  <SelectItem value="200-1000">200-1,000</SelectItem>
                  <SelectItem value="1000+">1,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'studio_team':
        return (
          <div className="space-y-5">
            <div>
              <Label className="text-base font-medium">Team/Studio Name</Label>
              <Input
                className="mt-2"
                placeholder="Your studio name"
                onChange={(e) => updateField('studioName', e.target.value)}
              />
            </div>

            <CheckboxGroup
              label="What do you produce?"
              options={['Podcasts', 'Videos', 'Live Streams', 'Social Content', 'Ads', 'Events']}
              fieldKey="productions"
            />
          </div>
        );

      default:
        return (
          <div className="text-center py-6">
            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground">
              Great choice! Click Continue to see your personalized workspace.
            </p>
          </div>
        );
    }
  };

  return (
    <Card className="p-6 shadow-xl border-border/50 bg-gradient-to-br from-card to-muted/20">
      <div className="space-y-5">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3"
          >
            {accountTypeLabels[accountType]}
          </motion.div>
          <h2 className="text-2xl font-bold">Tell us more</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Help us personalize your experience
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {renderQuestions()}
        </motion.div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleSubmit} className="bg-gradient-to-r from-primary to-primary/80">
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
