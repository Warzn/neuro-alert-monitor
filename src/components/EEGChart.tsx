
import React, { useEffect, useRef, useState } from 'react';
import { EEGDataPoint, EEGChartProps } from '@/types/eeg';
import { useEDFProcessor } from '@/hooks/useEDFProcessor';
import EEGChartDisplay from './EEGChartDisplay';
import EEGStatusIndicator from './EEGStatusIndicator';
import EEGFooterControls from './EEGFooterControls';

const EEGChart: React.FC<EEGChartProps> = ({ isRealTime = true, duration = 30, onEDFData }) => {
  const [data, setData] = useState<EEGDataPoint[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sampleCountRef = useRef(0);

  const { edfProcessingStatus, processEDFData, convertSamplesToDataPoints, generateFakeEEGSignal } = useEDFProcessor();

  // Handle EDF file upload
  const handleEDFFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result instanceof ArrayBuffer) {
        const samples = processEDFData(event.target.result);
        if (samples.length > 0) {
          const newDataPoints = convertSamplesToDataPoints(samples, duration);
          updateDataWithNewPoints(newDataPoints);
          onEDFData?.(samples);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Update data and maintain sliding window
  const updateDataWithNewPoints = (newDataPoints: EEGDataPoint[]) => {
    setData(prevData => {
      const updatedData = [...prevData, ...newDataPoints];
      const cutoffTime = Date.now() - (duration * 1000);
      return updatedData.filter(point => point.timestamp >= cutoffTime);
    });
  };

  useEffect(() => {
    if (!isRealTime) return;

    // Initialize with beautiful fake data
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

    // Generate new data every second
    intervalRef.current = setInterval(() => {
      sampleCountRef.current += 256;
      const samples = generateFakeEEGSignal(sampleCountRef.current, 256);
      const newDataPoints = convertSamplesToDataPoints(samples, duration);
      updateDataWithNewPoints(newDataPoints);
      onEDFData?.(samples);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRealTime, duration, generateFakeEEGSignal, convertSamplesToDataPoints, onEDFData]);

  return (
    <div className="medical-card rounded-lg p-6 shadow-lg" style={{ 
      background: 'linear-gradient(180deg, #FAFBFC 0%, #F8F9FA 100%)',
      border: '1px solid #E1E5E9'
    }}>
      <EEGStatusIndicator 
        edfProcessingStatus={edfProcessingStatus}
        duration={duration}
        onFileUpload={handleEDFFile}
      />
      
      <EEGChartDisplay data={data} />
      
      <EEGFooterControls 
        duration={duration}
        onFileUpload={handleEDFFile}
      />
    </div>
  );
};

export default EEGChart;
