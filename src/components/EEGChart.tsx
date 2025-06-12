
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
  const phaseRef = useRef(0);
  const timeRef = useRef(0);

  const { edfProcessingStatus } = useEDFProcessor();

  // Génère un signal ultra-lisse avec interpolation
  const generateSmoothSignal = (startTime: number, numSamples: number): number[] => {
    const samples: number[] = [];
    const sampleRate = 256; // 256 Hz
    const frequency = 0.08; // Fréquence très réduite pour un signal plus lent
    const amplitude = 75;
    
    for (let i = 0; i < numSamples; i++) {
      const t = (startTime + i) / sampleRate;
      
      // Signal sinusoïdal de base ultra-lisse
      const baseSignal = amplitude * Math.sin(2 * Math.PI * frequency * t + phaseRef.current);
      
      // Ajouter une très légère harmonique pour un signal plus naturel
      const harmonic = amplitude * 0.15 * Math.sin(4 * Math.PI * frequency * t + phaseRef.current * 0.7);
      
      // Signal final ultra-lisse
      const smoothSignal = baseSignal + harmonic;
      
      samples.push(smoothSignal);
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
        envelope_max: amplitude + 8,
        envelope_min: amplitude - 8
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
      phaseRef.current = 0;
      timeRef.current = 0;
      return;
    }

    // Initialize with smooth signal data when Jetson connects
    const initialData: EEGDataPoint[] = [];
    const now = Date.now();
    const initialSamples = generateSmoothSignal(0, duration * 256);
    
    initialSamples.forEach((amplitude, index) => {
      const timestamp = now - (duration * 1000) + (index * (1000 / 256));
      initialData.push({
        timestamp,
        amplitude,
        time: '',
        envelope_max: amplitude + 8,
        envelope_min: amplitude - 8
      });
    });
    
    setData(initialData);

    // Generate new smooth signal data every 150ms pour un mouvement ultra-fluide
    intervalRef.current = setInterval(() => {
      // Avancer la phase très lentement pour un mouvement ultra-fluide
      phaseRef.current += 0.08;
      timeRef.current += 0.15;
      
      const samples = generateSmoothSignal(timeRef.current * 256, 38); // 38 samples = 150ms à 256Hz
      const newDataPoints = convertSamplesToDataPoints(samples);
      updateDataWithNewPoints(newDataPoints);
    }, 150);

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
