// components/dashboard/RadarChart.tsx

'use client';

import { 
  Radar, 
  RadarChart as RechartsRadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { DestinyParameters, PARAMETER_LABELS } from '@/types/destiny.types';

interface RadarChartProps {
  data: DestinyParameters;
}

export default function RadarChart({ data }: RadarChartProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    parameter: PARAMETER_LABELS[key as keyof DestinyParameters],
    value: value,
    fullMark: 100
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsRadarChart data={chartData}>
        <PolarGrid 
          gridType="polygon" 
          stroke="#e0e0e0"
        />
        <PolarAngleAxis 
          dataKey="parameter" 
          tick={{ fontSize: 12 }}
          className="text-gray-600"
        />
        <PolarRadiusAxis 
          domain={[0, 100]} 
          tick={{ fontSize: 10 }}
          axisLine={false}
        />
        <Radar 
          name="運勢" 
          dataKey="value" 
          stroke="#8b5cf6" 
          fill="#8b5cf6" 
          fillOpacity={0.6}
          strokeWidth={2}
        />
        <Tooltip 
          formatter={(value: number) => `${value}点`}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px'
          }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
