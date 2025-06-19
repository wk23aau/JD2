// Ambient declaration for gtag if not using a library like @types/gtag.js
declare global {
  interface Window {
    gtag?: (command: string, action: string, params?: GtagEventParams) => void;
  }
}

export interface GtagEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: any; // Allow other custom parameters
}

const GA_TRACKING_ID = "G-XXXXXXXXXX"; // Replace with your actual Measurement ID

/**
 * Sends a page view event to Google Analytics.
 * Should be called on initial load and on route changes.
 * @param path - The path of the page being viewed (e.g., window.location.pathname).
 */
export const trackPageView = (path: string): void => {
  if (typeof window.gtag === 'function') {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: path,
    });
    console.log(`GA PageView: ${path}`);
  } else {
    // console.warn('gtag not available for page view tracking.');
  }
};

/**
 * Sends an event to Google Analytics.
 * @param action - The action of the event (e.g., 'click', 'cv_generated').
 * @param params - Optional parameters for the event, including category, label, value.
 */
export const trackEvent = (action: string, params?: GtagEventParams): void => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', action, params);
    console.log(`GA Event: ${action}`, params || '');
  } else {
    // console.warn(`gtag not available for event: ${action}`);
  }
};

export default {
  trackPageView,
  trackEvent,
};
