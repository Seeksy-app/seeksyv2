import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'creator' | 'advertiser';

interface RoleContextType {
  currentRole: UserRole | null;
  availableRoles: UserRole[];
  isLoading: boolean;
  hasMultipleRoles: boolean;
  switchRole: (role: UserRole) => Promise<void>;
  enableRole: (role: UserRole) => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's profile and available roles
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Determine available roles based on profile
  const availableRoles: UserRole[] = [];
  if (profile?.is_creator) availableRoles.push('creator');
  if (profile?.is_advertiser) availableRoles.push('advertiser');

  const hasMultipleRoles = availableRoles.length > 1;

  // Initialize current role from localStorage or profile preference
  useEffect(() => {
    if (!profile || currentRole) return;

    const storedRole = localStorage.getItem('seeksy_current_role') as UserRole | null;
    
    if (storedRole && availableRoles.includes(storedRole)) {
      setCurrentRole(storedRole);
    } else if (profile.preferred_role && availableRoles.includes(profile.preferred_role as UserRole)) {
      setCurrentRole(profile.preferred_role as UserRole);
    } else if (availableRoles.length === 1) {
      setCurrentRole(availableRoles[0]);
    } else if (availableRoles.length > 1) {
      // User has multiple roles but hasn't chosen yet
      setCurrentRole(null);
    }
  }, [profile, availableRoles, currentRole]);

  // Mutation to enable a role
  const enableRoleMutation = useMutation({
    mutationFn: async (role: UserRole) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates: any = {};
      if (role === 'creator') {
        updates.is_creator = true;
      } else if (role === 'advertiser') {
        updates.is_advertiser = true;
        
        // Create advertiser profile if needed
        const { data: existingAdvertiser } = await supabase
          .from('advertisers')
          .select('id')
          .eq('owner_profile_id', user.id)
          .single();

        if (!existingAdvertiser) {
          const { error: advertiserError } = await supabase
            .from('advertisers')
            .insert({
              owner_profile_id: user.id,
              company_name: profile?.full_name || 'My Company',
              contact_name: profile?.full_name || 'Contact Name',
              contact_email: user.email || '',
              status: 'pending',
            });

          if (advertiserError) throw advertiserError;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast({
        title: 'Role enabled',
        description: 'Your new role has been activated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error enabling role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Function to switch roles
  const switchRole = async (role: UserRole) => {
    if (!availableRoles.includes(role)) {
      toast({
        title: 'Role not available',
        description: 'Please enable this role first.',
        variant: 'destructive',
      });
      return;
    }

    setCurrentRole(role);
    localStorage.setItem('seeksy_current_role', role);

    // Update preferred role in database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ preferred_role: role })
        .eq('id', user.id);
    }

    toast({
      title: 'Role switched',
      description: `Now viewing Seeksy as ${role === 'creator' ? 'Creator' : 'Advertiser'}`,
    });

    // Redirect based on role
    if (role === 'creator') {
      window.location.href = '/dashboard';
    } else if (role === 'advertiser') {
      // Check if advertiser onboarding is complete before redirecting
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('advertiser_onboarding_completed')
          .eq('id', currentUser.id)
          .single();

        const { data: advertiser } = await supabase
          .from('advertisers')
          .select('id')
          .eq('owner_profile_id', currentUser.id)
          .maybeSingle();

        // Redirect to signup if onboarding incomplete
        if (!profile?.advertiser_onboarding_completed || !advertiser) {
          window.location.href = '/advertiser/signup';
        } else {
          window.location.href = '/advertiser';
        }
      }
    }
  };

  const enableRole = async (role: UserRole) => {
    await enableRoleMutation.mutateAsync(role);
  };

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        availableRoles,
        isLoading,
        hasMultipleRoles,
        switchRole,
        enableRole,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
