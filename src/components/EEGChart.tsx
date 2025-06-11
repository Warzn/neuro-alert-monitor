
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

  const { edfProcessingStatus } = useEDFProcessor();

  // Signal périodique simple (onde sinusoïdale à basse fréquence)
  const generateSimplePeriodicSignal = (startSample: number, numSamples: number): number[] => {
    const samples: number[] = [];
    const sampleRate = 256; // 256 Hz
    const frequency = 0.5; // 0.5 Hz - fréquence très basse (un cycle toutes les 2 secondes)
    const amplitude = 50; // Amplitude fixe
    
    for (let i = 0; i < numSamples; i++) {
      const t = (startSample + i) / sampleRate;
      
      // Signal sinusoïdal simple à basse fréquence
      const signal = amplitude * Math.sin(2 * Math.PI * frequency * t);
      
      // Léger bruit pour le réalisme
      const noise = (Math.random() - 0.5) * 3;
      
      const finalAmplitude = signal + noise;
      samples.push(Math.max(-100, Math.min(100, finalAmplitude)));
    }
    
    return samples;
  };

  // Convertir les échantillons en points de données
  const convertSamplesToDataPoints = (samples: number[]): EEGDataPoint[] => {
    const now = Date.now();
    return samples.map((amplitude, index) => {
      const timestamp = now - (samples.length - index - 1) * (1000 / 256);
      return {
        timestamp,
        amplitude,
        time: '',
        envelope_max: amplitude + 15,
        envelope_min: amplitude - 15
      };
    });
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
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only show signal when Jetson is connected
    if (!jetsonConnected || !isRealTime) {
      setData([]);
      return;
    }

    // Initialize with simple periodic data when Jetson connects
    const initialData: EEGDataPoint[] = [];
    const now = Date.now();
    const initialSamples = generateSimplePeriodicSignal(0, duration * 256);
    
    initialSamples.forEach((amplitude, index) => {
      const timestamp = now - (duration * 1000) + (index * (1000 / 256));
      initialData.push({
        timestamp,
        amplitude,
        time: '',
        envelope_max: amplitude + 15,
        envelope_min: amplitude - 15
      });
    });
    
    setData(initialData);

    // Generate new simple periodic data every second when connected
    intervalRef.current = setInterval(() => {
      sampleCountRef.current += 256;
      const samples = generateSimplePeriodicSignal(sampleCountRef.current, 256);
      const newDataPoints = convertSamplesToDataPoints(samples);
      updateDataWithNewPoints(newDataPoints);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [jetsonConnected, isRealTime, duration]);

  return (
    <div className="medical-card rounded-lg p-6 shadow-lg" style={{ 
      background: 'linear-gradient(180deg, #FAFBFC 0%, #F8F9FA 100%)',
      border: '1px solid #E1E5E9'
    }}>
      <EEGStatusIndicator 
        edfProcessingStatus={jetsonConnected ? 'waiting' : 'error'}
        duration={duration}
        onFileUpload={() => {}}
      />
      
      <EEGChartDisplay data={data} />
    </div>
  );
};

export default EEGChart;
