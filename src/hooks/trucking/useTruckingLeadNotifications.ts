import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LeadNotification {
  id: string;
  agency_id: string | null;
  owner_id: string | null;
  source: string;
  conversation_id: string | null;
  caller_number: string | null;
  receiver_number: string | null;
  summary: string | null;
  transcript: string | null;
  call_sid: string | null;
  stream_sid: string | null;
  status: string;
  lead_id: string | null;
  created_at: string;
}

// Play notification sound
const playNotificationSound = () => {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 880; // A5 note
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
    
    // Second beep
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 1047; // C6 note
      osc2.type = 'sine';
      gain2.gain.value = 0.3;
      osc2.start();
      osc2.stop(audioContext.currentTime + 0.2);
    }, 200);
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
};

// Show browser notification
const showBrowserNotification = (notification: LeadNotification) => {
  if (!('Notification' in window)) {
    return;
  }
  
  if (Notification.permission === 'granted') {
    const title = '🚛 New Pending Lead!';
    const body = `${notification.caller_number || 'Unknown Number'}${notification.summary ? `\n${notification.summary.substring(0, 100)}...` : ''}`;
    
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: notification.id, // Prevent duplicate notifications
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
};

// Dispatch custom event for Chrome extension
const dispatchExtensionEvent = (notification: LeadNotification) => {
  try {
    window.dispatchEvent(
      new CustomEvent('seeksy:pending-lead-created', {
        detail: {
          conversation_id: notification.conversation_id,
          caller_number: notification.caller_number,
          summary: notification.summary,
          notification_id: notification.id,
          created_at: notification.created_at,
        },
      })
    );
    console.log('Dispatched seeksy:pending-lead-created event for Chrome extension');
  } catch (error) {
    console.error('Failed to dispatch extension event:', error);
  }
};

export function useTruckingLeadNotifications() {
  const { toast } = useToast();
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<LeadNotification[]>([]);

  // Get user's agency
  useEffect(() => {
    async function fetchAgency() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        const { data } = await supabase
          .from('trucking_admin_users')
          .select('agency_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setAgencyId(data?.agency_id || null);
        
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
    }
    fetchAgency();
  }, []);

  // Handle new notification
  const handleNewNotification = useCallback((notification: LeadNotification) => {
    console.log('New lead notification received:', notification);
    
    // Add to recent notifications
    setRecentNotifications(prev => [notification, ...prev].slice(0, 10));
    
    // Show toast
    toast({
      title: '🚛 New Pending Lead!',
      description: `${notification.caller_number || 'Unknown'}${notification.summary ? ` - ${notification.summary.substring(0, 50)}...` : ''}`,
      variant: 'default',
      duration: 10000, // Show for 10 seconds
    });
    
    // Play sound
    playNotificationSound();
    
    // Show browser notification
    showBrowserNotification(notification);
    
    // Dispatch event for Chrome extension
    dispatchExtensionEvent(notification);
  }, [toast]);

  // Subscribe to realtime
  useEffect(() => {
    if (!agencyId && !userId) return;

    console.log('Setting up realtime subscription for lead notifications');
    console.log('Agency ID:', agencyId, 'User ID:', userId);

    // Build filter based on available IDs
    const filterValue = agencyId || userId;
    const filterColumn = agencyId ? 'agency_id' : 'owner_id';

    const channel = supabase
      .channel('trucking-lead-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trucking_lead_notifications',
          filter: `${filterColumn}=eq.${filterValue}`,
        },
        (payload) => {
          console.log('Realtime INSERT received:', payload);
          const notification = payload.new as LeadNotification;
          handleNewNotification(notification);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [agencyId, userId, handleNewNotification]);

  // Fetch recent notifications on mount
  useEffect(() => {
    if (!agencyId && !userId) return;

    async function fetchRecent() {
      const query = supabase
        .from('trucking_lead_notifications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (agencyId) {
        query.eq('agency_id', agencyId);
      } else if (userId) {
        query.eq('owner_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching recent notifications:', error);
      } else if (data) {
        setRecentNotifications(data as LeadNotification[]);
      }
    }

    fetchRecent();
  }, [agencyId, userId]);

  return {
    isSubscribed,
    recentNotifications,
    agencyId,
  };
}
