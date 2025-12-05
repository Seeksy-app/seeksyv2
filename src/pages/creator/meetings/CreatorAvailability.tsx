import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Clock, Calendar, Save } from 'lucide-react';

const weekDays = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
];

const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute} ${period}`;
});

interface DayAvailability {
  enabled: boolean;
  start: string;
  end: string;
}

const defaultAvailability: Record<string, DayAvailability> = {
  monday: { enabled: true, start: '9:00 AM', end: '5:00 PM' },
  tuesday: { enabled: true, start: '9:00 AM', end: '5:00 PM' },
  wednesday: { enabled: true, start: '9:00 AM', end: '5:00 PM' },
  thursday: { enabled: true, start: '9:00 AM', end: '5:00 PM' },
  friday: { enabled: true, start: '9:00 AM', end: '5:00 PM' },
  saturday: { enabled: false, start: '9:00 AM', end: '5:00 PM' },
  sunday: { enabled: false, start: '9:00 AM', end: '5:00 PM' },
};

export default function CreatorAvailability() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [availability, setAvailability] = useState<Record<string, DayAvailability>>(defaultAvailability);
  const [allowSameDay, setAllowSameDay] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['creator-availability-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Load from localStorage for now
      const savedSettings = localStorage.getItem(`availability_${user.id}`);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.weekly) setAvailability(settings.weekly);
        if (settings.allowSameDay !== undefined) setAllowSameDay(settings.allowSameDay);
      }

      return { id: user.id };
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save to localStorage for now
      localStorage.setItem(`availability_${user.id}`, JSON.stringify({
        weekly: availability,
        allowSameDay
      }));
    },
    onSuccess: () => {
      setHasChanges(false);
      toast({ title: 'Availability saved!' });
    },
    onError: (err: any) => {
      toast({ title: 'Error saving', description: err.message, variant: 'destructive' });
    }
  });

  const updateDay = (day: string, field: keyof DayAvailability, value: any) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
    setHasChanges(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Availability</h1>
          <p className="text-muted-foreground mt-1">Set your weekly availability for bookings</p>
        </div>
        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={!hasChanges || saveMutation.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weekDays.map(day => (
              <div key={day.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <Switch 
                  checked={availability[day.id]?.enabled ?? false}
                  onCheckedChange={v => updateDay(day.id, 'enabled', v)}
                />
                <span className="w-24 font-medium">{day.label}</span>
                <div className="flex items-center gap-2 flex-1">
                  <Select 
                    value={availability[day.id]?.start || '9:00 AM'}
                    onValueChange={v => updateDay(day.id, 'start', v)}
                    disabled={!availability[day.id]?.enabled}
                  >
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">to</span>
                  <Select 
                    value={availability[day.id]?.end || '5:00 PM'}
                    onValueChange={v => updateDay(day.id, 'end', v)}
                    disabled={!availability[day.id]?.enabled}
                  >
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Booking Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Allow Same-Day Bookings</p>
                <p className="text-sm text-muted-foreground">Let guests book meetings for today</p>
              </div>
              <Switch 
                checked={allowSameDay}
                onCheckedChange={v => { setAllowSameDay(v); setHasChanges(true); }}
              />
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> You can set buffer times on individual meeting types to ensure you have breaks between meetings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
