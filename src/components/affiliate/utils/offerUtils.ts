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
  if (!trackingCode) return '';
  
  const baseUrl = window.location.origin;
  // Clean the code first
  const cleanCode = trackingCode.trim().replace(/[^\x20-\x7E]/g, '');
  
  // Use consistent encoding
  const encodedCode = encodeURIComponent(cleanCode);
  
  // Log the transformation for debugging
  console.log('Tracking URL generation:', {
    original: trackingCode,
    cleaned: cleanCode,
    encoded: encodedCode,
    fullUrl: `${baseUrl}/r/${encodedCode}`
  });
  
  return `${baseUrl}/r/${encodedCode}`;
};
