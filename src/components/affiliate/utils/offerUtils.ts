
import { Offer, GeoCommission, CountryOption } from '@/types';
import countryCodes from '../../offers/countryCodes';

export const formatGeoTargets = (offer: Offer | { geo_targets?: any }): string[] => {
  if (!offer || !offer.geo_targets) return [];

  let geoArray: string[] = [];

  // Handle different forms of geo_targets
  if (Array.isArray(offer.geo_targets)) {
    geoArray = offer.geo_targets;
  } else if (typeof offer.geo_targets === 'object') {
    geoArray = Object.keys(offer.geo_targets);
  } else if (typeof offer.geo_targets === 'string') {
    try {
      const parsed = JSON.parse(offer.geo_targets);
      if (Array.isArray(parsed)) {
        geoArray = parsed;
      } else if (typeof parsed === 'object') {
        geoArray = Object.keys(parsed);
      }
    } catch (e) {
      console.error("Error parsing geo_targets:", e);
    }
  }

  return geoArray;
};

export const getCountryFlag = (countryCode: string): string => {
  // Convert country code to flag emoji
  return countryCode.toUpperCase().replace(/./g, char => 
    String.fromCodePoint(char.charCodeAt(0) + 127397)
  );
};

export const getCountryName = (countryCode: string): string => {
  return countryCodes[countryCode] || countryCode;
};

export const formatCountryWithFlag = (countryCode: string): string => {
  return `${getCountryFlag(countryCode)} ${getCountryName(countryCode)}`;
};

export const formatCountryOption = (countryCode: string): CountryOption => {
  return {
    code: countryCode,
    name: getCountryName(countryCode),
    flag: getCountryFlag(countryCode)
  };
};

export const getCountryFilterOptions = (offers: Offer[]) => {
  const allCountries = new Set<string>();
  
  offers.forEach(offer => {
    if (offer.geo_targets && Array.isArray(offer.geo_targets)) {
      offer.geo_targets.forEach(code => allCountries.add(code));
    } else if (offer.geo_targets && typeof offer.geo_targets === 'object') {
      Object.keys(offer.geo_targets).forEach(code => allCountries.add(code));
    }
  });
  
  return Array.from(allCountries).map(code => formatCountryOption(code));
};

export const formatTrackingUrl = (url: string) => {
  if (!url) return '';
  
  const maxLength = 30;
  if (url.length <= maxLength) return url;
  
  return `${url.substring(0, maxLength)}...`;
};
