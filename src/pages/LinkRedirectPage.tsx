
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatTrackingUrl } from '@/components/affiliate/utils/offerUtils';

export default function LinkRedirectPage() {
  const { trackingCode } = useParams();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
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
          .maybeSingle();
        
        if (linkError) {
          console.error('Error fetching tracking link:', linkError);
          setError('Tracking link not found');
          setIsLoading(false);
          return;
        }
        
        if (!linkData) {
          console.error('Tracking link not found for code:', trackingCode);
          setError('Tracking link not found');
          setIsLoading(false);
          return;
        }

        console.log('Retrieved tracking link data:', linkData);

        // Generate a unique click ID
        const clickId = crypto.randomUUID();
        console.log(`Generated click ID: ${clickId}`);
        
        // Get client IP address - this will be null in development
        let ipAddress = null;
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          ipAddress = ipData.ip;
          console.log('Retrieved IP address:', ipAddress);
        } catch (ipError) {
          console.warn('Could not get IP address:', ipError);
        }

        // Get country information - simplified version
        let country = null;
        try {
          if (ipAddress && ipAddress !== '127.0.0.1' && !ipAddress.startsWith('192.168.')) {
            const geoResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
            const geoData = await geoResponse.json();
            country = geoData.country_name;
            console.log('Retrieved country information:', country);
          }
        } catch (geoError) {
          console.warn('Could not get geo information:', geoError);
        }
        
        // Get basic device info
        const userAgent = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const device = isMobile ? 'mobile' : 'desktop';
        
        // Simplified custom parameters
        const customParams: Record<string, string> = {};
        
        // Add any additional URL parameters
        for (const [key, value] of searchParams.entries()) {
          if (key !== 'tracking_code') {
            customParams[key] = value;
          }
        }
        
        const clickData = {
          click_id: clickId,
          tracking_code: trackingCode,
          affiliate_id: linkData.affiliate_id,
          offer_id: linkData.offer_id,
          ip_address: ipAddress,
          geo: country,
          user_agent: userAgent,
          device,
          referrer: document.referrer || null,
          custom_params: Object.keys(customParams).length > 0 ? customParams : null,
          created_at: new Date().toISOString()
        };
        
        console.log('Attempting to insert click data:', clickData);
        
        try {
          // Use RPC call directly without trying direct insert first
          console.log('Using RPC method to insert click');
          const { data: rpcData, error: rpcError } = await supabase.rpc(
            'insert_click',
            clickData
          );
          
          if (rpcError) {
            console.error('RPC insert failed:', rpcError);
            toast({
              title: "Error",
              description: "Failed to record click",
              variant: "destructive"
            });
          } else {
            console.log('Click successfully logged via RPC:', rpcData);
          }
        } catch (insertError) {
          console.error('Error during click insertion:', insertError);
          // Continue despite error to not block user experience
        }
        
        // Build redirect URL
        let redirectUrl = linkData.offer.url;
        
        // Add parameters separator if needed
        redirectUrl += redirectUrl.includes('?') ? '&' : '?';
        
        // Add clickId to help with tracking
        redirectUrl += `clickId=${clickId}`;
        
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
  }, [trackingCode, searchParams, navigate]);
  
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
