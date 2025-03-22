import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Copy, AlertCircle, Globe, CheckCircle, Settings2, Code2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { useState } from "react";

const TrackingGuide = () => {
  const [selectedGoal, setSelectedGoal] = useState("cpa");

  const copyToClipboard = async (text: string) => {
    // Try using the modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        toast({
          title: "Copied to clipboard",
          description: "The postback URL has been copied to your clipboard.",
        });
        return;
      } catch (err) {
        console.error("Failed to copy using Clipboard API:", err);
      }
    }

    // Fallback to older execCommand method
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      textArea.remove();

      if (successful) {
        toast({
          title: "Copied to clipboard",
          description: "The postback URL has been copied to your clipboard.",
        });
      } else {
        throw new Error("Copy command failed");
      }
    } catch (err) {
      console.error("Failed to copy text:", err);
      toast({
        title: "Failed to copy",
        description: "Please try copying manually.",
        variant: "destructive",
      });
    }
  };

  const baseUrl = "https://jruzfpymzkzegdhmzwsr.supabase.co/functions/v1/postback";
  const leadPostback = `${baseUrl}?click_id={click_id}&goal=lead`;
  const cpaPostback = `${baseUrl}?click_id={click_id}&goal=cpa`;
  const cplPostback = `${baseUrl}?click_id={click_id}&goal=cpl`;
  const cpsPostback = `${baseUrl}?click_id={click_id}&goal=cps`;
  const ftdPostback = `${baseUrl}?click_id={click_id}&goal=ftd`;

  const getPostbackUrl = (goal: string) => {
    switch (goal) {
      case "lead":
        return leadPostback;
      case "cpl":
        return cplPostback;
      case "cpa":
        return cpaPostback;
      case "cps":
        return cpsPostback;
      case "ftd":
        return ftdPostback;
      default:
        return cpaPostback;
    }
  };

  const optionalParameters = [
    { name: "currency", description: "Currency of the payout (e.g., USD)" },
    { name: "country", description: "Country code of the conversion" },
    { name: "custom_1", description: "Custom tracking parameter 1" },
    { name: "custom_2", description: "Custom tracking parameter 2" },
    { name: "custom_3", description: "Custom tracking parameter 3" },
    { name: "custom_4", description: "Custom tracking parameter 4" },
    { name: "custom_5", description: "Custom tracking parameter 5" },
    { name: "sub1", description: "Sub ID 1 for additional tracking" },
    { name: "sub2", description: "Sub ID 2 for additional tracking" },
    { name: "sub3", description: "Sub ID 3 for additional tracking" },
    { name: "sub4", description: "Sub ID 4 for additional tracking" },
    { name: "sub5", description: "Sub ID 5 for additional tracking" },
    { name: "ip", description: "IP address of the conversion" },
    { name: "user_agent", description: "User agent string of the conversion" },
    { name: "referrer", description: "Referrer URL of the conversion" },
    { name: "value", description: "Value of the conversion (e.g., order total)" }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          S2S Tracking Setup
        </CardTitle>
        <CardDescription>
          Set up server-to-server postback tracking for your offers
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="setup">S2S Postback</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-6">
            {/* Quick Setup Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                Quick Setup
              </h3>
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Lead Postback (Optional)</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(leadPostback)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <code className="text-sm bg-muted p-3 rounded block overflow-x-auto">
                    {leadPostback}
                  </code>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Conversion Type</h4>
                    <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select goal type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="cpl">CPL</SelectItem>
                        <SelectItem value="cpa">CPA</SelectItem>
                        <SelectItem value="cps">CPS</SelectItem>
                        <SelectItem value="ftd">FTD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <code className="text-sm bg-muted p-3 rounded block overflow-x-auto flex-1">
                      {getPostbackUrl(selectedGoal)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                      onClick={() => copyToClipboard(getPostbackUrl(selectedGoal))}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center p-3 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 rounded-lg">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <div className="text-sm">
                Make sure to replace <code className="text-xs bg-muted p-1 rounded">{'{click_id}'}</code> with 
                the actual click ID value from the <code className="text-xs bg-muted p-1 rounded">sub1</code> parameter 
                in your landing page URL.
              </div>
            </div>

            <Separator />

            {/* Required Parameters */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Required Parameters
              </h3>
              <div className="grid gap-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default">click_id</Badge>
                    <span className="font-medium">Required</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The unique identifier for the click. This is passed to your landing page 
                    through the <code className="text-xs bg-muted p-1 rounded">sub1</code> parameter.
                    You must store this value and include it in the postback.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default">goal</Badge>
                    <span className="font-medium">Required</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The type of conversion. Use <code className="text-xs bg-muted p-1 rounded">lead</code> for 
                    lead conversions or <code className="text-xs bg-muted p-1 rounded">cpa</code> for CPA conversions.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Optional Parameters */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                Optional Parameters
              </h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Parameter</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[200px]">Parameter</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: Math.ceil(optionalParameters.length / 2) }).map((_, rowIndex) => (
                      <TableRow key={rowIndex}>
                        <TableCell className="font-medium">
                          <code className="text-xs bg-muted p-1 rounded">{optionalParameters[rowIndex * 2].name}</code>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {optionalParameters[rowIndex * 2].description}
                        </TableCell>
                        <TableCell className="font-medium">
                          {optionalParameters[rowIndex * 2 + 1] && (
                            <code className="text-xs bg-muted p-1 rounded">{optionalParameters[rowIndex * 2 + 1].name}</code>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {optionalParameters[rowIndex * 2 + 1]?.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                Example Postbacks
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Basic Lead Conversion</h4>
                  <code className="text-sm bg-muted p-3 rounded block overflow-x-auto">
                    {baseUrl}?click_id=abc123&goal=lead
                  </code>
                  <p className="text-sm text-muted-foreground mt-2">
                    Basic lead conversion with just the required parameters
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">CPA Conversion with Payout</h4>
                  <code className="text-sm bg-muted p-3 rounded block overflow-x-auto">
                    {baseUrl}?click_id=abc123&goal=cpa&payout=50&currency=USD
                  </code>
                  <p className="text-sm text-muted-foreground mt-2">
                    CPA conversion including payout amount and currency
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Advanced Tracking</h4>
                  <code className="text-sm bg-muted p-3 rounded block overflow-x-auto">
                    {baseUrl}?click_id=abc123&goal=lead&payout=25&country=US&custom_1=source1
                  </code>
                  <p className="text-sm text-muted-foreground mt-2">
                    Lead conversion with additional tracking parameters
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TrackingGuide; 