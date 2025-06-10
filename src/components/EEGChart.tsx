
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

  // Générateur de signal EEG avec basse fréquence (onde delta 1-4 Hz)
  const generateLowFrequencyEEGSignal = (startSample: number, numSamples: number): number[] => {
    const samples: number[] = [];
    const sampleRate = 256; // 256 Hz
    
    for (let i = 0; i < numSamples; i++) {
      const t = (startSample + i) / sampleRate;
      
      // Onde delta dominante (1-3 Hz) - caractéristique du sommeil profond
      const deltaWave = 40 * Math.sin(2 * Math.PI * 2 * t);
      
      // Onde theta (4-8 Hz) - plus faible
      const thetaWave = 15 * Math.sin(2 * Math.PI * 6 * t + Math.PI / 4);
      
      // Onde alpha (8-12 Hz) - très faible
      const alphaWave = 8 * Math.sin(2 * Math.PI * 10 * t + Math.PI / 2);
      
      // Bruit de fond très léger
      const noise = (Math.random() - 0.5) * 3;
      
      // Modulation lente pour simuler la variabilité naturelle
      const modulation = 1 + 0.3 * Math.sin(2 * Math.PI * 0.1 * t);
      
      const amplitude = (deltaWave + thetaWave + alphaWave + noise) * modulation;
      samples.push(Math.max(-120, Math.min(120, amplitude)));
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
        time: '', // Plus d'affichage d'heure
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
      setData([]); // Clear data when not connected
      return;
    }

    // Initialize with fake data when Jetson connects
    const initialData: EEGDataPoint[] = [];
    const now = Date.now();
    const initialSamples = generateLowFrequencyEEGSignal(0, duration * 256);
    
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

    // Generate new fake data every second when connected
    intervalRef.current = setInterval(() => {
      sampleCountRef.current += 256;
      const samples = generateLowFrequencyEEGSignal(sampleCountRef.current, 256);
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
        onFileUpload={() => {}} // Disabled file upload
      />
      
      <EEGChartDisplay data={data} />
    </div>
  );
};

export default EEGChart;
