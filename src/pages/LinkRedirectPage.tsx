
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TrackingLinkWithOffer } from '@/types';
import { toast } from 'sonner';

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
        console.log(`Processing click for tracking code: ${trackingCode}`);
        
        // Get the tracking link details
        const { data: linkData, error: linkError } = await supabase
          .from('tracking_links')
          .select(`
            *,
            offer:offers(*)
          `)
          .eq('tracking_code', trackingCode)
          .single();
        
        if (linkError) {
          console.error('Error fetching tracking link:', linkError);
          throw linkError;
        }
        
        if (!linkData) {
          console.error('Tracking link not found');
          setError('Tracking link not found');
          setIsLoading(false);
          return;
        }

        console.log('Tracking link found:', linkData);

        // Cast linkData to TrackingLinkWithOffer to include link_type
        const typedLinkData = linkData as TrackingLinkWithOffer;
        
        // Check if the affiliate is approved for this offer
        const { data: approvalData, error: approvalError } = await supabase
          .from('affiliate_offers')
          .select('status')
          .eq('affiliate_id', typedLinkData.affiliate_id)
          .eq('offer_id', typedLinkData.offer_id)
          .single();
        
        if (approvalError) {
          console.error('Error checking affiliate approval:', approvalError);
          throw approvalError;
        }
        
        if (!approvalData || approvalData.status !== 'approved') {
          console.error('Affiliate not approved for this offer');
          setError('Affiliate not approved for this offer');
          setIsLoading(false);
          return;
        }
        
        // Generate a unique click ID using crypto for better security
        const clickId = crypto.randomUUID();
        console.log('Generated click ID:', clickId);
        
        // Get IP info for geo tracking
        let ipInfo: any = null;
        try {
          const ipResponse = await fetch('https://ipapi.co/json/');
          ipInfo = await ipResponse.json();
          console.log('Obtained IP info:', ipInfo);
        } catch (ipError) {
          console.error('Failed to get IP info:', ipError);
        }
        
        // Get device info
        const userAgent = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
        const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
        console.log('Device detected:', device);
        
        // Collect custom parameters from the URL
        const customParams: Record<string, string> = {};
        
        // Add custom params from tracking_links table
        if (typedLinkData.custom_params) {
          Object.assign(customParams, typedLinkData.custom_params);
        }
        
        // Add any additional URL parameters
        for (const [key, value] of searchParams.entries()) {
          if (key !== 'tracking_code') {
            customParams[key] = value;
          }
        }
        
        console.log('Logging click with custom params:', customParams);
        
        // Log the click
        const { data: clickData, error: clickError } = await supabase
          .from('clicks')
          .insert({
            click_id: clickId,
            tracking_code: trackingCode,
            affiliate_id: typedLinkData.affiliate_id,
            offer_id: typedLinkData.offer_id,
            ip_address: ipInfo?.ip || null,
            user_agent: userAgent,
            device,
            geo: ipInfo?.country || null,
            referrer: document.referrer || null,
            custom_params: Object.keys(customParams).length > 0 ? customParams : null,
            created_at: new Date().toISOString()
          });
          
        if (clickError) {
          console.error('Error logging click:', clickError);
          throw clickError;
        }
        
        console.log('Click logged successfully');
        
        // Check if this is a CPC offer and credit the affiliate immediately
        if (typedLinkData.offer.commission_type === 'CPC' && typedLinkData.offer.commission_amount) {
          console.log('Processing CPC commission');
          
          const { data: walletData, error: walletError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', typedLinkData.affiliate_id)
            .single();
          
          if (walletError) {
            console.error('Error fetching wallet:', walletError);
          } else if (walletData) {
            console.log('Updating wallet with CPC amount');
            
            // Update wallet with the CPC amount
            const { error: updateError } = await supabase
              .from('wallets')
              .update({
                pending: walletData.pending + typedLinkData.offer.commission_amount
              })
              .eq('user_id', typedLinkData.affiliate_id);
              
            if (updateError) {
              console.error('Error updating wallet:', updateError);
            }
            
            // Create a conversion record for CPC
            const { error: conversionError } = await supabase
              .from('conversions')
              .insert({
                click_id: clickId,
                event_type: 'click',
                commission: typedLinkData.offer.commission_amount,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
            if (conversionError) {
              console.error('Error creating CPC conversion:', conversionError);
            } else {
              console.log('CPC conversion recorded');
            }
          }
        }
        
        // Build redirect URL with clickId and parameters
        let redirectUrl = typedLinkData.offer.url;
        
        // Add parameters separator if needed
        redirectUrl += redirectUrl.includes('?') ? '&' : '?';
        
        // Add clickId as a parameter
        redirectUrl += `clickId=${clickId}`;
        
        // Add custom parameters
        Object.entries(customParams).forEach(([key, value]) => {
          redirectUrl += `&${key}=${encodeURIComponent(value)}`;
        });
        
        // If this is a short link or QR code, log additional analytics
        if (typedLinkData.link_type === 'shortened' || typedLinkData.link_type === 'qr') {
          console.log(`Redirect from ${typedLinkData.link_type} link: ${trackingCode}`);
        }
        
        console.log('Redirecting to:', redirectUrl);
        
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
