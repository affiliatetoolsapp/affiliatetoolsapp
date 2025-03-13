
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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
        // Get tracking link details
        const { data: linkData, error: linkError } = await supabase
          .from('tracking_links')
          .select('*, affiliate_offers!inner(*), offers(*)')
          .eq('tracking_code', trackingCode)
          .single();

        if (linkError || !linkData) {
          setError('Link not found or expired');
          return;
        }

        // Check if affiliate is approved for this offer
        if (linkData.affiliate_offers.status !== 'approved') {
          setError('This affiliate is not approved for this offer');
          return;
        }

        // Generate a unique click ID
        const clickId = crypto.randomUUID();

        // Log click
        const { error: clickError } = await supabase
          .from('clicks')
          .insert({
            click_id: clickId,
            tracking_code: trackingCode,
            affiliate_id: linkData.affiliate_id,
            offer_id: linkData.offer_id,
            ip_address: '', // We'd need server-side code to get this
            user_agent: navigator.userAgent,
            device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
            referrer: document.referrer,
          });

        if (clickError) {
          console.error('Error logging click:', clickError);
          setError('Failed to process click');
          return;
        }

        // Get offer URL for redirect
        const offerUrl = linkData.offers.url;
        
        // Build redirect URL with parameters
        const redirectUrl = new URL(offerUrl);
        redirectUrl.searchParams.append('clickId', clickId);
        
        // Add custom parameters if available
        if (linkData.custom_params) {
          Object.entries(linkData.custom_params).forEach(([key, value]) => {
            redirectUrl.searchParams.append(key, value as string);
          });
        }

        // Redirect to advertiser URL
        window.location.href = redirectUrl.toString();
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
