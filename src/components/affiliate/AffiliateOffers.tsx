import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Grid, Table as TableIcon } from 'lucide-react';

import { useAffiliateQueries } from './hooks/useAffiliateQueries';
import ActiveOffers from './ActiveOffers';
import PendingApplications from './PendingApplications';
import RejectedApplications from './RejectedApplications';
import TrackingLinksTab from './TrackingLinksTab';
import { OffersFilter, FilterOptions } from '@/components/offers/OffersFilter';
import { useOfferFilters } from '@/hooks/useOfferFilters';

export default function AffiliateOffers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filters, setFilters] = useState<FilterOptions>({
    niche: [],
    payoutMin: null,
    payoutMax: null,
    offerTypes: [],
    geos: [],
    trafficTypes: [],
    status: []
  });
  
  // Use our custom hook to fetch all data
  const { 
    approvedOffers,
    pendingApplications,
    rejectedApplications,
    trackingLinks,
    isLoading,
    cancelApplication,
    deleteTrackingLink
  } = useAffiliateQueries(user?.id);

  console.log('Raw approved offers:', approvedOffers);
  
  // Apply both search and filters to offers
  const mappedOffers = React.useMemo(() => {
    if (!approvedOffers) return [];
    
    return approvedOffers.map(ao => {
      if (!ao.offer) {
        console.warn('Missing offer data for:', ao);
        return null;
      }
      
      return {
        id: ao.offer.id || '',
        name: ao.offer.name || '',
        status: ao.offer.status || '',
        description: ao.offer.description || '',
        niche: ao.offer.niche || '',
        commission_type: ao.offer.commission_type || '',
        commission_amount: String(ao.offer.commission_amount || 0),
        commission_percent: String(ao.offer.commission_percent || 0),
        payout_amount: String(ao.offer.commission_amount || 0),
        geo_targets: Array.isArray(ao.offer.geo_targets) ? ao.offer.geo_targets : [],
        geo_commissions: Array.isArray(ao.offer.geo_commissions) ? ao.offer.geo_commissions : [],
        allowed_traffic_sources: Array.isArray(ao.offer.allowed_traffic_sources) ? ao.offer.allowed_traffic_sources : [],
        restricted_geos: Array.isArray(ao.offer.restricted_geos) ? ao.offer.restricted_geos : [],
        offer_image: ao.offer.offer_image || '',
        created_at: ao.offer.created_at || '',
        advertiser_id: ao.offer.advertiser_id || '',
        is_featured: Boolean(ao.offer.is_featured)
      };
    }).filter(Boolean);
  }, [approvedOffers]);

  console.log('Mapped offers:', mappedOffers);

  const filteredApprovedOffers = useOfferFilters(
    mappedOffers.filter(offer => 
      offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.niche?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    filters
  );

  console.log('Filtered offers:', filteredApprovedOffers);
  
  // Handler functions
  const handleViewOfferDetails = (offerId: string) => {
    console.log("[AffiliateOffers] Navigating to offer details:", offerId);
    navigate(`/offers/${offerId}`);
  };
  
  const handleGenerateLinks = (offerId: string) => {
    navigate(`/links?offer=${offerId}`);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Offers</h1>
        <p className="text-muted-foreground">
          Manage your approved offers and tracking links
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 sm:w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search your offers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <OffersFilter
            offers={mappedOffers}
            onFilterChange={setFilters}
          />
          <div className="flex items-center border rounded-md">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-r-none" 
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-l-none" 
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="active">Active Offers</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Applications
            {pendingApplications?.length ? (
              <Badge variant="secondary" className="ml-2">{pendingApplications.length}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="links">My Tracking Links</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <ActiveOffers
            offers={filteredApprovedOffers ?? []}
            viewMode={viewMode}
            isLoading={isLoading}
            onViewOfferDetails={handleViewOfferDetails}
            onGenerateLinks={handleGenerateLinks}
          />
        </TabsContent>
        
        <TabsContent value="pending">
          <PendingApplications
            applications={pendingApplications || []}
            viewMode={viewMode}
            isLoading={isLoading}
            onCancelApplication={cancelApplication}
          />
        </TabsContent>
        
        <TabsContent value="rejected">
          <RejectedApplications
            applications={rejectedApplications || []}
            viewMode={viewMode}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="links">
          <TrackingLinksTab
            links={trackingLinks || []}
            viewMode={viewMode}
            isLoading={isLoading}
            onDeleteLink={deleteTrackingLink}
            onViewOfferDetails={handleViewOfferDetails}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

