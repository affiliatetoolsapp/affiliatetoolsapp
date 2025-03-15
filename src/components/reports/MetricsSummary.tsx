
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricsSummaryProps {
  totalClicks: number;
  totalConversions: number;
  dateRange: string;
}

export function MetricsSummary({ totalClicks, totalConversions, dateRange }: MetricsSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Metrics Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border rounded-md">
            <div className="grid grid-cols-3 p-3 border-b bg-muted/50">
              <div className="font-medium">Metric</div>
              <div className="font-medium">This Period</div>
              <div className="font-medium">Per Day Avg</div>
            </div>
            <div className="divide-y">
              <div className="grid grid-cols-3 p-3">
                <div>Clicks</div>
                <div>{totalClicks}</div>
                <div>{(totalClicks / parseInt(dateRange)).toFixed(1)}</div>
              </div>
              <div className="grid grid-cols-3 p-3">
                <div>Conversions</div>
                <div>{totalConversions}</div>
                <div>{(totalConversions / parseInt(dateRange)).toFixed(1)}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
