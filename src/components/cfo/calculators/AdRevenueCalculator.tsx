import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { DollarSign, RefreshCw, Save, Radio, Video, Mail, Monitor } from 'lucide-react';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';

interface Props {
  onSave?: () => void;
}

export function AdRevenueCalculator({ onSave }: Props) {
  const { getEffectiveValue, saveMultipleAssumptions, isSaving } = useCFOAssumptions();

  // Impressions (in thousands)
  const [audioImpressions, setAudioImpressions] = useState(500);
  const [videoImpressions, setVideoImpressions] = useState(200);
  const [newsletterImpressions, setNewsletterImpressions] = useState(100);
  const [displayImpressions, setDisplayImpressions] = useState(300);

  // CPMs
  const [audioCPM, setAudioCPM] = useState(() => getEffectiveValue('audio_hostread_preroll_cpm_low', 18));
  const [videoCPM, setVideoCPM] = useState(() => getEffectiveValue('video_preroll_cpm_low', 10));
  const [newsletterCPM, setNewsletterCPM] = useState(() => getEffectiveValue('newsletter_cpm_avg', 35));
  const [displayCPM, setDisplayCPM] = useState(() => getEffectiveValue('display_cpm_avg', 5));

  // Fill rates
  const [audioFillRate, setAudioFillRate] = useState(() => getEffectiveValue('audio_fill_rate', 65));
  const [videoFillRate, setVideoFillRate] = useState(() => getEffectiveValue('video_fill_rate', 55));
  const [newsletterFillRate, setNewsletterFillRate] = useState(80);
  const [displayFillRate, setDisplayFillRate] = useState(70);

  // Revenue shares
  const [platformShare, setPlatformShare] = useState(30);

  // Calculations
  const calculateChannelRevenue = (impressionsK: number, cpm: number, fillRate: number) => {
    return (impressionsK * 1000 * (fillRate / 100) * cpm) / 1000;
  };

  const audioRevenue = calculateChannelRevenue(audioImpressions, audioCPM, audioFillRate);
  const videoRevenue = calculateChannelRevenue(videoImpressions, videoCPM, videoFillRate);
  const newsletterRevenue = calculateChannelRevenue(newsletterImpressions, newsletterCPM, newsletterFillRate);
  const displayRevenue = calculateChannelRevenue(displayImpressions, displayCPM, displayFillRate);

  const totalGrossRevenue = audioRevenue + videoRevenue + newsletterRevenue + displayRevenue;
  const platformRevenue = totalGrossRevenue * (platformShare / 100);
  const creatorPayout = totalGrossRevenue - platformRevenue;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const handleReset = () => {
    setAudioImpressions(500);
    setVideoImpressions(200);
    setNewsletterImpressions(100);
    setDisplayImpressions(300);
    setAudioCPM(18);
    setVideoCPM(10);
    setNewsletterCPM(35);
    setDisplayCPM(5);
    setAudioFillRate(65);
    setVideoFillRate(55);
    setNewsletterFillRate(80);
    setDisplayFillRate(70);
    setPlatformShare(30);
  };

  const handleSave = () => {
    saveMultipleAssumptions([
      { metric_key: 'audio_hostread_preroll_cpm_low', value: audioCPM, unit: 'usd', category: 'ads' },
      { metric_key: 'video_preroll_cpm_low', value: videoCPM, unit: 'usd', category: 'ads' },
      { metric_key: 'newsletter_cpm_avg', value: newsletterCPM, unit: 'usd', category: 'ads' },
      { metric_key: 'display_cpm_avg', value: displayCPM, unit: 'usd', category: 'ads' },
      { metric_key: 'audio_fill_rate', value: audioFillRate, unit: 'percent', category: 'ads' },
      { metric_key: 'video_fill_rate', value: videoFillRate, unit: 'percent', category: 'ads' },
      { metric_key: 'platform_ad_share', value: platformShare, unit: 'percent', category: 'ads' },
    ]);
    onSave?.();
  };

  const channels = [
    { 
      name: 'Audio (Host-Read)', 
      icon: Radio, 
      color: 'blue',
      impressions: audioImpressions,
      setImpressions: setAudioImpressions,
      cpm: audioCPM,
      setCpm: setAudioCPM,
      fillRate: audioFillRate,
      setFillRate: setAudioFillRate,
      revenue: audioRevenue,
    },
    { 
      name: 'Video (Pre/Mid-Roll)', 
      icon: Video, 
      color: 'purple',
      impressions: videoImpressions,
      setImpressions: setVideoImpressions,
      cpm: videoCPM,
      setCpm: setVideoCPM,
      fillRate: videoFillRate,
      setFillRate: setVideoFillRate,
      revenue: videoRevenue,
    },
    { 
      name: 'Newsletter', 
      icon: Mail, 
      color: 'amber',
      impressions: newsletterImpressions,
      setImpressions: setNewsletterImpressions,
      cpm: newsletterCPM,
      setCpm: setNewsletterCPM,
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
      fillRate: displayFillRate,
      setFillRate: setDisplayFillRate,
      revenue: displayRevenue,
    },
  ];

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-500" />
            Ad Revenue Calculator
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            Multi-Channel
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Channel Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {channels.map((channel, idx) => {
            const Icon = channel.icon;
            return (
              <motion.div
                key={channel.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 bg-slate-50 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 text-${channel.color}-500`} />
                    <span className="font-medium text-sm">{channel.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(channel.revenue)}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Impressions (K)</span>
                    <span>{channel.impressions}K</span>
                  </div>
                  <Slider
                    value={[channel.impressions]}
                    onValueChange={([v]) => channel.setImpressions(v)}
                    min={10}
                    max={2000}
                    step={10}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">CPM</span>
                      <span>${channel.cpm}</span>
                    </div>
                    <Slider
                      value={[channel.cpm]}
                      onValueChange={([v]) => channel.setCpm(v)}
                      min={1}
                      max={60}
                      step={1}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Fill Rate</span>
                      <span>{channel.fillRate}%</span>
                    </div>
                    <Slider
                      value={[channel.fillRate]}
                      onValueChange={([v]) => channel.setFillRate(v)}
                      min={10}
                      max={100}
                      step={5}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Platform Share */}
        <div className="p-4 bg-slate-100 rounded-lg mb-4">
          <Label className="flex items-center justify-between mb-2">
            <span>Platform Revenue Share</span>
            <span className="font-medium">{platformShare}%</span>
          </Label>
          <Slider
            value={[platformShare]}
            onValueChange={([v]) => setPlatformShare(v)}
            min={10}
            max={50}
            step={5}
          />
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-slate-100 to-slate-50 border-0">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-slate-500">Gross Ad Revenue</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalGrossRevenue)}</p>
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
