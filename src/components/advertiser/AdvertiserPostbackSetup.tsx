
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
    setDomain(window.location.origin);
    const baseUrl = `${window.location.origin}/api/postback`;
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
              Required. The click ID passed in tracking links.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="outline">{'{goal}'}</Badge>
            <p className="text-sm text-muted-foreground">
              Optional. Specify conversion type (lead, sale, action, deposit).
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
            <div className="text-xs font-mono p-2 bg-background rounded border">
              {postbackUrl.replace('{click_id}', 'abc123').replace('{goal}', 'lead').replace('{payout}', '5')}
              <span className="text-muted-foreground ml-2">← Lead conversion ($5)</span>
            </div>
            <div className="text-xs font-mono p-2 bg-background rounded border">
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
            <p>Make sure your system sends a postback request for each conversion. Test thoroughly to ensure tracking works properly.</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 border rounded-md">
          <h3 className="font-medium mb-2">Integration Instructions</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>Capture the clickId</strong>: When a user clicks on an affiliate link to your offer, we'll append a clickId parameter to your URL (or replace {'{clickId}'} if you included it in your offer URL).
            </li>
            <li>
              <strong>Store this clickId</strong>: Your system should capture and store this clickId to associate it with user actions.
            </li>
            <li>
              <strong>Send postback on conversion</strong>: When a conversion happens (lead, sale, etc.), send a postback to our URL with the clickId and goal type.
            </li>
            <li>
              <strong>Optional: Include payout</strong>: For revenue share models, you can include the payout amount.
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
