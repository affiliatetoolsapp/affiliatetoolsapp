
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Check if this is running in a browser environment
    if (typeof window !== 'undefined') {
      // Check user agent for mobile devices
      const checkUserAgent = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = [
          'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 
          'iemobile', 'opera mini', 'mobile', 'tablet'
        ];
        return mobileKeywords.some(keyword => userAgent.includes(keyword));
      }
      
      // Set initial value based on both width and user agent
      const updateMobileState = () => {
        const isMobileWidth = window.innerWidth < MOBILE_BREAKPOINT;
        const isMobileAgent = checkUserAgent();
        setIsMobile(isMobileWidth || isMobileAgent);
        console.log(`Mobile detection: width=${isMobileWidth}, agent=${isMobileAgent}, userAgent=${navigator.userAgent}, combined=${isMobileWidth || isMobileAgent}`);
      }
      
      // Set initial state
      updateMobileState();
      
      // Add resize listener
      window.addEventListener('resize', updateMobileState);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', updateMobileState);
      }
    } else {
      // Default to false when not in browser
      setIsMobile(false);
    }
  }, []);

  return isMobile;
}
