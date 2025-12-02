/**
 * Hook to fetch and manage user roles from the database
 * 
 * This replaces the old RoleContext dual-role system with a proper
 * multi-role system where users can have multiple roles simultaneously.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/config/navigation';

interface UseUserRolesReturn {
  roles: UserRole[];
  isLoading: boolean;
  error: Error | null;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAdmin: boolean;
  isCreator: boolean;
  isAdvertiser: boolean;
  isInfluencer: boolean;
  isAgency: boolean;
  isSubscriber: boolean;
  isBoardMember: boolean;
}

export function useUserRoles(): UseUserRolesReturn {
  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ['userRoles'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Map database roles to UserRole type and include super_admin as admin
      const userRoles = data.map(r => r.role as UserRole);
      
      // If user has super_admin, also include admin for convenience
      if (userRoles.includes('super_admin' as UserRole)) {
        userRoles.push('admin');
      }
      
      return userRoles;
    },
  });

  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (checkRoles: UserRole[]): boolean => {
    return checkRoles.some(role => roles.includes(role));
  };

  return {
    roles,
    isLoading,
    error: error as Error | null,
    hasRole,
    hasAnyRole,
    isAdmin: roles.includes('admin') || roles.includes('super_admin' as UserRole),
    isCreator: roles.includes('creator'),
    isAdvertiser: roles.includes('advertiser'),
    isInfluencer: roles.includes('influencer'),
    isAgency: roles.includes('agency'),
    isSubscriber: roles.includes('subscriber'),
    isBoardMember: roles.includes('board_member' as UserRole),
  };
}
