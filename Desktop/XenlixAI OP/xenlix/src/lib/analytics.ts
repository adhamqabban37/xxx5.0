import { useMemo } from 'react';

// Simple analytics tracking for AEO tool conversion events
// This can be easily integrated with Google Analytics, Mixpanel, or other analytics providers

type EventName = 
  | 'aeo_form_submit'
  | 'aeo_analysis_success'
  | 'aeo_analysis_error'
  | 'aeo_results_view'
  | 'aeo_summary_view'
  | 'upgrade_click'
  | 'back_to_home_click'
  | 'sample_section_view'
  | 'upsell_website_builder_click'
  | 'upsell_consultation_click'
  | 'analyze_another_click'
  | 'download_report_click';

interface EventProperties {
  url?: string;
  error_type?: string;
  error_message?: string;
  analysis_time_ms?: number;
  plan_type?: string;
  price?: string;
  user_agent?: string;
  referrer?: string;
  timestamp?: string;
}

class AEOAnalytics {
  private static instance: AEOAnalytics;
  private isEnabled: boolean = true;

  static getInstance(): AEOAnalytics {
    if (!AEOAnalytics.instance) {
      AEOAnalytics.instance = new AEOAnalytics();
    }
    return AEOAnalytics.instance;
  }

  // Track conversion events
  track(eventName: EventName, properties: EventProperties = {}): void {
    if (!this.isEnabled) return;

    const eventData = {
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        page_url: window.location.href,
      }
    };

    // Log to console for development
    console.log('📊 Analytics Event:', eventData);

    // Send to analytics provider (uncomment and configure as needed)
    this.sendToAnalyticsProvider(eventData);
    
    // Store locally for debugging/backup
    this.storeLocally(eventData);
  }

  private sendToAnalyticsProvider(eventData: any): void {
    // Google Analytics 4 (gtag)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventData.event, {
        custom_parameter_1: eventData.properties.url,
        custom_parameter_2: eventData.properties.error_type,
        event_category: 'AEO_Tool',
        event_label: eventData.properties.url,
        value: eventData.properties.analysis_time_ms ? Math.round(eventData.properties.analysis_time_ms / 1000) : undefined,
      });
    }

    // Mixpanel
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track(eventData.event, eventData.properties);
    }

    // Custom analytics endpoint
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      }).catch(console.error);
    }
  }

  private storeLocally(eventData: any): void {
    if (typeof window === 'undefined') return;
    
    try {
      const existing = localStorage.getItem('aeo_analytics_events');
      const events = existing ? JSON.parse(existing) : [];
      events.push(eventData);
      
      // Keep only last 100 events to prevent storage bloat
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('aeo_analytics_events', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to store analytics event locally:', error);
    }
  }

  // Conversion funnel tracking
  trackFormSubmission(url: string): void {
    this.track('aeo_form_submit', { url });
  }

  trackAnalysisSuccess(url: string, analysisTimeMs: number): void {
    this.track('aeo_analysis_success', { 
      url, 
      analysis_time_ms: analysisTimeMs 
    });
  }

  trackAnalysisError(url: string, errorType: string, errorMessage: string): void {
    this.track('aeo_analysis_error', { 
      url, 
      error_type: errorType, 
      error_message: errorMessage 
    });
  }

  trackResultsView(url: string): void {
    this.track('aeo_results_view', { url });
  }

  trackUpsellClick(type: 'website_builder' | 'consultation', url?: string): void {
    if (type === 'website_builder') {
      this.track('upsell_website_builder_click', { url });
    } else {
      this.track('upsell_consultation_click', { url });
    }
  }

  trackAnalyzeAnotherClick(): void {
    this.track('analyze_another_click');
  }

  trackDownloadReport(url: string): void {
    this.track('download_report_click', { url });
  }

  // New summary page tracking methods
  trackSummaryPageView(url: string): void {
    this.track('aeo_summary_view', { url });
  }

  trackUpgradeClick(planType: string, url: string, price: string): void {
    this.track('upgrade_click', { 
      plan_type: planType,
      url,
      price
    });
  }

  trackBackToHomeClick(url: string): void {
    this.track('back_to_home_click', { url });
  }

  trackSampleSectionView(url: string): void {
    this.track('sample_section_view', { url });
  }

  // Get conversion metrics for debugging
  getConversionMetrics(): any {
    if (typeof window === 'undefined') return {};
    
    try {
      const events = JSON.parse(localStorage.getItem('aeo_analytics_events') || '[]');
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = events.filter((e: any) => e.properties.timestamp?.startsWith(today));
      
      return {
        total_events_today: todayEvents.length,
        form_submissions: todayEvents.filter((e: any) => e.event === 'aeo_form_submit').length,
        successful_analyses: todayEvents.filter((e: any) => e.event === 'aeo_analysis_success').length,
        failed_analyses: todayEvents.filter((e: any) => e.event === 'aeo_analysis_error').length,
        upsell_clicks: todayEvents.filter((e: any) => 
          e.event === 'upsell_website_builder_click' || e.event === 'upsell_consultation_click'
        ).length,
        conversion_rate: todayEvents.filter((e: any) => e.event === 'aeo_form_submit').length > 0 
          ? (todayEvents.filter((e: any) => e.event === 'aeo_analysis_success').length / 
             todayEvents.filter((e: any) => e.event === 'aeo_form_submit').length * 100).toFixed(2) + '%'
          : '0%'
      };
    } catch {
      return {};
    }
  }

  // Disable tracking (for privacy compliance)
  disable(): void {
    this.isEnabled = false;
  }

  enable(): void {
    this.isEnabled = true;
  }
}

export const analytics = AEOAnalytics.getInstance();

// Helper hook for React components
export const useAEOAnalytics = () => {
  return useMemo(() => ({
    trackFormSubmission: analytics.trackFormSubmission.bind(analytics),
    trackAnalysisSuccess: analytics.trackAnalysisSuccess.bind(analytics),
    trackAnalysisError: analytics.trackAnalysisError.bind(analytics),
    trackResultsView: analytics.trackResultsView.bind(analytics),
    trackSummaryPageView: analytics.trackSummaryPageView.bind(analytics),
    trackUpgradeClick: analytics.trackUpgradeClick.bind(analytics),
    trackBackToHomeClick: analytics.trackBackToHomeClick.bind(analytics),
    trackSampleSectionView: analytics.trackSampleSectionView.bind(analytics),
    trackUpsellClick: analytics.trackUpsellClick.bind(analytics),
    trackAnalyzeAnotherClick: analytics.trackAnalyzeAnotherClick.bind(analytics),
    trackDownloadReport: analytics.trackDownloadReport.bind(analytics),
    getConversionMetrics: analytics.getConversionMetrics.bind(analytics),
  }), []);
};