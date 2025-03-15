
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
          .select('*, affiliate_offers!inner(*), offers(*)')
          .eq('tracking_code', trackingCode)
          .maybeSingle();

        if (linkError || !linkData) {
          console.error('Link fetch error:', linkError);
          setError('Link not found or expired');
          return;
        }

        console.log('Retrieved tracking link data:', linkData);

        // Check if affiliate is approved for this offer
        if (linkData.affiliate_offers.status !== 'approved') {
          setError('This affiliate is not approved for this offer');
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
        
        // Custom params
        const customParams: Record<string, string> = {
          browser,
          os
        };
        
        // Add custom parameters if available
        if (linkData.custom_params) {
          Object.assign(customParams, linkData.custom_params);
        }
        
        const clickData = {
          click_id: clickId,
          tracking_code: trackingCode,
          affiliate_id: linkData.affiliate_id,
          offer_id: linkData.offer_id,
          ip_address: ipInfo?.ip || null,
          user_agent: userAgent,
          device,
          geo: ipInfo?.country || null,
          referrer: document.referrer,
          custom_params: Object.keys(customParams).length > 0 ? customParams : null,
          created_at: new Date().toISOString()
        };
        
        console.log('Logging click with data:', clickData);

        // Log click
        const { error: clickError } = await supabase
          .from('clicks')
          .insert(clickData);

        if (clickError) {
          console.error('Error logging click:', clickError);
          // Continue despite the error to not block the user experience
          // But let's try to get more information about the error
          console.error('Error details:', JSON.stringify(clickError));
        } else {
          console.log('Click successfully logged to database');
        }

        // Check if this is a CPC offer and credit the affiliate immediately
        if (linkData.offers.commission_type === 'CPC' && linkData.offers.commission_amount) {
          const { data: walletData, error: walletError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', linkData.affiliate_id)
            .maybeSingle();
          
          if (walletError) {
            console.error('Error fetching wallet:', walletError);
          } else if (walletData) {
            // Update wallet with the CPC amount
            const { error: walletUpdateError } = await supabase
              .from('wallets')
              .update({
                pending: walletData.pending + linkData.offers.commission_amount,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', linkData.affiliate_id);
            
            if (walletUpdateError) {
              console.error('Error updating wallet:', walletUpdateError);
            } else {
              // Create a conversion record for CPC
              const { error: conversionError } = await supabase
                .from('conversions')
                .insert({
                  click_id: clickId,
                  event_type: 'click',
                  commission: linkData.offers.commission_amount,
                  status: 'pending',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
              
              if (conversionError) {
                console.error('Error creating conversion record:', conversionError);
              } else {
                console.log('CPC commission credited:', linkData.offers.commission_amount);
              }
            }
          }
        }

        // Get offer URL for redirect
        const offerUrl = linkData.offers.url;
        
        // Build redirect URL with parameters
        const redirectUrl = new URL(offerUrl);
        
        // Add the clickId and IDs to help with tracking
        redirectUrl.searchParams.append('clickId', clickId);
        redirectUrl.searchParams.append('affiliateId', linkData.affiliate_id);
        redirectUrl.searchParams.append('offerId', linkData.offer_id);
        
        // Add custom parameters if available
        if (customParams) {
          Object.entries(customParams).forEach(([key, value]) => {
            redirectUrl.searchParams.append(key, value as string);
          });
        }

        console.log(`Redirecting to: ${redirectUrl.toString()}`);

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
