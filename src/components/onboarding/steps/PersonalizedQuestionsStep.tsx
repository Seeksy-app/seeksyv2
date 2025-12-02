import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { type AccountType } from '@/hooks/useAccountType';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface PersonalizedQuestionsStepProps {
  accountType: AccountType;
  onComplete: (data: Record<string, any>) => void;
  onBack: () => void;
}

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

  const renderQuestions = () => {
    switch (accountType) {
      case 'creator':
      case 'podcaster':
        return (
          <div className="space-y-6">
            <div>
              <Label>Do you have an existing podcast?</Label>
              <Select onValueChange={(v) => updateField('hasPodcast', v)}>
                <SelectTrigger>
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
                <Label>RSS Feed URL (optional)</Label>
                <Input
                  placeholder="https://feeds.example.com/podcast.rss"
                  onChange={(e) => updateField('rssFeedUrl', e.target.value)}
                />
              </div>
            )}

            <div>
              <Label>What platforms do you publish on?</Label>
              <div className="space-y-2 mt-2">
                {['YouTube', 'Spotify', 'Apple Podcasts', 'TikTok', 'Instagram', 'Twitter/X'].map((platform) => (
                  <div key={platform} className="flex items-center gap-2">
                    <Checkbox
                      onCheckedChange={(checked) => {
                        const platforms = formData.platforms || [];
                        if (checked) {
                          updateField('platforms', [...platforms, platform]);
                        } else {
                          updateField('platforms', platforms.filter((p: string) => p !== platform));
                        }
                      }}
                    />
                    <label className="text-sm">{platform}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Social Links (optional)</Label>
              <Input
                placeholder="@yourhandle or URL"
                onChange={(e) => updateField('socialLinks', e.target.value)}
              />
            </div>
          </div>
        );

      case 'advertiser':
      case 'brand':
        return (
          <div className="space-y-6">
            <div>
              <Label>Company Name</Label>
              <Input
                placeholder="Your company name"
                onChange={(e) => updateField('companyName', e.target.value)}
              />
            </div>

            <div>
              <Label>Advertising Goals</Label>
              <div className="space-y-2 mt-2">
                {['Brand Awareness', 'Lead Generation', 'Podcast Ads', 'Creator Sponsorships', 'Event Promotion'].map((goal) => (
                  <div key={goal} className="flex items-center gap-2">
                    <Checkbox
                      onCheckedChange={(checked) => {
                        const goals = formData.goals || [];
                        if (checked) {
                          updateField('goals', [...goals, goal]);
                        } else {
                          updateField('goals', goals.filter((g: string) => g !== goal));
                        }
                      }}
                    />
                    <label className="text-sm">{goal}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Budget Range (optional)</Label>
              <Select onValueChange={(v) => updateField('budgetRange', v)}>
                <SelectTrigger>
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

            <div>
              <Label>Industry/Vertical</Label>
              <Input
                placeholder="e.g., Technology, Healthcare, Fashion"
                onChange={(e) => updateField('industry', e.target.value)}
              />
            </div>
          </div>
        );

      case 'agency':
        return (
          <div className="space-y-6">
            <div>
              <Label>Agency Name</Label>
              <Input
                placeholder="Your agency name"
                onChange={(e) => updateField('agencyName', e.target.value)}
              />
            </div>

            <div>
              <Label>How many creators do you manage?</Label>
              <Select onValueChange={(v) => updateField('creatorCount', v)}>
                <SelectTrigger>
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
              <Label>Team Members' Emails (optional, one per line)</Label>
              <Textarea
                placeholder="john@example.com&#10;jane@example.com"
                rows={4}
                onChange={(e) => updateField('teamEmails', e.target.value)}
              />
            </div>
          </div>
        );

      case 'event_planner':
        return (
          <div className="space-y-6">
            <div>
              <Label>Event Type</Label>
              <div className="space-y-2 mt-2">
                {['Virtual', 'Hybrid', 'Physical/In-Person'].map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <Checkbox
                      onCheckedChange={(checked) => {
                        const types = formData.eventTypes || [];
                        if (checked) {
                          updateField('eventTypes', [...types, type]);
                        } else {
                          updateField('eventTypes', types.filter((t: string) => t !== type));
                        }
                      }}
                    />
                    <label className="text-sm">{type}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Expected Attendee Size</Label>
              <Select onValueChange={(v) => updateField('attendeeSize', v)}>
                <SelectTrigger>
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

            <div>
              <Label>Event Calendar Link (optional)</Label>
              <Input
                placeholder="https://calendly.com/yourlink"
                onChange={(e) => updateField('calendarLink', e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-muted-foreground">
            <p>No additional setup required. Click Continue to proceed.</p>
          </div>
        );
    }
  };

  return (
    <Card className="p-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Tell us more</h2>
          <p className="text-muted-foreground">
            Help us personalize your Seeksy experience
          </p>
        </div>

        {renderQuestions()}

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleSubmit}>
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
