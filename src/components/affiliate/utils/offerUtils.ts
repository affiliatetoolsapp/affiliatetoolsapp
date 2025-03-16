import { Offer } from '@/types';

/**
 * Format geo targets for display
 */
export const formatGeoTargets = (offer: Offer) => {
  if (!offer.geo_targets) return ["Worldwide"];
  
  try {
    // If geo_targets is a string, try to parse it
    const geoObj = typeof offer.geo_targets === 'string' 
      ? JSON.parse(offer.geo_targets) 
      : offer.geo_targets;
    
    // If it's an empty object or not actually containing country data
    if (!geoObj || Object.keys(geoObj).length === 0) {
      return ["Worldwide"];
    }
    
    // Handle arrays directly
    if (Array.isArray(geoObj)) {
      return geoObj.map(item => String(item));
    }
    
    // Handle objects
    return Object.keys(geoObj);
  } catch (e) {
    console.error("Error parsing geo targets:", e);
    return ["Worldwide"];
  }
};

/**
 * Format a tracking URL with proper encoding
 */
export const formatTrackingUrl = (trackingCode: string) => {
  const baseUrl = window.location.origin;
  // Ensure the tracking code is properly encoded for URLs
  const encodedCode = encodeURIComponent(trackingCode.trim());
  return `${baseUrl}/r/${encodedCode}`;
};
