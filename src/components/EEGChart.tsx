
import React, { useEffect, useRef, useState } from 'react';
import { EEGDataPoint, EEGChartProps } from '@/types/eeg';
import { useEDFProcessor } from '@/hooks/useEDFProcessor';
import EEGChartDisplay from './EEGChartDisplay';
import EEGStatusIndicator from './EEGStatusIndicator';

interface EEGChartPropsExtended extends EEGChartProps {
  jetsonConnected?: boolean;
}

const EEGChart: React.FC<EEGChartPropsExtended> = ({ 
  isRealTime = true, 
  duration = 30, 
  jetsonConnected = false 
}) => {
  const [data, setData] = useState<EEGDataPoint[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sampleCountRef = useRef(0);

  const { edfProcessingStatus, generateFakeEEGSignal, convertSamplesToDataPoints } = useEDFProcessor();

  // Update data and maintain sliding window
  const updateDataWithNewPoints = (newDataPoints: EEGDataPoint[]) => {
    setData(prevData => {
      const updatedData = [...prevData, ...newDataPoints];
      const cutoffTime = Date.now() - (duration * 1000);
      return updatedData.filter(point => point.timestamp >= cutoffTime);
    });
  };

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only show signal when Jetson is connected
    if (!jetsonConnected || !isRealTime) {
      setData([]); // Clear data when not connected
      return;
    }

    // Initialize with fake data when Jetson connects
    const initialData: EEGDataPoint[] = [];
    const now = Date.now();
    const initialSamples = generateFakeEEGSignal(0, duration * 256);
    
    initialSamples.forEach((amplitude, index) => {
      const timestamp = now - (duration * 1000) + (index * (1000 / 256));
      initialData.push({
        timestamp,
        amplitude,
        time: new Date(timestamp).toLocaleTimeString('fr-FR', { 
          hour12: false, 
          minute: '2-digit', 
          second: '2-digit'
        }),
        envelope_max: amplitude + 15,
        envelope_min: amplitude - 15
      });
    });
    
    setData(initialData);

    // Generate new fake data every second when connected
    intervalRef.current = setInterval(() => {
      sampleCountRef.current += 256;
      const samples = generateFakeEEGSignal(sampleCountRef.current, 256);
      const newDataPoints = convertSamplesToDataPoints(samples, duration);
      updateDataWithNewPoints(newDataPoints);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [jetsonConnected, isRealTime, duration, generateFakeEEGSignal, convertSamplesToDataPoints]);

  return (
    <div className="medical-card rounded-lg p-6 shadow-lg" style={{ 
      background: 'linear-gradient(180deg, #FAFBFC 0%, #F8F9FA 100%)',
      border: '1px solid #E1E5E9'
    }}>
      <EEGStatusIndicator 
        edfProcessingStatus={jetsonConnected ? 'waiting' : 'error'}
        duration={duration}
        onFileUpload={() => {}} // Disabled file upload
      />
      
      <EEGChartDisplay data={data} />
      
      <div className="mt-4 flex items-center justify-center text-sm text-gray-500 bg-gray-50/50 p-3 rounded-lg">
        {jetsonConnected ? (
          <span>🔄 Signal EEG simulé en temps réel</span>
        ) : (
          <span>⚠️ Connectez le Jetson pour voir le signal EEG</span>
        )}
      </div>
    </div>
  );
};

export default EEGChart;
