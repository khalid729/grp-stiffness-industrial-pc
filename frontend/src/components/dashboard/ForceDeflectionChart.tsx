import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface ChartDataPoint {
  deflection: number;
  force: number;
}

interface ForceDeflectionChartProps {
  data: ChartDataPoint[];
  targetDeflection?: number;
}

export function ForceDeflectionChart({ data, targetDeflection }: ForceDeflectionChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) {
      return [{ deflection: 0, force: 0 }];
    }
    return data;
  }, [data]);

  const maxForce = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.force), 1000);
    return Math.ceil(max / 1000) * 1000;
  }, [chartData]);

  const maxDeflection = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.deflection), targetDeflection || 10);
    return Math.ceil(max / 5) * 5 + 5;
  }, [chartData, targetDeflection]);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
          <XAxis 
            dataKey="deflection" 
            stroke="hsl(215 20% 55%)"
            fontSize={14}
            tickFormatter={(v) => `${v.toFixed(1)}`}
            label={{ value: 'Deflection (mm)', position: 'bottom', offset: 5, fill: 'hsl(215 20% 55%)', fontSize: 14 }}
            domain={[0, maxDeflection]}
          />
          <YAxis 
            stroke="hsl(215 20% 55%)"
            fontSize={14}
            tickFormatter={(v) => `${(v/1000).toFixed(1)}k`}
            label={{ value: 'Force (N)', angle: -90, position: 'insideLeft', fill: 'hsl(215 20% 55%)', fontSize: 14 }}
            domain={[0, maxForce]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(220 18% 12%)', 
              border: '1px solid hsl(220 15% 22%)',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            labelFormatter={(value) => `Deflection: ${Number(value).toFixed(2)} mm`}
            formatter={(value: number) => [`${value.toFixed(0)} N`, 'Force']}
          />
          {targetDeflection && (
            <ReferenceLine 
              x={targetDeflection} 
              stroke="hsl(142 70% 45%)" 
              strokeDasharray="5 5"
              label={{ value: 'Target', fill: 'hsl(142 70% 45%)', fontSize: 14, position: 'top' }}
            />
          )}
          <Line 
            type="monotone" 
            dataKey="force" 
            stroke="hsl(210 100% 55%)" 
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
