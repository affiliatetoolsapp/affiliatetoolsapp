import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Grid, List } from 'lucide-react';

import { useAffiliateQueries } from './hooks/useAffiliateQueries';
import ActiveOffers from './ActiveOffers';
import PendingApplications from './PendingApplications';
import RejectedApplications from './RejectedApplications';
import TrackingLinksTab from './TrackingLinksTab';

export default function AffiliateOffers() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const navigate = useNavigate();
  
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
  
  // Filter offers based on search query
  const filteredApprovedOffers = approvedOffers?.filter(item => 
    item.offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.offer.niche?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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
      
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search" 
            placeholder="Search your offers..." 
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
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
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="sm" 
            className="rounded-l-none" 
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
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
            offers={filteredApprovedOffers || []}
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
