
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Check if this is running in a browser environment
    if (typeof window !== 'undefined') {
      // Check user agent for mobile devices
      const checkUserAgent = () => {
        const userAgent = navigator.userAgent;
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        return mobileRegex.test(userAgent);
      }
      
      // Set initial value based on both width and user agent
      const updateMobileState = () => {
        const isMobileWidth = window.innerWidth < MOBILE_BREAKPOINT;
        const isMobileAgent = checkUserAgent();
        setIsMobile(isMobileWidth || isMobileAgent);
        console.log(`Mobile detection: width=${isMobileWidth}, agent=${isMobileAgent}, combined=${isMobileWidth || isMobileAgent}`);
      }
      
      // Set initial state
      updateMobileState();
      
      // Add resize listener
      window.addEventListener('resize', updateMobileState);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', updateMobileState);
      }
    }
  }, []);

  return isMobile;
}
