
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
          setError('Tracking link not found');
          setIsLoading(false);
          return;
        }

        console.log('Retrieved tracking link data:', linkData);

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
          setError('Affiliate not approved for this offer');
          setIsLoading(false);
          return;
        }
        
        // Generate a unique click ID using crypto for better security
        const clickId = crypto.randomUUID();
        console.log(`Generated click ID: ${clickId}`);
        
        // Get IP info for geo tracking
        let ipInfo: any = null;
        try {
          const ipResponse = await fetch('https://ipapi.co/json/');
          ipInfo = await ipResponse.json();
          console.log('IP info retrieved:', ipInfo);
        } catch (ipError) {
          console.error('Failed to get IP info:', ipError);
        }
        
        // Get device info
        const userAgent = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
        const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
        
        // Extract browser and OS info for detailed reporting
        let browser = 'Unknown';
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';
        else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) browser = 'Internet Explorer';
        
        let os = 'Unknown';
        if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Mac')) os = 'MacOS';
        else if (userAgent.includes('iPhone')) os = 'iOS';
        else if (userAgent.includes('iPad')) os = 'iPadOS';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('Linux')) os = 'Linux';
        
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
        
        // Add browser and OS info to custom params for detailed reporting
        customParams.browser = browser;
        customParams.os = os;
        
        const clickData = {
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
        };
        
        console.log('Logging click with data:', clickData);
        
        // Log the click
        const { error: clickInsertError } = await supabase
          .from('clicks')
          .insert(clickData);
          
        if (clickInsertError) {
          console.error('Error inserting click data:', clickInsertError);
          console.error('Error details:', JSON.stringify(clickInsertError));
          toast.error('Failed to log click data, but continuing with redirect');
        } else {
          console.log('Click successfully logged to database');
          toast.success('Click tracked successfully');
        }
        
        // Check if this is a CPC offer and credit the affiliate immediately
        if (typedLinkData.offer.commission_type === 'CPC' && typedLinkData.offer.commission_amount) {
          try {
            const { data: walletData, error: walletError } = await supabase
              .from('wallets')
              .select('*')
              .eq('user_id', typedLinkData.affiliate_id)
              .single();
              
            if (walletError) {
              console.error('Error fetching wallet:', walletError);
            } else if (walletData) {
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
                console.error('Error creating conversion:', conversionError);
              } else {
                console.log('CPC commission credited:', typedLinkData.offer.commission_amount);
              }
            }
          } catch (cpcError) {
            console.error('Error processing CPC commission:', cpcError);
          }
        }
        
        // Build redirect URL with clickId and parameters
        let redirectUrl = typedLinkData.offer.url;
        
        // Add parameters separator if needed
        redirectUrl += redirectUrl.includes('?') ? '&' : '?';
        
        // Add clickId and IDs to help with tracking
        redirectUrl += `clickId=${clickId}&affiliateId=${typedLinkData.affiliate_id}&offerId=${typedLinkData.offer_id}`;
        
        // Add custom parameters
        Object.entries(customParams).forEach(([key, value]) => {
          redirectUrl += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        });
        
        // If this is a short link or QR code, log additional analytics
        if (typedLinkData.link_type === 'shortened' || typedLinkData.link_type === 'qr') {
          console.log(`Redirect from ${typedLinkData.link_type} link: ${trackingCode}`);
        }
        
        console.log(`Redirecting to: ${redirectUrl}`);
        
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
