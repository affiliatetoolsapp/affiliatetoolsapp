import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Trash2, DollarSign, Percent, Plus } from 'lucide-react';
import countryCodes from './countryCodes';
import { Checkbox } from '@/components/ui/checkbox';
import { GeoCommission } from '@/types';

interface GeoCommissionSelectorProps {
  geoCommissions: GeoCommission[];
  onChange: (commissions: GeoCommission[]) => void;
  onGeoTargetsUpdate: (geoTargets: string[]) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  commissionType: string;
}

const GeoCommissionSelector: React.FC<GeoCommissionSelectorProps> = ({
  geoCommissions,
  onChange,
  onGeoTargetsUpdate,
  enabled,
  onEnabledChange,
  commissionType
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [commissionAmount, setCommissionAmount] = useState<string>('');
  const [commissionPercent, setCommissionPercent] = useState<string>('');
  
  // This effect syncs the geo_targets with the selected countries in geoCommissions
  useEffect(() => {
    if (enabled) {
      const countries = geoCommissions.map(gc => gc.country);
      onGeoTargetsUpdate(countries);
    }
  }, [geoCommissions, onGeoTargetsUpdate, enabled]);
  
  const handleAddCountry = () => {
    if (!selectedCountry) return;
    
    const newCommission: GeoCommission = {
      country: selectedCountry,
      geo: selectedCountry, // For backward compatibility
      commission_amount: 0,
      commission_percent: 0
    };

    if (commissionType === 'RevShare') {
      if (!commissionPercent) return;
      newCommission.commission_percent = Number(commissionPercent);
    } else {
      if (!commissionAmount) return;
      newCommission.commission_amount = Number(commissionAmount);
    }
    
    // Check if country already exists
    const exists = geoCommissions.some(gc => gc.country === selectedCountry);
    if (exists) {
      // Update existing country commission
      const updated = geoCommissions.map(gc => 
        gc.country === selectedCountry ? newCommission : gc
      );
      onChange(updated);
    } else {
      // Add new country
      onChange([...geoCommissions, newCommission]);
    }
    
    // Reset form
    setSelectedCountry('');
    setCommissionAmount('');
    setCommissionPercent('');
  };
  
  const handleRemoveCountry = (country: string) => {
    onChange(geoCommissions.filter(gc => gc.country !== country));
  };
  
  // Get country name from code
  const getCountryName = (code: string): string => {
    const country = countryCodes.find(c => c.code === code);
    return country ? country.name : code;
  };
  
  // Get flag emoji from country code
  const getCountryFlag = (code: string): string => {
    const country = countryCodes.find(c => c.code === code);
    return country ? country.flag : '';
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Checkbox 
          id="geo_pricing" 
          checked={enabled}
          onCheckedChange={(checked) => {
            onEnabledChange(!!checked);
            if (!checked) {
              onChange([]);
              onGeoTargetsUpdate([]);
            }
          }}
        />
        <Label htmlFor="geo_pricing" className="font-medium">
          Enable Country-Specific Pricing
        </Label>
      </div>
      
      {enabled && (
        <>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="country-select">Select Country</Label>
              <Select
                value={selectedCountry}
                onValueChange={setSelectedCountry}
              >
                <SelectTrigger id="country-select">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {countryCodes.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <div className="flex items-center">
                        <span className="mr-2">{country.flag}</span>
                        {country.name} ({country.code})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-1/3">
              <Label htmlFor="commission">
                {commissionType === 'RevShare' ? 'Commission Percentage' : 'Commission Amount'}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  {commissionType === 'RevShare' ? (
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <Input
                  id="commission"
                  value={commissionType === 'RevShare' ? commissionPercent : commissionAmount}
                  onChange={(e) => {
                    if (commissionType === 'RevShare') {
                      setCommissionPercent(e.target.value);
                    } else {
                      setCommissionAmount(e.target.value);
                    }
                  }}
                  type="number"
                  placeholder={commissionType === 'RevShare' ? "0" : "0.00"}
                  min="0"
                  step={commissionType === 'RevShare' ? "1" : "0.01"}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="self-end">
              <Button 
                type="button" 
                onClick={handleAddCountry}
                disabled={!selectedCountry || (commissionType === 'RevShare' ? !commissionPercent : !commissionAmount)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
          
          {geoCommissions.length > 0 && (
            <div className="bg-muted p-3 rounded-md mt-4">
              <p className="text-sm font-medium mb-2">Country-Specific Commissions</p>
              <div className="grid gap-2">
                {geoCommissions.map((gc) => (
                  <div key={gc.country} className="flex items-center justify-between p-2 bg-background rounded border">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getCountryFlag(gc.country)}</span>
                      <span>{getCountryName(gc.country)} ({gc.country})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {commissionType === 'RevShare' 
                          ? `${gc.commission_percent}%`
                          : `$${gc.commission_amount}`
                        }
                      </Badge>
                      <button
                        type="button"
                        onClick={() => handleRemoveCountry(gc.country)}
                        className="text-destructive hover:bg-destructive/10 p-1 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GeoCommissionSelector;
