
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardsProps {
  isLoading: boolean;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenue: number;
  totalCommissions: number;
  isAdvertiser: boolean;
}

export function StatsCards({
  isLoading,
  totalClicks,
  totalConversions,
  conversionRate,
  totalRevenue,
  totalCommissions,
  isAdvertiser
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? '...' : totalClicks.toLocaleString()}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Conversions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? '...' : totalConversions.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            CR: {isLoading ? '...' : conversionRate.toFixed(2)}%
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{isAdvertiser ? 'Revenue' : 'Advertiser Revenue'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${isLoading ? '...' : totalRevenue.toFixed(2)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{isAdvertiser ? 'Commissions Paid' : 'Your Commissions'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${isLoading ? '...' : totalCommissions.toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
