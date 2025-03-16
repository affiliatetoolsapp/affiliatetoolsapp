import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

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
        // Log raw tracking code and URL parameters
        console.log('Raw URL parameters:', {
          trackingCode,
          searchParams: Object.fromEntries(searchParams.entries()),
          fullUrl: window.location.href,
          pathname: window.location.pathname
        });

        // First decode the tracking code in case it's URL encoded
        const decodedCode = decodeURIComponent(trackingCode);
        console.log('Decoded tracking code:', {
          original: trackingCode,
          decoded: decodedCode,
          length: decodedCode.length,
          charCodes: Array.from(decodedCode).map(c => c.charCodeAt(0))
        });
        
        // Clean the tracking code to remove any whitespace and non-printable characters
        const cleanedCode = decodedCode.trim().replace(/[^\x20-\x7E]/g, '');
        console.log('Cleaned tracking code:', {
          decoded: decodedCode,
          cleaned: cleanedCode,
          length: cleanedCode.length,
          charCodes: Array.from(cleanedCode).map(c => c.charCodeAt(0))
        });

        // Device detection logging
        console.log('Device information:', {
          isMobile,
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          vendor: navigator.vendor,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight
        });
        
        // Try all possible variations of the code
        const codeVariations = [
          cleanedCode,
          decodedCode,
          trackingCode,
          encodeURIComponent(cleanedCode),
          // Add more variations to handle potential mobile encoding issues
          decodeURIComponent(encodeURIComponent(cleanedCode)), // Handle double encoding
          cleanedCode.toLowerCase(), // Try lowercase
          decodedCode.toLowerCase(), // Try lowercase decoded
          trackingCode.toLowerCase(), // Try lowercase original
        ].filter((code, index, self) => 
          // Remove duplicates and empty/null values
          code && self.indexOf(code) === index
        );
        
        console.log('Attempting code variations:', codeVariations.map(code => ({
          code,
          length: code.length,
          charCodes: Array.from(code).map(c => c.charCodeAt(0))
        })));
        
        let linkData = null;
        let lastError = null;
        let successfulCode = null;
        
        // Try each variation until we find a match
        for (const code of codeVariations) {
          console.log(`Attempting database query with code: '${code}'`);
          
          // Log the exact query parameters
          console.log('Query details:', {
            table: 'tracking_links',
            trackingCode: code,
            trackingCodeType: typeof code,
            trackingCodeLength: code.length,
            trackingCodeChars: Array.from(code).map(c => ({ char: c, code: c.charCodeAt(0) }))
          });
          
          const { data, error } = await supabase
            .from('tracking_links')
            .select(`
              *,
              offers(*)
            `)
            .eq('tracking_code', code)
            .maybeSingle();
            
          console.log(`Query result for code '${code}':`, {
            success: !!data,
            hasError: !!error,
            data: data ? {
              id: data.id,
              tracking_code: data.tracking_code,
              created_at: data.created_at
            } : 'Not found',
            error: error || 'None',
            environment: process.env.NODE_ENV,
            queryTimestamp: new Date().toISOString()
          });
          
          if (data) {
            linkData = data;
            successfulCode = code;
            console.log('Successfully found tracking link with code:', {
              usedCode: code,
              originalCode: trackingCode,
              linkId: data.id,
              offerId: data.offer_id
            });
            break;
          }
          
          if (error) {
            lastError = error;
            console.error(`Error querying with code '${code}':`, error);
          }
        }
        
        if (lastError && !linkData) {
          console.error('Final error fetching tracking link:', {
            error: lastError,
            attemptedCodes: codeVariations
          });
          setError('Error retrieving tracking link: ' + lastError.message);
          setIsLoading(false);
          return;
        }
        
        if (!linkData) {
          console.error('Tracking link not found after trying all variations:', {
            originalCode: trackingCode,
            decodedCode,
            cleanedCode,
            attemptedVariations: codeVariations,
            isMobile,
            userAgent: navigator.userAgent
          });
          setError('Tracking link not found or expired');
          setIsLoading(false);
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
          tracking_code: cleanedCode, // Use cleaned code for consistency
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
        
        // Add clickId and more detailed device info to help with tracking
        redirectUrl += `clickId=${clickId}&device=${device}&platform=${encodeURIComponent(navigator.platform)}&mobile=${isMobile}`;
        
        console.log('Final redirect details:', {
          originalCode: trackingCode,
          successfulCode,
          redirectUrl,
          device,
          isMobile
        });
        
        // Redirect to the offer URL
        window.location.href = redirectUrl;
        
      } catch (error) {
        console.error('Error processing click:', {
          error,
          trackingCode,
          isMobile,
          userAgent: navigator.userAgent
        });
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
