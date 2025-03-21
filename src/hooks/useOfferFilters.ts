import { useMemo } from 'react';
import { Offer } from '@/types';
import { FilterOptions } from '@/components/offers/OffersFilter';

export function useOfferFilters(offers: Offer[], filters: FilterOptions): Offer[] {
  return useMemo(() => {
    if (!offers) return [];
    
    return offers.filter(offer => {
      if (!offer) return false;
      
      // Filter by niche
      if (filters.niche.length > 0 && !filters.niche.includes(offer.niche || '')) {
        return false;
      }

      // Filter by payout range
      const commission = offer.commission_type === 'RevShare'
        ? offer.commission_percent || 0
        : offer.commission_amount || 0;
      if (filters.payoutMin !== null && commission < filters.payoutMin) {
        return false;
      }
      if (filters.payoutMax !== null && commission > filters.payoutMax) {
        return false;
      }

      // Filter by offer types
      if (filters.offerTypes.length > 0 && !filters.offerTypes.includes(offer.commission_type)) {
        return false;
      }

      // Filter by geos
      if (filters.geos.length > 0) {
        const offerGeos = [...(offer.geo_targets || []), ...(offer.restricted_geos || [])];
        if (!filters.geos.some(geo => offerGeos.includes(geo))) {
          return false;
        }
      }

      // Filter by traffic types
      if (filters.trafficTypes.length > 0) {
        const allowedTraffic = offer.allowed_traffic_sources || [];
        if (!filters.trafficTypes.some(type => allowedTraffic.includes(type))) {
          return false;
        }
      }

      // Filter by status
      if (filters.status.length > 0 && !filters.status.includes(offer.status)) {
        return false;
      }

      return true;
    });
  }, [offers, filters]);
} 