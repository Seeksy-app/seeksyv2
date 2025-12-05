import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Check, X, Calendar, ExternalLink, Settings2 } from 'lucide-react';

export function GoogleCalendarSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [googleOverride, setGoogleOverride] = useState(true);

  // Check for existing Google Calendar connection
  const { data: calendarConnection, isLoading, refetch } = useQuery({
    queryKey: ['google-calendar-connection'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .maybeSingle();

      if (error) {
        console.error('Error fetching calendar connection:', error);
        return null;
      }
      
      if (data) {
        setGoogleOverride(data.google_override_seeksy ?? true);
      }
      
      return data;
    }
  });

  // Connect Google Calendar
  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('google-calendar-auth', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw response.error;
      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to connect Google Calendar',
        variant: 'destructive'
      });
    }
  });

  // Update Google override setting
  const updateOverrideMutation = useMutation({
    mutationFn: async (override: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('calendar_connections')
        .update({ google_override_seeksy: override })
        .eq('user_id', user.id)
        .eq('provider', 'google');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connection'] });
      toast({ title: 'Settings updated' });
    }
  });

  // Sync calendar
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Update last_sync_at
      await supabase
        .from('calendar_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', session.user.id)
        .eq('provider', 'google');

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connection'] });
      toast({ title: 'Calendar synced', description: 'Busy times have been refreshed.' });
    }
  });

  // Disconnect Google Calendar
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('calendar_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'google');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connection'] });
      toast({ title: 'Disconnected', description: 'Google Calendar has been disconnected.' });
    }
  });

  const isConnected = !!calendarConnection;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <img src="/integrations/google-calendar.svg" alt="" className="w-5 h-5" />
              Google Calendar
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Sync busy times to prevent double-booking
            </CardDescription>
          </div>
          {isConnected && (
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              <Check className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : isConnected ? (
          <>
            {/* Connected state */}
            <div className="text-sm text-muted-foreground">
              Connected as <span className="font-medium">{calendarConnection?.calendar_email || 'Google Account'}</span>
            </div>

            {/* Override toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-sm">Google Overrides Seeksy</p>
                <p className="text-xs text-muted-foreground">Google busy times block Seeksy slots</p>
              </div>
              <Switch 
                checked={googleOverride}
                onCheckedChange={(v) => {
                  setGoogleOverride(v);
                  updateOverrideMutation.mutate(v);
                }}
              />
            </div>

            {/* Last sync info */}
            {calendarConnection?.last_sync_at && (
              <p className="text-xs text-muted-foreground">
                Last synced: {new Date(calendarConnection.last_sync_at).toLocaleString()}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Sync Now
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Not connected state */}
            <p className="text-sm text-muted-foreground">
              Connect your Google Calendar to automatically block times when you're busy.
            </p>
            <Button 
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending}
              className="w-full"
            >
              {connectMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4 mr-2" />
              )}
              Connect Google Calendar
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
