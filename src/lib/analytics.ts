// GTM DataLayer Analytics Utility
// Centralized event tracking for Google Tag Manager

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    __scrolled_70?: boolean;
  }
}

// Ensure dataLayer exists
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
}

function pushEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...data });
  }
}

/* ---------- AUTH ---------- */
export const trackLoginStarted = () => pushEvent('login_started');
export const trackLoginSuccess = () => pushEvent('login_success');
export const trackLoginError = () => pushEvent('login_error');

export const trackSignupStarted = () => pushEvent('signup_started');
export const trackSignupSuccess = () => pushEvent('signup_success');
export const trackSignupError = () => pushEvent('signup_error');

/* ---------- SUBSCRIPTION ---------- */
export const trackSubscriptionStarted = () => pushEvent('subscription_started');
export const trackSubscriptionCompleted = (data?: { email_domain?: string; source?: string }) => 
  pushEvent('subscription_completed', data);
export const trackSubscriptionError = () => pushEvent('subscription_error');

/* ---------- CTA ---------- */
export const trackCtaClicked = (ctaName: string) => 
  pushEvent('cta_clicked', { cta_name: ctaName });
export const trackScheduleDemoClicked = () => pushEvent('schedule_demo_clicked');

/* ---------- SCROLL DEPTH ---------- */
export function initScrollTracking() {
  if (typeof window === 'undefined' || window.__scrolled_70) return;

  const handleScroll = () => {
    const scrollPercent =
      (window.scrollY + window.innerHeight) / document.body.scrollHeight;

    if (scrollPercent >= 0.7 && !window.__scrolled_70) {
      window.__scrolled_70 = true;
      pushEvent('scroll_70');
      window.removeEventListener('scroll', handleScroll);
    }
  };

  window.addEventListener('scroll', handleScroll);
}

// Reset scroll tracking on route change
export function resetScrollTracking() {
  if (typeof window !== 'undefined') {
    window.__scrolled_70 = false;
  }
}

/* ---------- PAGE HEALTH ---------- */
export const trackPageLoaded = (pagePath?: string) => 
  pushEvent('page_loaded', { page_path: pagePath || window.location.pathname });

/* ---------- GENERIC ---------- */
export const trackEvent = pushEvent;
