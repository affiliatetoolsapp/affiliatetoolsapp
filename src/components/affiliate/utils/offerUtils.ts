
import { Offer, CountryOption } from '@/types';

export const formatGeoTargets = (offer: Offer | { geo_targets?: any }): CountryOption[] => {
  if (!offer.geo_targets || !Array.isArray(offer.geo_targets) || offer.geo_targets.length === 0) {
    return [];
  }
  
  return offer.geo_targets.map(code => ({
    code,
    name: getCountryName(code),
    flag: getCountryFlag(code)
  }));
};

export const getCountryFlag = (countryCode: string): string => {
  // Simple lookup for country flags using emoji
  const baseOffset = 127397; // Unicode offset for regional indicator symbols
  const chars = [...countryCode.toUpperCase()];
  
  // Convert chars to regional indicator symbols
  return chars
    .map(char => String.fromCodePoint(char.charCodeAt(0) + baseOffset))
    .join('');
};

export const getCountryName = (countryCode: string): string => {
  // This is a simplified function - in a real app, 
  // you would use a complete country names database
  const countryNames: Record<string, string> = {
    US: 'United States',
    UK: 'United Kingdom',
    CA: 'Canada',
    AU: 'Australia',
    DE: 'Germany',
    FR: 'France',
    JP: 'Japan',
    CN: 'China',
    IN: 'India',
    BR: 'Brazil',
    // Add more as needed
  };
  
  return countryNames[countryCode] || countryCode;
};
