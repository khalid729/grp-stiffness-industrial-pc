import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface DataPoint {
  deflection: number;
  force: number;
}

interface ForceDeflectionChartProps {
  data: DataPoint[];
  targetDeflection?: number;
}

export function ForceDeflectionChart({ 
  data, 
  targetDeflection 
}: ForceDeflectionChartProps) {
  return (
    <div className="h-full min-h-[250px]">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">
        Force vs Deflection
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            opacity={0.5} 
          />
          <XAxis 
            dataKey="deflection" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `${value.toFixed(1)}`}
            label={{ 
              value: 'Deflection (mm)', 
              position: 'bottom', 
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 11
            }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `${value.toFixed(1)}`}
            label={{ 
              value: 'Force (N)', 
              angle: -90, 
              position: 'insideLeft',
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 11
            }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: 12
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number) => [value.toFixed(3), '']}
            labelFormatter={(label) => `Deflection: ${Number(label).toFixed(2)} mm`}
          />
          {targetDeflection && targetDeflection > 0 && (
            <ReferenceLine 
              x={targetDeflection} 
              stroke="hsl(var(--warning))" 
              strokeDasharray="5 5"
              label={{ 
                value: 'Target', 
                fill: 'hsl(var(--warning))',
                fontSize: 11
              }}
            />
          )}
          <Line 
            type="monotone" 
            dataKey="force" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
          />
        </LineChart>
      </ResponsiveContainer>
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
          No test data - Start a test to see the chart
        </div>
      )}
    </div>
  );
}
