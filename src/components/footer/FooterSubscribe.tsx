import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trackSubscriptionStarted, trackSubscriptionCompleted, trackSubscriptionError } from '@/lib/analytics';

export function FooterSubscribe() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    trackSubscriptionStarted();
    setIsLoading(true);

    try {
      // Get lists that are included in general subscribe
      const { data: lists } = await supabase
        .from('subscriber_lists')
        .select('id, slug')
        .eq('include_in_general_subscribe', true as any);

      // Upsert subscriber
      const { data: subscriber, error: subError } = await supabase
        .from('newsletter_subscribers')
        .upsert({ email: email.trim(), status: 'active' } as any, { onConflict: 'email' })
        .select()
        .single();

      if (subError) throw subError;

      // Add to all general subscribe lists
      if (lists?.length && subscriber) {
        const memberships = lists.map(list => ({
          subscriber_id: subscriber.id,
          list_id: list.id,
        }));
        await supabase
          .from('subscriber_list_members')
          .upsert(memberships as any, { onConflict: 'subscriber_id,list_id' });
      }

      trackSubscriptionCompleted({ source: 'footer' });
      setIsSuccess(true);
      setEmail('');
      toast.success("You're subscribed! Check your email for preferences.");
    } catch (error) {
      trackSubscriptionError({ error_type: 'api_error' });
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex items-center gap-2 text-green-500">
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm">Subscribed! Check your inbox.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubscribe} className="flex gap-2 w-full max-w-md">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="pl-10"
          required
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe'}
      </Button>
    </form>
  );
}
