
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ClickRedirectPage() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const processClick = async () => {
      if (!trackingCode) {
        console.error('No tracking code provided in URL');
        setError('Invalid tracking link');
        return;
      }

      try {
        console.log(`Processing click for tracking code: ${trackingCode}`);
        console.log(`Device detection: isMobile=${isMobile}, userAgent=${navigator.userAgent}`);
        
        // Clean the tracking code first to remove any whitespace
        const cleanedCode = trackingCode.trim();
        console.log(`Original tracking code: '${trackingCode}', Cleaned code: '${cleanedCode}'`);
        
        // Always use the cleaned tracking code first
        let { data: linkData, error: linkError } = await supabase
          .from('tracking_links')
          .select('*, offers(*)')
          .eq('tracking_code', cleanedCode)
          .maybeSingle();

        console.log('Query response:', { 
          data: linkData, 
          error: linkError,
          queryParams: { trackingCode: cleanedCode }
        });
        
        if (linkError) {
          console.error('Link fetch error:', linkError);
          setError('Error retrieving tracking link: ' + linkError.message);
          return;
        }

        // Try original code if cleaned didn't find anything and they're different
        if (!linkData && cleanedCode !== trackingCode) {
          console.log(`Fallback - trying original unmodified code: '${trackingCode}'`);
          const { data: retryData, error: retryError } = await supabase
            .from('tracking_links')
            .select('*, offers(*)')
            .eq('tracking_code', trackingCode)
            .maybeSingle();
            
          if (retryData) {
            console.log('Found with original code!', retryData);
            linkData = retryData;
          } else if (retryError) {
            console.error('Error in fallback query:', retryError);
          } else {
            console.log('No results found with original code either');
          }
        }

        if (!linkData) {
          console.error('Tracking link not found for any code attempt:', {
            original: trackingCode,
            cleaned: cleanedCode
          });
          setError('Link not found or expired');
          return;
        }

        console.log('Retrieved tracking link data:', linkData);
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
        
        // Simplified click data
        const clickData = {
          click_id: clickId,
          tracking_code: cleanedCode, // Use cleaned code for consistency
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
        
        console.log('Attempting to insert click data:', clickData);

        try {
          // Use the insert_click RPC function
          console.log('Using RPC method to insert click');
          const { data: rpcData, error: rpcError } = await supabase.rpc(
            'insert_click', 
            clickData
          );
          
          if (rpcError) {
            console.error('RPC insert failed:', rpcError);
            toast.error('Failed to record click');
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

        // Build redirect URL with parameters
        let redirectUrl = linkData.offers.url;
        
        // Add parameters separator if needed
        redirectUrl += redirectUrl.includes('?') ? '&' : '?';
        
        // Add clickId to help with tracking
        redirectUrl += `clickId=${clickId}`;

        console.log(`Redirecting to: ${redirectUrl}`);

        // Redirect to advertiser URL
        window.location.href = redirectUrl;
      } catch (error) {
        console.error('Error processing click:', error);
        setError('An unexpected error occurred: ' + (error instanceof Error ? error.message : String(error)));
      }
    };

    processClick();
  }, [trackingCode, navigate, isMobile]);

  return (
    <div className="flex items-center justify-center min-h-screen flex-col p-4 text-center">
      {error ? (
        <div>
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Return Home
          </button>
        </div>
      ) : (
        <div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p>Redirecting you to the advertiser...</p>
        </div>
      )}
    </div>
  );
}
