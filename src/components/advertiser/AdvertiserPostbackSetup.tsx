
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clipboard, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdvertiserPostbackSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [postbackUrl, setPostbackUrl] = useState('');
  const [domain, setDomain] = useState('');
  
  // Get the domain name for the postback URL
  useEffect(() => {
    // Use the custom Railway domain
    const customDomain = 'https://afftools.up.railway.app';
    setDomain(customDomain);
    const baseUrl = `${customDomain}/api/postback`;
    setPostbackUrl(`${baseUrl}?click_id={click_id}&goal={goal}&payout={payout}`);
  }, []);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(postbackUrl);
    setCopied(true);
    
    toast({
      title: "Copied to clipboard",
      description: "The postback URL has been copied to your clipboard.",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  const testPostback = () => {
    const testUrl = postbackUrl
      .replace('{click_id}', 'test_click_123')
      .replace('{goal}', 'lead')
      .replace('{payout}', '10');
      
    toast({
      title: "Testing postback",
      description: "Sending a test postback request...",
    });
    
    fetch(testUrl)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          toast({
            title: "Test successful",
            description: "The test postback was processed successfully.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Test failed",
            description: data.error || "Something went wrong with the test postback.",
          });
        }
      })
      .catch(error => {
        toast({
          variant: "destructive",
          title: "Test failed",
          description: "Could not send the test postback request. Please try again.",
        });
        console.error("Error testing postback:", error);
      });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>S2S Postback Setup</CardTitle>
        <CardDescription>
          Set up server-to-server postback tracking for your offers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="postback-url">Global Postback URL</Label>
          <div className="flex mt-1">
            <Input
              id="postback-url"
              value={postbackUrl}
              readOnly
              className="flex-1 font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              className="ml-2"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Use this URL in your systems to track conversions. Replace the placeholders with actual values:
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Badge variant="outline">{'{click_id}'}</Badge>
            <p className="text-sm text-muted-foreground">
              Required. The click ID value passed in your tracking parameters (e.g., sub1, sub2).
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="outline">{'{goal}'}</Badge>
            <p className="text-sm text-muted-foreground">
              Optional. Specify conversion type (lead, sale, action, deposit) or use numbers (1=lead, 2=sale, etc).
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="outline">{'{payout}'}</Badge>
            <p className="text-sm text-muted-foreground">
              Optional. The commission amount for this conversion.
            </p>
          </div>
        </div>
        
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm font-medium">Example postbacks:</p>
          <div className="mt-2 space-y-2">
            <div className="text-xs font-mono p-2 bg-background rounded border overflow-auto">
              {postbackUrl.replace('{click_id}', 'abc123').replace('{goal}', 'lead').replace('{payout}', '5')}
              <span className="text-muted-foreground ml-2">← Lead conversion ($5) - text format</span>
            </div>
            <div className="text-xs font-mono p-2 bg-background rounded border overflow-auto">
              {postbackUrl.replace('{click_id}', 'abc123').replace('{goal}', '1').replace('{payout}', '5')}
              <span className="text-muted-foreground ml-2">← Lead conversion ($5) - numeric format (1=lead)</span>
            </div>
            <div className="text-xs font-mono p-2 bg-background rounded border overflow-auto">
              {postbackUrl.replace('{click_id}', 'abc123').replace('{goal}', 'sale').replace('{payout}', '25')}
              <span className="text-muted-foreground ml-2">← Sale conversion ($25)</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button onClick={testPostback} variant="outline" className="sm:flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Test Postback
          </Button>
          <Button onClick={copyToClipboard} className="sm:flex-1">
            <Clipboard className="h-4 w-4 mr-2" />
            Copy URL
          </Button>
        </div>
        
        <div className="flex items-center p-3 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 rounded-md">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <div className="text-sm">
            <p><strong>Important:</strong> When using tracking parameters like ?sub1={'{clickId}'} in your offer URL, our system will replace {'{clickId}'} with the actual click ID. Make sure to use the same parameter to send the postback.</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 border rounded-md">
          <h3 className="font-medium mb-2">Integration Instructions</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>
              <strong>How the click ID flows:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-muted-foreground">
                <li>Your offer URL contains a tracking parameter: <code className="text-xs bg-muted p-1 rounded">?sub1={'{clickId}'}</code></li>
                <li>Our system replaces <code className="text-xs bg-muted p-1 rounded">{'{clickId}'}</code> with the actual click ID (e.g., <code className="text-xs bg-muted p-1 rounded">abc123</code>)</li>
                <li>Your system should extract this value from the URL parameter</li>
              </ul>
            </li>
            <li>
              <strong>Store the click ID:</strong> When a user clicks on an affiliate link to your offer, save the click ID from the URL parameter (e.g., <code className="text-xs bg-muted p-1 rounded">sub1</code>).
            </li>
            <li>
              <strong>Send postback on conversion:</strong> When a conversion happens, send a GET request to our postback URL with the click ID.
              <div className="text-xs font-mono p-2 mt-1 bg-background rounded border overflow-auto text-muted-foreground">
                {domain}/api/postback?click_id=ACTUAL_CLICK_ID&goal=lead
              </div>
            </li>
            <li>
              <strong>Supported goal values:</strong>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                <div><code className="bg-muted p-0.5 rounded">lead</code> or <code className="bg-muted p-0.5 rounded">1</code></div>
                <div><code className="bg-muted p-0.5 rounded">sale</code> or <code className="bg-muted p-0.5 rounded">2</code></div>
                <div><code className="bg-muted p-0.5 rounded">action</code> or <code className="bg-muted p-0.5 rounded">3</code></div>
                <div><code className="bg-muted p-0.5 rounded">deposit</code> or <code className="bg-muted p-0.5 rounded">4</code></div>
              </div>
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
