
import { useOfferFilters } from "./useOfferFilters";
import { Offer } from "@/types";
import { FilterOptions } from "@/components/offers/OffersFilter";
import { useState, useEffect } from "react";

// This adapter returns Offer[] instead of the previous object
// to maintain backward compatibility with existing components
export const useOfferFiltersAdapter = (offers: Offer[], filters: FilterOptions): Offer[] => {
  const filteredOffers = useOfferFilters(offers, filters);
  return filteredOffers;
};
