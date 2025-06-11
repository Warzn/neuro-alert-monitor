
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
  const timeOffsetRef = useRef(0);

  const { edfProcessingStatus } = useEDFProcessor();

  // Signal sinusoïdal qui se translate dans le temps
  const generateTravelingWave = (startTime: number, numSamples: number): number[] => {
    const samples: number[] = [];
    const sampleRate = 256; // 256 Hz
    const frequency = 1; // 1 Hz - fréquence de l'onde
    const amplitude = 30; // Amplitude
    const waveSpeed = 2; // Vitesse de déplacement de la vague
    
    for (let i = 0; i < numSamples; i++) {
      const t = (startTime + i) / sampleRate;
      
      // Onde sinusoïdale qui se déplace : sin(2π(f*t - v*t)) = sin(2π*t*(f-v))
      // Ou plus simplement : on ajoute un décalage temporel qui augmente
      const signal = amplitude * Math.sin(2 * Math.PI * frequency * (t + timeOffsetRef.current));
      
      samples.push(signal);
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
      timeOffsetRef.current = 0;
      return;
    }

    // Initialize with traveling wave data when Jetson connects
    const initialData: EEGDataPoint[] = [];
    const now = Date.now();
    const initialSamples = generateTravelingWave(0, duration * 256);
    
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

    // Generate new traveling wave data every 100ms for smooth movement
    intervalRef.current = setInterval(() => {
      // Incrémenter le décalage temporel pour faire "glisser" la vague
      timeOffsetRef.current += 0.1;
      
      const samples = generateTravelingWave(Date.now() / 1000 * 256, 25); // 25 samples = 100ms à 256Hz
      const newDataPoints = convertSamplesToDataPoints(samples);
      updateDataWithNewPoints(newDataPoints);
    }, 100);

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
