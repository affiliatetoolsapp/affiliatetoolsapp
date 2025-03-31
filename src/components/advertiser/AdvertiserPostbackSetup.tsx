import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, ChevronRight, Clipboard, X } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const POSTBACK_BASE_URL = 'https://jruzfpymzkzegdhmzwsr.supabase.co/functions/v1/postback';

const PREDEFINED_PARAMETERS = [
  { key: 'payout', description: 'Conversion/sale payout amount' },
  { key: 'transaction_id', description: 'Unique transaction identifier' },
  { key: 'amount', description: 'Transaction amount' },
  { key: 'currency', description: 'Transaction currency' },
  { key: 'customer_id', description: 'Customer identifier' },
  { key: 'product_id', description: 'Product identifier' },
  { key: 'campaign_id', description: 'Campaign identifier' },
  { key: 'source', description: 'Traffic source' },
  { key: 'sub1', description: 'Custom sub-affiliate parameter 1' },
  { key: 'sub2', description: 'Custom sub-affiliate parameter 2' },
  { key: 'sub3', description: 'Custom sub-affiliate parameter 3' },
];

export default function AdvertiserPostbackSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [postbackUrl, setPostbackUrl] = useState('');
  const [isCustomParamsOpen, setIsCustomParamsOpen] = useState(false);
  const [customParams, setCustomParams] = useState<{ [key: string]: string }>({});
  const [selectedParam, setSelectedParam] = useState<string>('');
  const [variableName, setVariableName] = useState('');
  
  useEffect(() => {
    setMounted(true);
    setPostbackUrl(`${POSTBACK_BASE_URL}?click_id={click_id}&type={type}&payout={payout}`);
  }, []);
  
  const generateUrlWithParams = (baseUrl: string) => {
    const params: string[] = [];
    
    // Add required params first
    params.push(`click_id={click_id}`);
    params.push(`type={type}`);
    params.push(`payout={payout}`);
    
    // Add custom params
    Object.entries(customParams).forEach(([key, value]) => {
      params.push(`${key}={${value}}`);
    });
    
    const queryString = params.join('&');
    return `${baseUrl}${queryString ? `?${queryString}` : ''}`;
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateUrlWithParams(POSTBACK_BASE_URL));
    toast({
      title: "Copied to clipboard",
      description: "The postback URL has been copied to your clipboard.",
    });
  };

  const handleAddParam = () => {
    if (selectedParam && variableName && !customParams[selectedParam]) {
      setCustomParams(prev => ({
        ...prev,
        [selectedParam]: variableName
      }));
      setSelectedParam('');
      setVariableName('');
    toast({
        title: "Parameter Added",
        description: `Added ${selectedParam} to your postback URL.`,
      });
    }
  };

  const handleRemoveParam = (key: string) => {
    setCustomParams(prev => {
      const newParams = { ...prev };
      delete newParams[key];
      return newParams;
      });
  };
  
  if (!mounted) {
    return (
      <div>
        <h2 className="text-lg font-semibold">Tracking Setup</h2>
        <p className="text-sm text-muted-foreground">Loading postback configuration...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
        <div>
        <h2 className="text-lg font-semibold">Tracking Setup</h2>
        <p className="text-sm text-muted-foreground">Configure your postback URL and custom parameters</p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <div className="text-sm font-medium">Global Postback URL:</div>
        <div className="flex gap-2">
            <Input
            value={generateUrlWithParams(POSTBACK_BASE_URL)}
              readOnly
            className="font-mono text-sm bg-background"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
          >
            <Clipboard className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Collapsible
        open={isCustomParamsOpen}
        onOpenChange={setIsCustomParamsOpen}
        className="bg-muted/50 rounded-lg"
      >
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 text-left">
            <div>
              <div className="font-medium">Custom Parameters</div>
              <div className="text-sm text-muted-foreground">Add optional parameters to your postback URLs</div>
            </div>
            <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isCustomParamsOpen ? 'rotate-90' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 pt-0 space-y-4">
          <div className="flex gap-2">
            <Select value={selectedParam} onValueChange={setSelectedParam}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select parameter" />
              </SelectTrigger>
              <SelectContent>
                {PREDEFINED_PARAMETERS.map((param) => (
                  <SelectItem 
                    key={param.key} 
                    value={param.key}
                    disabled={!!customParams[param.key]}
                  >
                    <div>
                      <div>{param.key}</div>
                      <div className="text-xs text-muted-foreground">{param.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Variable name"
              value={variableName}
              onChange={(e) => setVariableName(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleAddParam} 
              variant="outline" 
              disabled={!selectedParam || !variableName}
            >
              Add
            </Button>
        </div>
        
          {Object.entries(customParams).length > 0 && (
          <div className="space-y-2">
              <div className="text-sm font-medium">Added Parameters:</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(customParams).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="flex items-center gap-1">
                    {key}={'{' + value + '}'}
                    <button
                      onClick={() => handleRemoveParam(key)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
        </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span>Automatic click tracking for all affiliate traffic</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span>Conversion postback URL for server-to-server tracking</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span>Detailed reporting on clicks, conversions, and revenue</span>
        </div>
        </div>
        
      <p className="text-sm text-muted-foreground">After creating the offer, you can configure advanced tracking options</p>
        </div>
  );
}
