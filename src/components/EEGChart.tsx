
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

  const { edfProcessingStatus } = useEDFProcessor();

  // Génère une onde sinusoïdale parfaite comme dans l'image
  const generatePerfectSineWave = (startTime: number, numSamples: number): number[] => {
    const samples: number[] = [];
    const sampleRate = 256; // 256 Hz
    const frequency = 0.15; // Fréquence ajustée pour correspondre à l'image
    const amplitude = 80; // Amplitude plus élevée pour correspondre à l'image
    
    for (let i = 0; i < numSamples; i++) {
      const t = (startTime + i) / sampleRate;
      // Onde sinusoïdale pure avec phase qui avance
      const signal = amplitude * Math.sin(2 * Math.PI * frequency * t + phaseRef.current);
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
        envelope_max: amplitude + 10,
        envelope_min: amplitude - 10
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
      return;
    }

    // Initialize with perfect sine wave data when Jetson connects
    const initialData: EEGDataPoint[] = [];
    const now = Date.now();
    const initialSamples = generatePerfectSineWave(0, duration * 256);
    
    initialSamples.forEach((amplitude, index) => {
      const timestamp = now - (duration * 1000) + (index * (1000 / 256));
      initialData.push({
        timestamp,
        amplitude,
        time: '',
        envelope_max: amplitude + 10,
        envelope_min: amplitude - 10
      });
    });
    
    setData(initialData);

    // Generate new perfect sine wave data every 100ms for ultra-smooth movement
    intervalRef.current = setInterval(() => {
      // Avancer la phase très lentement pour un mouvement fluide
      phaseRef.current += 0.15; // Phase parfaitement ajustée
      
      const samples = generatePerfectSineWave(Date.now() / 1000 * 256, 25); // 25 samples = 100ms à 256Hz
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
