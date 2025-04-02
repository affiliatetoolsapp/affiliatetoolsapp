
import { useState, useEffect } from 'react';
import { Offer } from '@/types';
import { FilterOptions } from '@/components/offers/OffersFilter';

export const useOfferFilters = (offers: Offer[], filters: FilterOptions) => {
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>(offers);

  useEffect(() => {
    if (!offers) {
      setFilteredOffers([]);
      return;
    }
    
    let result = [...offers];

    // Filter by niche
    if (filters.niche && filters.niche.length > 0) {
      result = result.filter(offer => 
        offer.niche && filters.niche.includes(offer.niche.toLowerCase())
      );
    }

    // Filter by payout range
    if (filters.payoutMin !== null) {
      result = result.filter(offer => {
        const amount = Number(offer.commission_amount);
        return !isNaN(amount) && amount >= (Number(filters.payoutMin) || 0);
      });
    }
    
    if (filters.payoutMax !== null) {
      result = result.filter(offer => {
        const amount = Number(offer.commission_amount);
        return !isNaN(amount) && amount <= (Number(filters.payoutMax) || Infinity);
      });
    }

    // Filter by commission types
    if (filters.offerTypes && filters.offerTypes.length > 0) {
      result = result.filter(offer => 
        offer.commission_type && filters.offerTypes.includes(offer.commission_type)
      );
    }

    // Filter by geo targets
    if (filters.geos && filters.geos.length > 0) {
      result = result.filter(offer => {
        if (!offer.geo_targets) return false;
        
        // Handle array geo_targets
        if (Array.isArray(offer.geo_targets)) {
          return offer.geo_targets.some(geo => filters.geos.includes(geo));
        }
        
        // Handle object geo_targets
        if (typeof offer.geo_targets === 'object') {
          return Object.keys(offer.geo_targets).some(geo => filters.geos.includes(geo));
        }
        
        return false;
      });
    }

    // Filter by allowed traffic sources
    if (filters.trafficTypes && filters.trafficTypes.length > 0) {
      result = result.filter(offer => {
        if (!offer.allowed_traffic_sources) return false;
        return offer.allowed_traffic_sources.some(source => 
          filters.trafficTypes.includes(source)
        );
      });
    }

    // Filter by status
    if (filters.status && filters.status.length > 0) {
      result = result.filter(offer => 
        offer.status && filters.status.includes(offer.status)
      );
    }

    setFilteredOffers(result);
  }, [offers, filters]);

  return filteredOffers;
};

export default useOfferFilters;
