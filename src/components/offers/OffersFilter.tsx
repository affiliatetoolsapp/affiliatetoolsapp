import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Search, DollarSign, Globe, Target, BarChart, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Offer } from '@/types';

export interface FilterOptions {
  niche: string[];
  payoutMin: number | null;
  payoutMax: number | null;
  offerTypes: string[];
  geos: string[];
  trafficTypes: string[];
  status: string[];
}

interface OffersFilterProps {
  offers: Offer[];
  onFilterChange: (filters: FilterOptions) => void;
  className?: string;
  align?: 'start' | 'end';
}

// Helper function to get unique values from offers
function getUniqueValues(offers: Offer[], key: keyof Offer): string[] {
  const values = new Set<string>();
  
  offers.forEach(offer => {
    const value = offer[key];
    if (Array.isArray(value)) {
      value.forEach(v => values.add(v));
    } else if (value) {
      values.add(value.toString());
    }
  });
  
  return Array.from(values).sort();
}

interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function FilterSection({ title, icon, children }: FilterSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{title}</span>
      </div>
      {children}
      <Separator />
    </div>
  );
}

interface FilterOptionsListProps {
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  searchPlaceholder: string;
}

function FilterOptionsList({ options, selected, onChange, searchPlaceholder }: FilterOptionsListProps) {
  const [search, setSearch] = React.useState('');

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (option: string) => {
    const newValue = selected.includes(option)
      ? selected.filter(v => v !== option)
      : [...selected, option];
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>
      <ScrollArea className="h-[180px]">
        <div className="space-y-1">
          {filteredOptions.map((option) => (
            <Button
              key={option}
              variant={selected.includes(option) ? "default" : "ghost"}
              size="sm"
              onClick={() => toggleOption(option)}
              className="w-full justify-start font-normal"
            >
              {option}
              {selected.includes(option) && (
                <X className="ml-auto h-4 w-4" />
              )}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function OffersFilter({ offers, onFilterChange, className, align = 'end' }: OffersFilterProps) {
  const [filters, setFilters] = React.useState<FilterOptions>({
    niche: [],
    payoutMin: null,
    payoutMax: null,
    offerTypes: [],
    geos: [],
    trafficTypes: [],
    status: []
  });

  // Get unique values from offers
  const niches = getUniqueValues(offers, 'niche');
  const offerTypes = getUniqueValues(offers, 'commission_type');
  const geos = getUniqueValues(offers, 'geo_targets');
  const trafficTypes = getUniqueValues(offers, 'allowed_traffic_sources');
  const statuses = getUniqueValues(offers, 'status');

  // Get min/max payout values
  const payouts = offers.map(offer => {
    const amount = offer.commission_type === 'RevShare'
      ? Number(offer.commission_percent)
      : Number(offer.commission_amount);
    return isNaN(amount) ? 0 : amount;
  });
  const minPayout = Math.min(...payouts);
  const maxPayout = Math.max(...payouts);

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const clearFilters = () => {
    const emptyFilters: FilterOptions = {
      niche: [],
      payoutMin: null,
      payoutMax: null,
      offerTypes: [],
      geos: [],
      trafficTypes: [],
      status: []
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const activeFilterCount = Object.values(filters).reduce((count, value) => {
    if (Array.isArray(value)) {
      return count + (value.length > 0 ? 1 : 0);
    }
    return count + (value ? 1 : 0);
  }, 0);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:w-[480px] lg:w-[580px]">
          <SheetHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <SheetTitle>Filters</SheetTitle>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Reset filters
                  <X className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {activeFilterCount === 0 ? (
                "No active filters"
              ) : (
                `${activeFilterCount} active ${activeFilterCount === 1 ? 'filter' : 'filters'}`
              )}
            </div>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="space-y-6 py-6">
              {/* Commission Range */}
              {payouts.length > 0 && (
                <FilterSection title="Commission Range" icon={<DollarSign className="h-4 w-4" />}>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder={`Min (${minPayout})`}
                      value={filters.payoutMin || ''}
                      onChange={(e) => handleFilterChange({ payoutMin: parseFloat(e.target.value) || null })}
                      className="w-full"
                      min={minPayout}
                      max={maxPayout}
                    />
                    <span>to</span>
                    <Input
                      type="number"
                      placeholder={`Max (${maxPayout})`}
                      value={filters.payoutMax || ''}
                      onChange={(e) => handleFilterChange({ payoutMax: parseFloat(e.target.value) || null })}
                      className="w-full"
                      min={minPayout}
                      max={maxPayout}
                    />
                  </div>
                </FilterSection>
              )}

              {/* Niche Filter */}
              {niches.length > 0 && (
                <FilterSection title="Niche" icon={<Tag className="h-4 w-4" />}>
                  <FilterOptionsList
                    options={niches}
                    selected={filters.niche}
                    onChange={(value) => handleFilterChange({ niche: value })}
                    searchPlaceholder="Search niches..."
                  />
                </FilterSection>
              )}

              {/* Offer Types */}
              {offerTypes.length > 0 && (
                <FilterSection title="Offer Type" icon={<BarChart className="h-4 w-4" />}>
                  <FilterOptionsList
                    options={offerTypes}
                    selected={filters.offerTypes}
                    onChange={(value) => handleFilterChange({ offerTypes: value })}
                    searchPlaceholder="Search offer types..."
                  />
                </FilterSection>
              )}

              {/* Geos */}
              {geos.length > 0 && (
                <FilterSection title="Targeting (Geos)" icon={<Globe className="h-4 w-4" />}>
                  <FilterOptionsList
                    options={geos}
                    selected={filters.geos}
                    onChange={(value) => handleFilterChange({ geos: value })}
                    searchPlaceholder="Search countries..."
                  />
                </FilterSection>
              )}

              {/* Traffic Types */}
              {trafficTypes.length > 0 && (
                <FilterSection title="Traffic Types" icon={<Target className="h-4 w-4" />}>
                  <FilterOptionsList
                    options={trafficTypes}
                    selected={filters.trafficTypes}
                    onChange={(value) => handleFilterChange({ trafficTypes: value })}
                    searchPlaceholder="Search traffic types..."
                  />
                </FilterSection>
              )}

              {/* Status */}
              {statuses.length > 0 && (
                <FilterSection title="Status" icon={<Filter className="h-4 w-4" />}>
                  <FilterOptionsList
                    options={statuses}
                    selected={filters.status}
                    onChange={(value) => handleFilterChange({ status: value })}
                    searchPlaceholder="Search status..."
                  />
                </FilterSection>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
} 