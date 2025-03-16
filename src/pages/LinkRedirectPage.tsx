
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function LinkRedirectPage() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const processClick = async () => {
      if (!trackingCode) {
        console.error('No tracking code provided in URL');
        setError('Invalid tracking link');
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
        
        // Try each code variation until we find a match
        let linkData = null;
        let queryError = null;
        
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
            console.log(`Found matching tracking link with code '${code}'`);
            break;
          }
        }
        
        // Handle case where no match was found after trying all variations
        if (!linkData) {
          console.error('Tracking link not found after trying all variations:', { 
            originalCode,
            cleanedCode,
            decodedCode
          });
          
          if (queryError) {
            console.error('Query error:', queryError);
            setError('Error retrieving tracking link: ' + queryError.message);
          } else {
            setError('Tracking link not found or expired');
          }
          return;
        }

        console.log('Retrieved tracking link data:', linkData);
        
        // Make sure offers data is accessible
        if (!linkData.offers) {
          console.error('Offers data not found in query result');
          setError('Invalid offer configuration: missing offer data');
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
        
        // Improved device detection
        const userAgent = navigator.userAgent;
        let device = 'desktop';
        
        // More accurate mobile device detection
        if (/iPhone|iPad|iPod/i.test(userAgent)) {
          device = 'iOS';
        } else if (/Android/i.test(userAgent)) {
          device = 'Android';
        } else if (/Windows Phone|IEMobile/i.test(userAgent)) {
          device = 'Windows Phone';
        } else if (/Macintosh|MacIntel|MacPPC|Mac68K/i.test(userAgent)) {
          device = 'macOS';
        } else if (/Win/i.test(userAgent)) {
          device = 'Windows';
        } else if (/Linux/i.test(userAgent)) {
          device = 'Linux';
        }
        
        console.log('Detected device type:', device, 'User agent:', userAgent);
        
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
            // No toast message here
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
          return;
        }
        
        // Build redirect URL
        let redirectUrl = linkData.offers.url;
        
        // Add parameters separator if needed
        redirectUrl += redirectUrl.includes('?') ? '&' : '?';
        
        // Add clickId to help with tracking
        redirectUrl += `clickId=${clickId}`;
        
        console.log(`Redirecting to: ${redirectUrl}`);
        
        // Immediate redirect
        window.location.href = redirectUrl;
        
      } catch (error) {
        console.error('Error processing click:', error);
        setError('Failed to process tracking link: ' + (error instanceof Error ? error.message : String(error)));
      }
    };
    
    // Start processing immediately
    processClick();
  }, [trackingCode, searchParams]);
  
  // Only show error state if there's an error
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
  
  // Blank loading screen - users won't see this as redirect happens immediately
  return <div></div>;
}
