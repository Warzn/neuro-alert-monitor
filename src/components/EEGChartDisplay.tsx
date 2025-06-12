
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
          <defs>
            <linearGradient id="eegGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#667eea" stopOpacity={0.9}/>
              <stop offset="35%" stopColor="#764ba2" stopOpacity={1}/>
              <stop offset="70%" stopColor="#f093fb" stopOpacity={0.9}/>
              <stop offset="100%" stopColor="#667eea" stopOpacity={0.8}/>
            </linearGradient>
            <linearGradient id="shadowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#667eea" stopOpacity={0.4}/>
              <stop offset="100%" stopColor="#667eea" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <XAxis hide />
          <YAxis hide />
          <ReferenceLine y={0} stroke="#E2E8F0" strokeDasharray="2 2" strokeOpacity={0.5} />
          <ReferenceLine y={80} stroke="#FED7D7" strokeDasharray="1 1" strokeOpacity={0.3} />
          <ReferenceLine y={-80} stroke="#FED7D7" strokeDasharray="1 1" strokeOpacity={0.3} />
          <Line 
            type="monotone" 
            dataKey="amplitude" 
            stroke="url(#eegGradient)"
            strokeWidth={3}
            dot={false}
            connectNulls={false}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="drop-shadow(0 3px 6px rgba(102, 126, 234, 0.4))"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EEGChartDisplay;
