
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Toaster } from '@/components/ui/toaster';

export default function LinkRedirectPage() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const processClick = async () => {
      if (!trackingCode) {
        console.error('No tracking code provided in URL');
        setError('Invalid tracking link');
        setIsLoading(false);
        return;
      }
      
      try {
        // Prepare all possible variations of the tracking code for thorough checking
        const originalCode = trackingCode;
        const cleanedCode = originalCode.trim();
        const decodedCode = decodeURIComponent(cleanedCode);
        
        const codeVariations = [originalCode];
        if (cleanedCode !== originalCode) codeVariations.push(cleanedCode);
        if (decodedCode !== cleanedCode) codeVariations.push(decodedCode);
        
        console.log(`Processing click with tracking code variations:`, codeVariations);
        console.log(`Device detection: isMobile=${isMobile}, userAgent=${navigator.userAgent}`);
        
        // Try each code variation until we find a match
        let linkData = null;
        let querySuccess = false;
        let queryError = null;
        let lastQueryResult = null;
        
        for (const code of codeVariations) {
          console.log(`Trying tracking code: '${code}'`);
          
          const { data, error } = await supabase
            .from('tracking_links')
            .select(`
              *,
              offers(*)
            `)
            .eq('tracking_code', code)
            .maybeSingle();
          
          lastQueryResult = { data, error, code };
          console.log(`Query result for code '${code}':`, { 
            success: !!data && !error, 
            hasError: !!error,
            data: data ? JSON.stringify(data).substring(0, 100) + '...' : 'Not found', 
            error: error ? error.message : 'None' 
          });
          
          if (error) {
            queryError = error;
            continue;
          }
          
          if (data) {
            linkData = data;
            querySuccess = true;
            console.log(`Found matching tracking link with code '${code}'`);
            break;
          }
        }
        
        // Handle case where no match was found after trying all variations
        if (!linkData) {
          console.error('Tracking link not found after trying all variations:', { 
            originalCode,
            cleanedCode,
            decodedCode,
            attemptedVariations: codeVariations,
            userAgent: navigator.userAgent,
            isMobile
          });
          
          if (queryError) {
            console.error('Query error:', queryError);
            setError('Error retrieving tracking link: ' + queryError.message);
          } else {
            setError('Tracking link not found or expired');
          }
          
          setIsLoading(false);
          return;
        }

        console.log('Retrieved tracking link data:', linkData);
        
        // Make sure offers data is accessible
        if (!linkData.offers) {
          console.error('Offers data not found in query result:', lastQueryResult);
          setError('Invalid offer configuration: missing offer data');
          setIsLoading(false);
          return;
        }
        
        console.log('Offer data:', linkData.offers);

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

        // Get country information
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
        
        // Get device info directly from user agent
        const userAgent = navigator.userAgent;
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i;
        const device = mobileRegex.test(userAgent) ? 'mobile' : 'desktop';
        console.log('Detected device type directly from userAgent:', device);
        
        // Simplified custom parameters
        const customParams: Record<string, string> = {};
        
        // Add any additional URL parameters
        for (const [key, value] of searchParams.entries()) {
          if (key !== 'tracking_code') {
            customParams[key] = value;
          }
        }
        
        // Use the same code that matched in the database for consistency
        const finalTrackingCode = linkData.tracking_code;
        
        const clickData = {
          click_id: clickId,
          tracking_code: finalTrackingCode,
          affiliate_id: linkData.affiliate_id,
          offer_id: linkData.offer_id,
          ip_address: ipAddress,
          geo: country,
          user_agent: userAgent,
          device,
          referrer: document.referrer || null,
          custom_params: Object.keys(customParams).length > 0 ? customParams : linkData.custom_params,
          created_at: new Date().toISOString()
        };
        
        console.log('Attempting to insert click data:', clickData);
        
        try {
          // Use RPC call directly
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
        
        if (!linkData.offers || !linkData.offers.url) {
          console.error('Offer URL is missing');
          setError('Invalid offer configuration');
          setIsLoading(false);
          return;
        }
        
        // Build redirect URL
        let redirectUrl = linkData.offers.url;
        
        // Add parameters separator if needed
        redirectUrl += redirectUrl.includes('?') ? '&' : '?';
        
        // Add clickId to help with tracking
        redirectUrl += `clickId=${clickId}`;
        
        console.log(`Redirecting to: ${redirectUrl}`);
        
        // Redirect to the offer URL
        window.location.href = redirectUrl;
        
      } catch (error) {
        console.error('Error processing click:', error);
        setError('Failed to process tracking link: ' + (error instanceof Error ? error.message : String(error)));
        setIsLoading(false);
      }
    };
    
    processClick();
  }, [trackingCode, searchParams, navigate, isMobile]);
  
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
        <Toaster />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      <p className="mt-4 text-muted-foreground">Redirecting to destination...</p>
      <Toaster />
    </div>
  );
}
