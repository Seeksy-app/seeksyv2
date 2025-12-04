import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const ROOT_ROUTES = ['/', '/creator', '/home'];

export function useDefaultLanding() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Only redirect on root routes, not deep links
    if (!ROOT_ROUTES.includes(location.pathname)) {
      setChecked(true);
      return;
    }

    const checkDefaultLanding = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setChecked(true);
          return;
        }

        const { data } = await supabase
          .from('user_preferences')
          .select('default_landing_route')
          .eq('user_id', user.id)
          .single();

        const defaultRoute = data?.default_landing_route || '/my-day';
        
        // Navigate to the default landing route
        if (location.pathname !== defaultRoute) {
          navigate(defaultRoute, { replace: true });
        }
      } catch (err) {
        console.error('Error checking default landing:', err);
        // Default to My Day on error
        navigate('/my-day', { replace: true });
      } finally {
        setChecked(true);
      }
    };

    checkDefaultLanding();
  }, [location.pathname, navigate]);

  return { checked };
}
