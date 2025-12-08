import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { DollarSign, RefreshCw, Save, Radio, Video, Mail, Monitor, Handshake, Info } from 'lucide-react';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';

interface Props {
  onSave?: () => void;
}

interface ChannelConfig {
  name: string;
  icon: typeof Radio;
  color: string;
  impressions: number;
  impressionsMin: number;
  impressionsMax: number;
  impressionsStep: number;
  impressionsUnit: string;
  cpm: number;
  cpmMin: number;
  cpmMax: number;
  fillRate: number;
  fillRateDefault: number;
}

export function AdRevenueCalculator({ onSave }: Props) {
  const { getEffectiveValue, saveMultipleAssumptions, isSaving } = useCFOAssumptions();

  // Audio Host-Read
  const [audioHostReadImpressions, setAudioHostReadImpressions] = useState(1600000);
  const [audioHostReadCPM, setAudioHostReadCPM] = useState(22);
  const [audioHostReadFillRate, setAudioHostReadFillRate] = useState(65);

  // Audio Programmatic
  const [audioProgrammaticImpressions, setAudioProgrammaticImpressions] = useState(1600000);
  const [audioProgrammaticCPM, setAudioProgrammaticCPM] = useState(11.5);
  const [audioProgrammaticFillRate, setAudioProgrammaticFillRate] = useState(65);

  // Video
  const [videoImpressions, setVideoImpressions] = useState(2800000);
  const [videoCPM, setVideoCPM] = useState(19.25);
  const [videoFillRate, setVideoFillRate] = useState(55);

  // Newsletter
  const [newsletterImpressions, setNewsletterImpressions] = useState(100000);
  const [newsletterCPM, setNewsletterCPM] = useState(35);
  const [newsletterFillRate, setNewsletterFillRate] = useState(80);

  // Display
  const [displayImpressions, setDisplayImpressions] = useState(200000);
  const [displayCPM, setDisplayCPM] = useState(5);
  const [displayFillRate, setDisplayFillRate] = useState(70);

  // Brand Deals (count instead of impressions)
  const [brandDeals, setBrandDeals] = useState(50);
  const [brandDealValue, setBrandDealValue] = useState(5000);

  // Revenue shares
  const [creatorShare, setCreatorShare] = useState(75);
  const platformShare = 100 - creatorShare;

  // Calculations
  const calculateChannelRevenue = (impressions: number, cpm: number, fillRate: number) => {
    return (impressions * (fillRate / 100) * cpm) / 1000;
  };

  const audioHostReadRevenue = calculateChannelRevenue(audioHostReadImpressions, audioHostReadCPM, audioHostReadFillRate);
  const audioProgrammaticRevenue = calculateChannelRevenue(audioProgrammaticImpressions, audioProgrammaticCPM, audioProgrammaticFillRate);
  const videoRevenue = calculateChannelRevenue(videoImpressions, videoCPM, videoFillRate);
  const newsletterRevenue = calculateChannelRevenue(newsletterImpressions, newsletterCPM, newsletterFillRate);
  const displayRevenue = calculateChannelRevenue(displayImpressions, displayCPM, displayFillRate);
  const brandDealsRevenue = brandDeals * brandDealValue;

  const totalGrossRevenue = audioHostReadRevenue + audioProgrammaticRevenue + videoRevenue + newsletterRevenue + displayRevenue + brandDealsRevenue;
  const platformRevenue = totalGrossRevenue * (platformShare / 100);
  const creatorPayout = totalGrossRevenue * (creatorShare / 100);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatImpressions = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const handleReset = () => {
    setAudioHostReadImpressions(1600000);
    setAudioHostReadCPM(22);
    setAudioHostReadFillRate(65);
    setAudioProgrammaticImpressions(1600000);
    setAudioProgrammaticCPM(11.5);
    setAudioProgrammaticFillRate(65);
    setVideoImpressions(2800000);
    setVideoCPM(19.25);
    setVideoFillRate(55);
    setNewsletterImpressions(100000);
    setNewsletterCPM(35);
    setNewsletterFillRate(80);
    setDisplayImpressions(200000);
    setDisplayCPM(5);
    setDisplayFillRate(70);
    setBrandDeals(50);
    setBrandDealValue(5000);
    setCreatorShare(75);
  };

  const handleSave = () => {
    saveMultipleAssumptions([
      { metric_key: 'audio_hostread_impressions', value: audioHostReadImpressions, unit: 'count', category: 'ads' },
      { metric_key: 'audio_hostread_preroll_cpm', value: audioHostReadCPM, unit: 'usd', category: 'ads' },
      { metric_key: 'audio_hostread_fill_rate', value: audioHostReadFillRate, unit: 'percent', category: 'ads' },
      { metric_key: 'audio_programmatic_impressions', value: audioProgrammaticImpressions, unit: 'count', category: 'ads' },
      { metric_key: 'audio_programmatic_cpm', value: audioProgrammaticCPM, unit: 'usd', category: 'ads' },
      { metric_key: 'audio_programmatic_fill_rate', value: audioProgrammaticFillRate, unit: 'percent', category: 'ads' },
      { metric_key: 'video_impressions', value: videoImpressions, unit: 'count', category: 'ads' },
      { metric_key: 'video_preroll_cpm', value: videoCPM, unit: 'usd', category: 'ads' },
      { metric_key: 'video_fill_rate', value: videoFillRate, unit: 'percent', category: 'ads' },
      { metric_key: 'newsletter_impressions', value: newsletterImpressions, unit: 'count', category: 'ads' },
      { metric_key: 'newsletter_cpm', value: newsletterCPM, unit: 'usd', category: 'ads' },
      { metric_key: 'newsletter_fill_rate', value: newsletterFillRate, unit: 'percent', category: 'ads' },
      { metric_key: 'display_impressions', value: displayImpressions, unit: 'count', category: 'ads' },
      { metric_key: 'display_cpm', value: displayCPM, unit: 'usd', category: 'ads' },
      { metric_key: 'display_fill_rate', value: displayFillRate, unit: 'percent', category: 'ads' },
      { metric_key: 'brand_deals_count', value: brandDeals, unit: 'count', category: 'ads' },
      { metric_key: 'brand_deal_avg_value', value: brandDealValue, unit: 'usd', category: 'ads' },
      { metric_key: 'creator_ad_share', value: creatorShare, unit: 'percent', category: 'ads' },
      { metric_key: 'platform_ad_share', value: platformShare, unit: 'percent', category: 'ads' },
    ]);
    onSave?.();
  };

  const channels = [
    { 
      name: 'Audio Host-Read', 
      icon: Radio, 
      color: 'blue',
      impressions: audioHostReadImpressions,
      setImpressions: setAudioHostReadImpressions,
      cpm: audioHostReadCPM,
      setCpm: setAudioHostReadCPM,
      cpmMin: 15,
      cpmMax: 40,
      fillRate: audioHostReadFillRate,
      setFillRate: setAudioHostReadFillRate,
      revenue: audioHostReadRevenue,
    },
    { 
      name: 'Audio Programmatic', 
      icon: Radio, 
      color: 'indigo',
      impressions: audioProgrammaticImpressions,
      setImpressions: setAudioProgrammaticImpressions,
      cpm: audioProgrammaticCPM,
      setCpm: setAudioProgrammaticCPM,
      cpmMin: 5,
      cpmMax: 20,
      fillRate: audioProgrammaticFillRate,
      setFillRate: setAudioProgrammaticFillRate,
      revenue: audioProgrammaticRevenue,
    },
    { 
      name: 'Video (Pre/Mid-Roll)', 
      icon: Video, 
      color: 'purple',
      impressions: videoImpressions,
      setImpressions: setVideoImpressions,
      cpm: videoCPM,
      setCpm: setVideoCPM,
      cpmMin: 10,
      cpmMax: 40,
      fillRate: videoFillRate,
      setFillRate: setVideoFillRate,
      revenue: videoRevenue,
    },
    { 
      name: 'Newsletter/Email', 
      icon: Mail, 
      color: 'amber',
      impressions: newsletterImpressions,
      setImpressions: setNewsletterImpressions,
      cpm: newsletterCPM,
      setCpm: setNewsletterCPM,
      cpmMin: 20,
      cpmMax: 60,
      fillRate: newsletterFillRate,
      setFillRate: setNewsletterFillRate,
      revenue: newsletterRevenue,
    },
    { 
      name: 'Display', 
      icon: Monitor, 
      color: 'slate',
      impressions: displayImpressions,
      setImpressions: setDisplayImpressions,
      cpm: displayCPM,
      setCpm: setDisplayCPM,
      cpmMin: 2,
      cpmMax: 15,
      fillRate: displayFillRate,
      setFillRate: setDisplayFillRate,
      revenue: displayRevenue,
    },
  ];

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="border-b border-border py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-500" />
              Ad Revenue Calculator
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Adjust these sliders to update CFO assumptions. Click 'Save to Pro Forma' to apply them to all board forecasts.
            </p>
          </div>
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            Multi-Channel
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Channel Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {channels.map((channel, idx) => {
            const Icon = channel.icon;
            return (
              <motion.div
                key={channel.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 bg-muted rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{channel.name}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{formatCurrency(channel.revenue)}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Impressions</span>
                    <span>{formatImpressions(channel.impressions)}</span>
                  </div>
                  <Slider
                    value={[channel.impressions]}
                    onValueChange={([v]) => channel.setImpressions(v)}
                    min={10000}
                    max={10000000}
                    step={10000}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">CPM</span>
                      <span>${channel.cpm}</span>
                    </div>
                    <Slider
                      value={[channel.cpm]}
                      onValueChange={([v]) => channel.setCpm(v)}
                      min={channel.cpmMin}
                      max={channel.cpmMax}
                      step={0.5}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Fill Rate</span>
                      <span>{channel.fillRate}%</span>
                    </div>
                    <Slider
                      value={[channel.fillRate]}
                      onValueChange={([v]) => channel.setFillRate(v)}
                      min={30}
                      max={95}
                      step={5}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Brand Deals - Special Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Handshake className="w-4 h-4 text-amber-600" />
                <span className="font-medium text-sm">Brand Deals</span>
              </div>
              <span className="text-sm font-bold text-amber-800">{formatCurrency(brandDealsRevenue)}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-700"># Deals/Year</span>
                <span>{brandDeals}</span>
              </div>
              <Slider
                value={[brandDeals]}
                onValueChange={([v]) => setBrandDeals(v)}
                min={10}
                max={200}
                step={5}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-700">Avg Deal Value</span>
                <span>${brandDealValue.toLocaleString()}</span>
              </div>
              <Slider
                value={[brandDealValue]}
                onValueChange={([v]) => setBrandDealValue(v)}
                min={250}
                max={50000}
                step={250}
              />
            </div>
          </motion.div>
        </div>

        {/* Revenue Share */}
        <div className="p-4 bg-muted rounded-lg mb-4">
          <Label className="flex items-center justify-between mb-2">
            <span>Creator Revenue Share</span>
            <span className="font-medium">{creatorShare}% Creator / {platformShare}% Platform</span>
          </Label>
          <Slider
            value={[creatorShare]}
            onValueChange={([v]) => setCreatorShare(v)}
            min={60}
            max={90}
            step={5}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Platform vs creator share drives gross margin in the Pro Forma.
          </p>
        </div>

        {/* Helper Text */}
        <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg mb-4">
          <Info className="w-4 h-4 text-purple-600 mt-0.5" />
          <p className="text-sm text-purple-800">
            Channel CPM and fill rates are seeded from industry benchmarks. Use overrides to reflect Seeksy's deal structure.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-slate-100 to-slate-50 border-0">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Gross Ad Revenue</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalGrossRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-100 to-purple-50 border-0">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-purple-600">Platform Share</p>
              <p className="text-2xl font-bold text-purple-700">{formatCurrency(platformRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-100 to-emerald-50 border-0">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-emerald-600">Creator Payout</p>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(creatorPayout)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
            <Save className="w-4 h-4 mr-2" />
            Save to Pro Forma
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
