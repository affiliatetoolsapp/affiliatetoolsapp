
import { Offer } from '@/types';

/**
 * Get emoji flag for country code
 */
export const getCountryFlag = (countryCode: string): string => {
  // Convert country code to regional indicator symbols
  // Each country code letter is transformed to a regional indicator symbol (emoji)
  if (!countryCode || countryCode.length !== 2) return '🌎'; // World emoji for invalid codes
  
  // For country codes, convert to uppercase and get the regional indicator symbols
  // Regional indicator symbols are formed by taking the Unicode value of each letter,
  // subtracting the Unicode value of 'A', and adding the Unicode value of the regional indicator 'A' (0x1F1E6)
  const firstLetter = countryCode.toUpperCase().charCodeAt(0) - 65 + 0x1F1E6;
  const secondLetter = countryCode.toUpperCase().charCodeAt(1) - 65 + 0x1F1E6;
  
  // Convert the Unicode values to characters and combine them
  return String.fromCodePoint(firstLetter) + String.fromCodePoint(secondLetter);
};

/**
 * Format geo targets for display with emoji flags
 */
export const formatGeoTargets = (offer: Offer): Array<{ flag: string; code: string }> => {
  if (!offer.geo_targets) return [{ flag: '🌎', code: 'WW' }]; // Always return an array
  
  try {
    // If geo_targets is a string, try to parse it
    const geoObj = typeof offer.geo_targets === 'string' 
      ? JSON.parse(offer.geo_targets) 
      : offer.geo_targets;
    
    // If it's an empty object or not actually containing country data
    if (!geoObj || Object.keys(geoObj).length === 0) {
      return [{ flag: '🌎', code: 'WW' }]; // Always return an array
    }
    
    // Handle arrays directly
    if (Array.isArray(geoObj)) {
      return geoObj.map(item => ({
        code: String(item),
        flag: getCountryFlag(String(item))
      }));
    }
    
    // Handle objects
    return Object.keys(geoObj).map(code => ({
      code,
      flag: getCountryFlag(code)
    }));
  } catch (e) {
    console.error("Error parsing geo targets:", e);
    return [{ flag: '🌎', code: 'WW' }]; // Always return an array on error
  }
};

/**
 * Format a tracking URL
 */
export const formatTrackingUrl = (trackingCode: string) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/r/${trackingCode}`;
};
