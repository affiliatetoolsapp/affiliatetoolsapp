import { Database } from '@/integrations/supabase/types';

type Offer = Database['public']['Tables']['offers']['Row'];

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
  if (!offer.geo_targets) return []; // Return empty array if no geo_targets
  
  try {
    let geoCodesArray: string[] = [];
    
    // Handle different types of geo_targets
    if (typeof offer.geo_targets === 'string') {
      try {
        // Try to parse it as JSON string first
        const parsed = JSON.parse(offer.geo_targets);
        if (Array.isArray(parsed)) {
          // It's a JSON array string
          geoCodesArray = parsed.map(item => String(item));
        } else if (typeof parsed === 'object' && parsed !== null) {
          // It's a JSON object string
          geoCodesArray = Object.keys(parsed);
        } else {
          // Single value JSON that isn't an object/array
          geoCodesArray = [String(offer.geo_targets)];
        }
      } catch (e) {
        // It's a plain string, not JSON
        geoCodesArray = [offer.geo_targets];
      }
    } else if (Array.isArray(offer.geo_targets)) {
      // It's already an array, but ensure all elements are strings
      geoCodesArray = offer.geo_targets.map(item => String(item));
    } else if (typeof offer.geo_targets === 'object' && offer.geo_targets !== null) {
      // It's an object, use its keys as codes
      geoCodesArray = Object.keys(offer.geo_targets);
    }
    
    // Map the codes to objects with flags
    return geoCodesArray.map(code => ({
      code: String(code).toUpperCase(),
      flag: getCountryFlag(String(code))
    }));
  } catch (e) {
    console.error("Error processing geo targets:", e);
    // If all else fails, handle as a simple string if possible
    if (typeof offer.geo_targets === 'string') {
      return [{
        code: offer.geo_targets.toUpperCase(),
        flag: getCountryFlag(offer.geo_targets)
      }];
    }
    return []; // Return empty array on other errors
  }
};

/**
 * Format a tracking URL
 */
export const formatTrackingUrl = (trackingCode: string) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/r/${trackingCode}`;
};

/**
 * Get country filter options with flags
 */
export const getCountryFilterOptions = () => {
  const countries = [
    { value: 'US', label: 'United States' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'IT', label: 'Italy' },
    { value: 'ES', label: 'Spain' },
    { value: 'BR', label: 'Brazil' },
    { value: 'MX', label: 'Mexico' },
    { value: 'IN', label: 'India' },
    { value: 'JP', label: 'Japan' },
    { value: 'KR', label: 'South Korea' },
    { value: 'RU', label: 'Russia' },
    { value: 'CN', label: 'China' },
    { value: 'ZA', label: 'South Africa' },
    { value: 'NG', label: 'Nigeria' },
    { value: 'EG', label: 'Egypt' },
    { value: 'SA', label: 'Saudi Arabia' },
    { value: 'AE', label: 'United Arab Emirates' },
  ];
  
  return countries.map(country => ({
    ...country,
    label: `${getCountryFlag(country.value)} ${country.label}`
  }));
};
