
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatTrackingUrl } from '@/components/affiliate/utils/offerUtils';

export default function ClickRedirectPage() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const processClick = async () => {
      if (!trackingCode) {
        setError('Invalid tracking link');
        return;
      }

      try {
        console.log(`Processing click for tracking code: ${trackingCode}`);
        
        // Get tracking link details
        const { data: linkData, error: linkError } = await supabase
          .from('tracking_links')
          .select('*, offers(*)')
          .eq('tracking_code', trackingCode)
          .maybeSingle();

        if (linkError) {
          console.error('Link fetch error:', linkError);
          setError('Error retrieving tracking link');
          return;
        }

        if (!linkData) {
          console.error('Tracking link not found for code:', trackingCode);
          setError('Link not found or expired');
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

        // Get basic device info
        const userAgent = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const device = isMobile ? 'mobile' : 'desktop';
        
        // Simplified click data
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
          custom_params: null,
          created_at: new Date().toISOString()
        };
        
        console.log('Attempting to insert click data:', clickData);

        try {
          // Use the insert_click RPC function directly
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
        setError('An unexpected error occurred');
      }
    };

    processClick();
  }, [trackingCode, navigate]);

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
