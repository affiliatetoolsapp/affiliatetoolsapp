
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function ClickRedirectPage() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
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
        // Prepare code variations
        const originalCode = trackingCode;
        const cleanedCode = originalCode.trim();
        const decodedCode = decodeURIComponent(cleanedCode);
        
        const codeVariations = [originalCode];
        if (cleanedCode !== originalCode) codeVariations.push(cleanedCode);
        if (decodedCode !== cleanedCode) codeVariations.push(decodedCode);
        
        console.log(`Processing click with tracking code variations:`, codeVariations);
        
        // Fast query to check if any variation matches
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
        
        // Generate a click ID
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
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
          device = 'mobile';
        } else {
          device = 'desktop';
        }
        
        console.log(`Device detected: ${device}, OS: ${operatingSystem}`);
        
        // Get IP and country information
        let ipAddress = null;
        let country = null;
        
        try {
          // Get IP address
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          if (!ipResponse.ok) {
            console.warn('IP detection service returned error:', ipResponse.statusText);
            throw new Error('IP detection service unavailable');
          }
          
          const ipData = await ipResponse.json();
          ipAddress = ipData.ip;
          console.log('IP Address detected:', ipAddress);
          
          if (ipAddress && ipAddress !== '127.0.0.1' && !ipAddress.startsWith('192.168.')) {
            try {
              // Now try to get geo data with increased timeout
              const geoResponse = await Promise.race<Response>([
                fetch(`https://ipapi.co/${ipAddress}/json/`),
                new Promise<never>((_, reject) => 
                  setTimeout(() => reject(new Error('Geo lookup timeout')), 1000) // Increased timeout to 1000ms
                )
              ]);
              
              if (!geoResponse.ok) {
                console.warn('Geo lookup service returned error:', geoResponse.statusText);
                throw new Error('Geo lookup service error');
              }
              
              const geoData = await geoResponse.json();
              
              if (geoData.error) {
                console.warn('Geo data contained error:', geoData.error);
                throw new Error('Geo data error: ' + geoData.error);
              }
              
              country = geoData.country_name || geoData.country;
              console.log('Country detected:', country);
              
              if (!country) {
                console.warn('No country found in geo data:', geoData);
              }
            } catch (geoErr) {
              console.warn('Geo detection error:', geoErr);
              // Try alternate geo service if the first one fails
              try {
                const altGeoResponse = await Promise.race<Response>([
                  fetch(`https://ip-api.com/json/${ipAddress}`),
                  new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('Alternate geo lookup timeout')), 1000)
                  )
                ]);
                
                if (altGeoResponse.ok) {
                  const altGeoData = await altGeoResponse.json();
                  if (altGeoData.status === 'success') {
                    country = altGeoData.country;
                    console.log('Country detected from alternate service:', country);
                  }
                }
              } catch (altGeoErr) {
                console.warn('Alternate geo detection error:', altGeoErr);
              }
            }
          }
        } catch (ipErr) {
          console.warn('IP detection error:', ipErr);
          // Don't halt the redirect process if IP detection fails
        }
        
        // Prepare click data with the information we have
        const clickData = {
          click_id: clickId,
          tracking_code: linkData.tracking_code,
          affiliate_id: linkData.affiliate_id,
          offer_id: linkData.offer_id,
          ip_address: ipAddress || 'unknown',
          geo: country || 'unknown',
          user_agent: userAgent,
          device,
          referrer: document.referrer || null,
          custom_params: linkData.custom_params || null,
          created_at: new Date().toISOString()
        };
        
        console.log('Recording click with data:', clickData);
        
        // Log click asynchronously - don't wait for completion to redirect
        try {
          const { error } = await supabase.rpc('insert_click', clickData);
          if (error) console.error('Failed to record click:', error);
        } catch (err) {
          console.error('Error during click insertion:', err);
        }
        
        // Build redirect URL
        let redirectUrl = linkData.offers.url;
        redirectUrl += redirectUrl.includes('?') ? '&' : '?';
        redirectUrl += `clickId=${clickId}`;
        
        console.log('Redirecting to:', redirectUrl);
        
        // Immediate redirect - don't wait for click logging to complete
        window.location.href = redirectUrl;
      } catch (error) {
        console.error('Error processing click:', error);
        setError('An unexpected error occurred: ' + (error instanceof Error ? error.message : String(error)));
      }
    })();
  }, [trackingCode]);

  // Only show error page if something went wrong
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="mb-4">{error}</p>
          <a 
            href="/"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md inline-block"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  // Return empty div - user should never see this as redirection happens immediately
  return <div style={{ display: 'none' }}></div>;
}
