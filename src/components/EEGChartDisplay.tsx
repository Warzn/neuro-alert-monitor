
import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { EEGDataPoint } from '@/types/eeg';

interface EEGChartDisplayProps {
  data: EEGDataPoint[];
}

const EEGChartDisplay: React.FC<EEGChartDisplayProps> = ({ data }) => {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false}
            tick={{ fontSize: 11, fill: '#666' }}
          />
          <YAxis 
            domain={[-150, 150]}
            axisLine={false} 
            tickLine={false}
            tick={false}
            label={false}
          />
          <ReferenceLine y={0} stroke="#E2E8F0" strokeDasharray="2 2" />
          <ReferenceLine y={100} stroke="#FED7D7" strokeDasharray="1 1" />
          <ReferenceLine y={-100} stroke="#FED7D7" strokeDasharray="1 1" />
          <Line 
            type="monotone" 
            dataKey="amplitude" 
            stroke="#4A90E2" 
            strokeWidth={1.5}
            dot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EEGChartDisplay;
