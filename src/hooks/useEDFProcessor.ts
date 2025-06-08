
import { useState, useCallback } from 'react';
import { EDFProcessingStatus, EEGDataPoint } from '@/types/eeg';

export const useEDFProcessor = () => {
  const [edfProcessingStatus, setEdfProcessingStatus] = useState<EDFProcessingStatus>('waiting');

  // Generate beautiful fake EEG signal with multiple components
  const generateFakeEEGSignal = useCallback((startTime: number, sampleCount: number = 256): number[] => {
    const samples: number[] = [];
    const baseFreq = 0.001; // Very slow base oscillation
    
    for (let i = 0; i < sampleCount; i++) {
      const time = (startTime + i) / 256; // Time in seconds
      
      // Alpha waves (8-13 Hz) - dominant relaxed state
      const alpha = 30 * Math.sin(2 * Math.PI * 10 * time);
      
      // Beta waves (13-30 Hz) - cognitive activity
      const beta = 15 * Math.sin(2 * Math.PI * 20 * time + Math.PI / 3);
      
      // Theta waves (4-8 Hz) - deep relaxation
      const theta = 20 * Math.sin(2 * Math.PI * 6 * time + Math.PI / 6);
      
      // Delta waves (0.5-4 Hz) - deep sleep patterns
      const delta = 25 * Math.sin(2 * Math.PI * 2 * time);
      
      // Slow baseline drift
      const baseline = 10 * Math.sin(2 * Math.PI * baseFreq * time);
      
      // Random noise (realistic EEG artifact)
      const noise = (Math.random() - 0.5) * 8;
      
      // Occasional spike artifacts
      const spike = (Math.random() < 0.002) ? (Math.random() - 0.5) * 40 : 0;
      
      // Breathing artifact (very slow)
      const breathing = 5 * Math.sin(2 * Math.PI * 0.25 * time);
      
      // Combine all components
      const amplitude = alpha + beta * 0.7 + theta * 0.5 + delta * 0.3 + baseline + noise + spike + breathing;
      
      samples.push(amplitude);
    }
    
    return samples;
  }, []);

  const processEDFData = useCallback((edfBuffer: ArrayBuffer): number[] => {
    try {
      setEdfProcessingStatus('processing');
      console.log('Traitement fichier EDF, taille:', edfBuffer.byteLength);
      
      const samples: number[] = [];
      const view = new DataView(edfBuffer);
      
      // Try to read real EDF data
      for (let i = 0; i < 256; i++) {
        if (i * 4 < view.byteLength) {
          try {
            const sample = view.getFloat32(i * 4, true);
            samples.push(sample);
          } catch {
            // If error reading, fall back to fake signal
            const fakeSignal = generateFakeEEGSignal(Date.now() + i);
            samples.push(fakeSignal[0]);
          }
        } else {
          // If not enough data, generate fake signal
          const fakeSignal = generateFakeEEGSignal(Date.now() + i);
          samples.push(fakeSignal[0]);
        }
      }
      
      setEdfProcessingStatus('waiting');
      return samples.length > 0 ? samples : generateFakeEEGSignal(Date.now());
    } catch (error) {
      console.error('Erreur traitement EDF:', error);
      setEdfProcessingStatus('error');
      // Return fake signal as fallback
      return generateFakeEEGSignal(Date.now());
    }
  }, [generateFakeEEGSignal]);

  const convertSamplesToDataPoints = useCallback((samples: number[], duration: number): EEGDataPoint[] => {
    const now = Date.now();
    const newDataPoints: EEGDataPoint[] = [];
    
    samples.forEach((amplitude, index) => {
      const timestamp = now + (index * (1000 / 256)); // 256 Hz
      newDataPoints.push({
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

    return newDataPoints;
  }, []);

  return {
    edfProcessingStatus,
    processEDFData,
    convertSamplesToDataPoints,
    generateFakeEEGSignal
  };
};
