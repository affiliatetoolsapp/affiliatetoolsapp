
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import { toast } from 'sonner';

export function useReportData(userId: string | undefined, userRole: string | undefined, dateRangeStr: string, selectedType: string) {
  const isAdvertiser = userRole === 'advertiser';
  
  // Calculate date range
  const endDate = new Date();
  const startDate = subDays(endDate, parseInt(dateRangeStr || '7'));
  
  // Debug function for development
  useEffect(() => {
    const debugClicksData = async () => {
      if (!userId || !userRole) return;
      
      try {
        console.log(`DEBUG: Fetching all clicks for user role: ${userRole}, user ID: ${userId}`);
        
        // For debugging: get all clicks in the database without filtering
        const { data: allClicks, error: allClicksError } = await supabase
          .from('clicks')
          .select('*')
          .limit(50);
          
        if (allClicksError) {
          console.error('DEBUG: Error fetching all clicks:', allClicksError);
        } else {
          console.log(`DEBUG: Total clicks in database (limited to 50): ${allClicks?.length || 0}`);
          console.log('DEBUG: Sample clicks:', allClicks?.slice(0, 3));
        }
      } catch (err) {
        console.error('DEBUG: Error in debug function:', err);
      }
    };
    
    if (process.env.NODE_ENV !== 'production') {
      debugClicksData();
    }
  }, [userId, userRole]);
  
  // Fetch clicks
  const { 
    data: clicks, 
    isLoading: isLoadingClicks, 
    refetch: refetchClicks 
  } = useQuery({
    queryKey: ['report-clicks', userId, userRole, dateRangeStr],
    queryFn: async () => {
      if (!userId || !userRole) return [];
      
      try {
        console.log('Fetching clicks with parameters:', {
          userId,
          userRole,
          dateRange: dateRangeStr,
          startDate: startOfDay(startDate).toISOString(),
          endDate: endOfDay(endDate).toISOString()
        });
        
        let query;
        
        if (isAdvertiser) {
          // For advertisers - get clicks for offers they created
          console.log('Fetching clicks for advertiser:', userId);
          
          // First, get the offers created by this advertiser
          const { data: advertiserOffers, error: offersError } = await supabase
            .from('offers')
            .select('id')
            .eq('advertiser_id', userId);
            
          if (offersError) {
            console.error('Error fetching advertiser offers:', offersError);
            throw offersError;
          }
          
          if (!advertiserOffers || advertiserOffers.length === 0) {
            console.log('No offers found for this advertiser');
            return [];
          }
          
          const offerIds = advertiserOffers.map(offer => offer.id);
          console.log('Advertiser offer IDs:', offerIds);
          
          // Then get clicks for these offers
          query = supabase
            .from('clicks')
            .select(`
              *,
              offers(*)
            `)
            .in('offer_id', offerIds)
            .gte('created_at', startOfDay(startDate).toISOString())
            .lte('created_at', endOfDay(endDate).toISOString());
        } else {
          // For affiliates - get clicks for their tracking links
          console.log('Fetching clicks for affiliate:', userId);
          
          query = supabase
            .from('clicks')
            .select(`
              *,
              offers(*)
            `)
            .eq('affiliate_id', userId)
            .gte('created_at', startOfDay(startDate).toISOString())
            .lte('created_at', endOfDay(endDate).toISOString());
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching clicks:', error);
          throw error;
        }
        
        console.log(`Found ${data?.length || 0} clicks for the period`);
        if (data && data.length > 0) {
          console.log('Sample data:', data.slice(0, 2));
        } else {
          console.log('No clicks found for the selected period');
        }
        
        return data || [];
      } catch (error) {
        console.error('Error processing clicks:', error);
        toast.error('Failed to load click data');
        return [];
      }
    },
    enabled: !!userId && !!userRole,
  });
  
  // Fetch conversions
  const { 
    data: conversions, 
    isLoading: isLoadingConversions,
    refetch: refetchConversions
  } = useQuery({
    queryKey: ['report-conversions', userId, userRole, dateRangeStr, selectedType],
    queryFn: async () => {
      if (!userId || !userRole) return [];
      
      try {
        console.log('Fetching conversions with filters:', {
          startDate: startOfDay(startDate).toISOString(),
          endDate: endOfDay(endDate).toISOString(),
          selectedType,
          isAdvertiser
        });
        
        if (isAdvertiser) {
          // For advertisers
          const { data: advertiserOffers, error: offersError } = await supabase
            .from('offers')
            .select('id')
            .eq('advertiser_id', userId);
            
          if (offersError) {
            console.error('Error fetching advertiser offers for conversions:', offersError);
            throw offersError;
          }
          
          if (!advertiserOffers || advertiserOffers.length === 0) {
            console.log('No offers found for this advertiser when fetching conversions');
            return [];
          }
          
          const offerIds = advertiserOffers.map(offer => offer.id);
          
          // Get clicks for these offers
          const { data: offerClicks, error: clicksError } = await supabase
            .from('clicks')
            .select('click_id')
            .in('offer_id', offerIds);
            
          if (clicksError) {
            console.error('Error fetching clicks for advertiser offers:', clicksError);
            throw clicksError;
          }
          
          if (!offerClicks || offerClicks.length === 0) {
            console.log('No clicks found for this advertiser\'s offers');
            return [];
          }
          
          const clickIds = offerClicks.map(click => click.click_id);
          
          // Get conversions for these clicks
          let query = supabase
            .from('conversions')
            .select(`
              *,
              click:clicks!inner(
                id, click_id, affiliate_id, offer_id, 
                tracking_code, created_at, ip_address, device, geo,
                offers(id, name, advertiser_id, commission_type)
              )
            `)
            .in('click_id', clickIds)
            .gte('created_at', startOfDay(startDate).toISOString())
            .lte('created_at', endOfDay(endDate).toISOString());
            
          if (selectedType !== 'all') {
            query = query.eq('event_type', selectedType);
          }
          
          const { data, error } = await query;
          
          if (error) {
            console.error('Error fetching conversions for advertiser:', error);
            throw error;
          }
          
          console.log(`Found ${data?.length || 0} conversions for advertiser`);
          return data || [];
        } else {
          // For affiliates
          const { data: affiliateClicks, error: clicksError } = await supabase
            .from('clicks')
            .select('click_id')
            .eq('affiliate_id', userId);
            
          if (clicksError) {
            console.error('Error fetching affiliate clicks:', clicksError);
            throw clicksError;
          }
          
          if (!affiliateClicks || affiliateClicks.length === 0) {
            console.log('No clicks found for this affiliate');
            return [];
          }
          
          const clickIds = affiliateClicks.map(click => click.click_id);
          
          // Get conversions for these clicks
          let query = supabase
            .from('conversions')
            .select(`
              *,
              click:clicks!inner(
                id, click_id, affiliate_id, offer_id, 
                tracking_code, created_at, ip_address, device, geo,
                offers(id, name, advertiser_id, commission_type)
              )
            `)
            .in('click_id', clickIds)
            .gte('created_at', startOfDay(startDate).toISOString())
            .lte('created_at', endOfDay(endDate).toISOString());
            
          if (selectedType !== 'all') {
            query = query.eq('event_type', selectedType);
          }
          
          const { data, error } = await query;
          
          if (error) {
            console.error('Error fetching conversions for affiliate:', error);
            throw error;
          }
          
          console.log(`Found ${data?.length || 0} conversions for affiliate`);
          return data || [];
        }
      } catch (error) {
        console.error('Error processing conversions:', error);
        toast.error('Failed to load conversion data');
        return [];
      }
    },
    enabled: !!userId && !!userRole,
  });
  
  // Prepare chart data
  const prepareChartData = () => {
    if (!clicks) return [];
    
    // Create an array of all days in the date range
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Initialize the data array with counts of 0
    const data = days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return {
        date: dateStr,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        commissions: 0,
      };
    });
    
    // Count clicks by day
    clicks.forEach(click => {
      const clickDate = format(parseISO(click.created_at), 'yyyy-MM-dd');
      const dataPoint = data.find(d => d.date === clickDate);
      if (dataPoint) {
        dataPoint.clicks += 1;
      }
    });
    
    // Count conversions and sum revenue/commissions by day
    if (conversions) {
      conversions.forEach(conv => {
        // Find associated click to get date
        const clickData = conv.click as any;
        if (clickData) {
          const clickDate = format(parseISO(clickData.created_at), 'yyyy-MM-dd');
          const dataPoint = data.find(d => d.date === clickDate);
          if (dataPoint) {
            dataPoint.conversions += 1;
            dataPoint.revenue += conv.revenue || 0;
            dataPoint.commissions += conv.commission || 0;
          }
        }
      });
    }
    
    // Format dates for display
    return data.map(item => ({
      ...item,
      date: format(new Date(item.date), 'MMM dd'),
      revenue: parseFloat(item.revenue.toFixed(2)),
      commissions: parseFloat(item.commissions.toFixed(2)),
    }));
  };
  
  const chartData = prepareChartData();
  
  // Calculate totals
  const totalClicks = clicks?.length || 0;
  const totalConversions = conversions?.length || 0;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const totalRevenue = conversions?.reduce((sum, conv) => sum + (conv.revenue || 0), 0) || 0;
  const totalCommissions = conversions?.reduce((sum, conv) => sum + (conv.commission || 0), 0) || 0;
  
  const isLoading = isLoadingClicks || isLoadingConversions;
  
  const refetchData = () => {
    refetchClicks();
    refetchConversions();
  };
  
  return {
    clicks,
    conversions,
    isLoading,
    chartData,
    totalClicks,
    totalConversions,
    conversionRate,
    totalRevenue,
    totalCommissions,
    startDate,
    endDate,
    refetchData
  };
}
