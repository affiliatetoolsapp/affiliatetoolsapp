
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Check if this is running in a browser environment
    if (typeof window !== 'undefined') {
      // Comprehensive mobile device detection
      const checkUserAgent = () => {
        if (!navigator) return false;
        
        const userAgent = navigator.userAgent || '';
        // More comprehensive list of mobile device indicators
        const mobileKeywords = [
          'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 
          'iemobile', 'opera mini', 'mobile', 'tablet', 'smartphone',
          'windows phone', 'silk', 'kindle', 'playbook', 'bb10', 'rim tablet',
          'meego', 'netfront', 'symbian', 'ucbrowser', 'fennec'
        ];
        
        // Check if any of the mobile keywords are in the user agent
        const hasMobileKeyword = mobileKeywords.some(keyword => 
          userAgent.toLowerCase().includes(keyword)
        );
        
        // Additional check for mobile using matchMedia if available
        const hasTouchScreen = (
          'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0
        );
        
        // Check for tablet-specific indicators
        const isTablet = 
          /(ipad|tablet|playbook|silk|(android(?!.*mobile)))/i.test(userAgent.toLowerCase());
        
        return hasMobileKeyword || hasTouchScreen || isTablet;
      };

      // Set initial value based on both width and user agent
      const updateMobileState = () => {
        const isMobileWidth = window.innerWidth < MOBILE_BREAKPOINT;
        const isMobileAgent = checkUserAgent();
        
        // Always prioritize user agent detection for more accurate results
        const finalIsMobile = isMobileAgent || isMobileWidth;
        
        setIsMobile(finalIsMobile);
        
        console.log(`Mobile detection details:
          - Width-based (< ${MOBILE_BREAKPOINT}px): ${isMobileWidth}
          - User-agent-based: ${isMobileAgent}
          - Final determination: ${finalIsMobile}
          - User Agent string: ${navigator.userAgent}
          - Max touch points: ${navigator.maxTouchPoints || 'N/A'}
          - Screen width: ${window.innerWidth}px`);
      };
      
      // Set initial state
      updateMobileState();
      
      // Add resize listener
      window.addEventListener('resize', updateMobileState);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', updateMobileState);
      };
    } else {
      // Default to false when not in browser
      setIsMobile(false);
    }
  }, []);

  return isMobile;
}
