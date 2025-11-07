import React from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface SalesPoint { date: string; sales: number; }

export default function AdminSalesChart({ data }: { data: SalesPoint[] }) {
  const chartConfig = {
    sales: { label: 'Sales', color: 'hsl(var(--thrift-green))' },
  } as const;
  return (
    <ChartContainer config={chartConfig} className="w-full">
      <LineChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickMargin={8} minTickGap={24} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={(v) => Number(v).toLocaleString()} width={64} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line type="monotone" dataKey="sales" stroke="var(--color-sales)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  );
}
