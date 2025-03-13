
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function LinkRedirectPage() {
  const { trackingCode } = useParams();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const processClick = async () => {
      if (!trackingCode) {
        setError('Invalid tracking link');
        setIsLoading(false);
        return;
      }
      
      try {
        // Get the tracking link details
        const { data: linkData, error: linkError } = await supabase
          .from('tracking_links')
          .select(`
            *,
            offer:offers(*)
          `)
          .eq('tracking_code', trackingCode)
          .single();
        
        if (linkError) throw linkError;
        
        if (!linkData) {
          setError('Tracking link not found');
          setIsLoading(false);
          return;
        }
        
        // Check if the affiliate is approved for this offer
        const { data: approvalData, error: approvalError } = await supabase
          .from('affiliate_offers')
          .select('status')
          .eq('affiliate_id', linkData.affiliate_id)
          .eq('offer_id', linkData.offer_id)
          .single();
        
        if (approvalError) throw approvalError;
        
        if (!approvalData || approvalData.status !== 'approved') {
          setError('Affiliate not approved for this offer');
          setIsLoading(false);
          return;
        }
        
        // Generate a unique click ID
        const clickId = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
        
        // Get IP info for geo tracking
        let ipInfo: any = null;
        try {
          const ipResponse = await fetch('https://ipapi.co/json/');
          ipInfo = await ipResponse.json();
        } catch (ipError) {
          console.error('Failed to get IP info:', ipError);
        }
        
        // Get device info
        const userAgent = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
        const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
        
        // Collect custom parameters from the URL
        const customParams: Record<string, string> = {};
        
        // Add custom params from tracking_links table
        if (linkData.custom_params) {
          Object.assign(customParams, linkData.custom_params);
        }
        
        // Add any additional URL parameters
        for (const [key, value] of searchParams.entries()) {
          if (key !== 'tracking_code') {
            customParams[key] = value;
          }
        }
        
        // Log the click
        await supabase
          .from('clicks')
          .insert({
            click_id: clickId,
            tracking_code: trackingCode,
            affiliate_id: linkData.affiliate_id,
            offer_id: linkData.offer_id,
            ip_address: ipInfo?.ip || null,
            user_agent: userAgent,
            device,
            geo: ipInfo?.country || null,
            referrer: document.referrer || null,
            custom_params: Object.keys(customParams).length > 0 ? customParams : null,
            created_at: new Date().toISOString()
          });
        
        // Check if this is a CPC offer and credit the affiliate immediately
        if (linkData.offer.commission_type === 'CPC' && linkData.offer.commission_amount) {
          const { data: walletData } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', linkData.affiliate_id)
            .single();
          
          if (walletData) {
            // Update wallet with the CPC amount
            await supabase
              .from('wallets')
              .update({
                pending: walletData.pending + linkData.offer.commission_amount
              })
              .eq('user_id', linkData.affiliate_id);
            
            // Create a conversion record for CPC
            await supabase
              .from('conversions')
              .insert({
                click_id: clickId,
                event_type: 'click',
                commission: linkData.offer.commission_amount,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
          }
        }
        
        // Build redirect URL with clickId and parameters
        let redirectUrl = linkData.offer.url;
        
        // Add clickId as a parameter
        redirectUrl += redirectUrl.includes('?') ? '&' : '?';
        redirectUrl += `clickId=${clickId}`;
        
        // Add custom parameters
        Object.entries(customParams).forEach(([key, value]) => {
          redirectUrl += `&${key}=${encodeURIComponent(value)}`;
        });
        
        // Redirect to the offer URL
        window.location.href = redirectUrl;
        
      } catch (error) {
        console.error('Error processing click:', error);
        setError('Failed to process tracking link');
        setIsLoading(false);
      }
    };
    
    processClick();
  }, [trackingCode, searchParams]);
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <a 
          href="/"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Return Home
        </a>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      <p className="mt-4 text-muted-foreground">Redirecting to destination...</p>
    </div>
  );
}
