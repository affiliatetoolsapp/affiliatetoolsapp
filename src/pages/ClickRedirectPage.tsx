
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
        
        // Device type detection (using the operating system for more accuracy)
        if (/Android|iPhone|iPad|iPod/i.test(userAgent)) {
          device = operatingSystem; // Use OS name for mobile devices
        }
        
        // Fast IP detection - run in parallel but don't block redirect
        let ipAddress = null;
        let country = null;
        
        try {
          const ipPromise = fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => {
              ipAddress = data.ip;
              if (ipAddress && ipAddress !== '127.0.0.1' && !ipAddress.startsWith('192.168.')) {
                return fetch(`https://ipapi.co/${ipAddress}/json/`)
                  .then(res => res.json())
                  .then(geoData => {
                    country = geoData.country_name;
                  });
              }
            })
            .catch(err => console.warn('IP/geo detection error:', err));
          
          // Use Promise.race to avoid waiting too long for IP data
          await Promise.race([
            ipPromise,
            new Promise(resolve => setTimeout(resolve, 300)) // 300ms timeout
          ]);
        } catch (ipErr) {
          console.warn('IP detection error:', ipErr);
        }
        
        // Prepare click data
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
          custom_params: linkData.custom_params || null,
          created_at: new Date().toISOString()
        };
        
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
