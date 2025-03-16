
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function LinkRedirectPage() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Execute immediately without waiting for component to fully render
    (async () => {
      if (!trackingCode) {
        console.error('No tracking code provided in URL');
        setError('Invalid tracking link');
        return;
      }
      
      try {
        // Prepare all possible variations of the tracking code
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
          const { data, error } = await supabase
            .from('tracking_links')
            .select(`
              *,
              offers(url)
            `)
            .eq('tracking_code', code)
            .maybeSingle();
          
          if (error) {
            queryError = error;
            continue;
          }
          
          if (data) {
            linkData = data;
            break;
          }
        }
        
        if (!linkData) {
          console.error('Tracking link not found after trying all variations');
          if (queryError) {
            console.error('Query error:', queryError);
            setError('Error retrieving tracking link: ' + queryError.message);
          } else {
            setError('Tracking link not found or expired');
          }
          return;
        }
        
        // Make sure offers data is accessible
        if (!linkData.offers?.url) {
          console.error('Offer URL is missing');
          setError('Invalid offer configuration');
          return;
        }
        
        // Generate a unique click ID
        const clickId = crypto.randomUUID();
        
        // Get device information
        const userAgent = navigator.userAgent;
        
        // More accurate device and OS detection
        let device = 'desktop';
        let operatingSystem = 'Unknown';
        
        // OS Detection
        if (/Windows/i.test(userAgent)) operatingSystem = 'Windows';
        else if (/Android/i.test(userAgent)) operatingSystem = 'Android';
        else if (/iPhone|iPad|iPod/i.test(userAgent)) operatingSystem = 'iOS';
        else if (/Mac OS X/i.test(userAgent)) operatingSystem = 'macOS';
        else if (/Linux/i.test(userAgent)) operatingSystem = 'Linux';
        
        // Device type detection (mobile or desktop)
        if (/Android|iPhone|iPad|iPod/i.test(userAgent)) {
          device = 'mobile';
        } else if (/Windows|Mac OS X|Linux/i.test(userAgent)) {
          device = 'desktop';
        }
        
        // Fast IP and geo detection - collect first, then process click data
        let ipAddress = null;
        let country = null;
        
        try {
          // Get IP address first - this needs to succeed
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          ipAddress = ipData.ip;
          
          if (ipAddress && ipAddress !== '127.0.0.1' && !ipAddress.startsWith('192.168.')) {
            try {
              // Now try to get geo data with a reasonable timeout
              const geoPromise = fetch(`https://ipapi.co/${ipAddress}/json/`)
                .then(res => res.json())
                .then(geoData => {
                  country = geoData.country_name;
                  return country;
                });
              
              // Use Promise.race to avoid waiting too long for geo data
              const timeoutPromise = new Promise<string | null>(resolve => 
                setTimeout(() => resolve(null), 500) // 500ms timeout (increased from 300ms)
              );
              
              country = await Promise.race([geoPromise, timeoutPromise]);
              
              // Fallback if we couldn't get the country
              if (!country) {
                console.log('Geo lookup timed out, using null for country');
              }
            } catch (geoErr) {
              console.warn('Geo detection error:', geoErr);
            }
          }
        } catch (ipErr) {
          console.warn('IP detection error:', ipErr);
          // Don't halt the redirect process if IP detection fails
        }
        
        // Simplified custom parameters
        const customParams: Record<string, string> = {};
        
        // Add any additional URL parameters
        for (const [key, value] of searchParams.entries()) {
          if (key !== 'tracking_code') {
            customParams[key] = value;
          }
        }
        
        // Prepare click data with the information we have
        const clickData = {
          click_id: clickId,
          tracking_code: linkData.tracking_code,
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
        
        console.log('Recording click with data:', clickData);
        
        // Log click asynchronously - don't wait for completion to redirect
        supabase.rpc('insert_click', clickData)
          .then(({ error }) => {
            if (error) console.error('Failed to record click:', error);
          })
          .catch(err => console.error('Error during click insertion:', err));
        
        // Build redirect URL
        let redirectUrl = linkData.offers.url;
        redirectUrl += redirectUrl.includes('?') ? '&' : '?';
        redirectUrl += `clickId=${clickId}`;
        
        console.log('Redirecting to:', redirectUrl);
        
        // Immediate redirect - don't wait for click logging to complete
        window.location.href = redirectUrl;
      } catch (error) {
        console.error('Error processing click:', error);
        setError('Failed to process tracking link: ' + (error instanceof Error ? error.message : String(error)));
      }
    })();
  }, [trackingCode, searchParams]);
  
  // Only show error page if something went wrong
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
  
  // Return empty div - user should never see this as redirection happens immediately
  return <div style={{ display: 'none' }}></div>;
}
