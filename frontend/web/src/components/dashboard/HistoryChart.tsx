// components/dashboard/HistoryChart.tsx

'use client';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { DestinyReading, PARAMETER_COLORS, PARAMETER_LABELS } from '@/types/destiny.types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useState } from 'react';

interface HistoryChartProps {
  readings: DestinyReading[];
}

export default function HistoryChart({ readings }: HistoryChartProps) {
  const [selectedParameters, setSelectedParameters] = useState<Set<string>>(
    new Set(['love', 'career', 'growth'])  // overall, work を修正
  );

  // データを日付順に並び替えて整形
  const chartData = [...readings]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(reading => ({
      date: format(new Date(reading.createdAt), 'M/d', { locale: ja }),
      ...reading.parameters
    }));

  const toggleParameter = (param: string) => {
    const newSelected = new Set(selectedParameters);
    if (newSelected.has(param)) {
      newSelected.delete(param);
    } else {
      newSelected.add(param);
    }
    setSelectedParameters(newSelected);
  };

  return (
    <div>
      {/* パラメーター選択ボタン */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(PARAMETER_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => toggleParameter(key)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              selectedParameters.has(key)
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* チャート */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart 
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <Tooltip 
            formatter={(value: number) => `${value}点`}
            labelFormatter={(label) => `${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          
          {Array.from(selectedParameters).map(param => (
            <Line
              key={param}
              type="monotone"
              dataKey={param}
              stroke={PARAMETER_COLORS[param as keyof typeof PARAMETER_COLORS]}
              strokeWidth={2}
              name={PARAMETER_LABELS[param as keyof typeof PARAMETER_LABELS]}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
