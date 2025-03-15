
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ConversionBreakdownProps {
  isLoading: boolean;
  conversions: any[] | undefined;
}

export function ConversionBreakdown({ isLoading, conversions }: ConversionBreakdownProps) {
  const getConversionChartData = () => {
    if (!conversions) return [];
    
    return [
      {
        name: 'Leads',
        count: conversions.filter(c => c.event_type === 'lead').length,
        amount: conversions
          .filter(c => c.event_type === 'lead')
          .reduce((sum, c) => sum + (c.commission || 0), 0)
      },
      {
        name: 'Sales',
        count: conversions.filter(c => c.event_type === 'sale').length,
        amount: conversions
          .filter(c => c.event_type === 'sale')
          .reduce((sum, c) => sum + (c.commission || 0), 0)
      },
      {
        name: 'Actions',
        count: conversions.filter(c => c.event_type === 'action').length,
        amount: conversions
          .filter(c => c.event_type === 'action')
          .reduce((sum, c) => sum + (c.commission || 0), 0)
      },
      {
        name: 'Deposits',
        count: conversions.filter(c => c.event_type === 'deposit').length,
        amount: conversions
          .filter(c => c.event_type === 'deposit')
          .reduce((sum, c) => sum + (c.commission || 0), 0)
      }
    ];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Breakdown</CardTitle>
        <CardDescription>By event type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : conversions && conversions.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getConversionChartData()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Count" fill="#8884d8" />
                <Bar dataKey="amount" name="Amount ($)" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No conversion data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
