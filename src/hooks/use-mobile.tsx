
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Check if this is running in a browser environment
    if (typeof window !== 'undefined') {
      // Initial check
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      
      // Check user agent for mobile devices
      const checkUserAgent = () => {
        const userAgent = navigator.userAgent;
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        return mobileRegex.test(userAgent);
      }
      
      // Set initial value based on both width and user agent
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT || checkUserAgent())
      
      // Add resize listener
      const handleResize = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT || checkUserAgent())
      }
      
      window.addEventListener('resize', handleResize)
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  return isMobile
}
