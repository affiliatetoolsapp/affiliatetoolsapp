
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
import { Trash2, DollarSign, Plus } from 'lucide-react';
import countryCodes from './countryCodes';
import { Checkbox } from '@/components/ui/checkbox';

interface GeoCommission {
  country: string;
  amount: string;
}

interface GeoCommissionSelectorProps {
  geoCommissions: GeoCommission[];
  onChange: (commissions: GeoCommission[]) => void;
  onGeoTargetsUpdate: (geoTargets: string[]) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

const GeoCommissionSelector: React.FC<GeoCommissionSelectorProps> = ({
  geoCommissions,
  onChange,
  onGeoTargetsUpdate,
  enabled,
  onEnabledChange
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  
  // This effect syncs the geo_targets with the selected countries in geoCommissions
  useEffect(() => {
    if (enabled) {
      const countries = geoCommissions.map(gc => gc.country);
      onGeoTargetsUpdate(countries);
    }
  }, [geoCommissions, onGeoTargetsUpdate, enabled]);
  
  const handleAddCountry = () => {
    if (!selectedCountry || !amount) return;
    
    // Check if country already exists
    const exists = geoCommissions.some(gc => gc.country === selectedCountry);
    if (exists) {
      // Update existing country amount
      const updated = geoCommissions.map(gc => 
        gc.country === selectedCountry ? { ...gc, amount } : gc
      );
      onChange(updated);
    } else {
      // Add new country
      onChange([...geoCommissions, { country: selectedCountry, amount }]);
    }
    
    // Reset form
    setSelectedCountry('');
    setAmount('');
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
              <Label htmlFor="amount">Commission Amount</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="self-end">
              <Button 
                type="button" 
                onClick={handleAddCountry}
                disabled={!selectedCountry || !amount}
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
                      <Badge variant="outline">${gc.amount}</Badge>
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
