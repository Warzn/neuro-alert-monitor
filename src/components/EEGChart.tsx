
import React, { useEffect, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface EEGDataPoint {
  timestamp: number;
  amplitude: number;
  time: string;
}

interface EEGChartProps {
  isRealTime?: boolean;
  duration?: number; // en secondes
}

const EEGChart: React.FC<EEGChartProps> = ({ isRealTime = true, duration = 30 }) => {
  const [data, setData] = useState<EEGDataPoint[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour générer un signal EEG artificiel
  const generateArtificialEEG = (timestamp: number): number => {
    const frequency = 10; // Hz (ondes alpha)
    const amplitude = 50; // μV
    const noise = 5;
    const time = timestamp / 1000; // convertir en secondes
    
    // Signal de base avec harmoniques pour plus de réalisme
    const baseSignal = amplitude * Math.sin(2 * Math.PI * frequency * time);
    const harmonic1 = (amplitude * 0.3) * Math.sin(2 * Math.PI * frequency * 2 * time);
    const harmonic2 = (amplitude * 0.2) * Math.sin(2 * Math.PI * frequency * 0.5 * time);
    const noiseComponent = noise * (Math.random() - 0.5);
    
    return baseSignal + harmonic1 + harmonic2 + noiseComponent;
  };

  useEffect(() => {
    if (!isRealTime) return;

    // Initialiser avec des données
    const initialData: EEGDataPoint[] = [];
    const now = Date.now();
    for (let i = 0; i < duration * 4; i++) { // 4 points par seconde
      const timestamp = now - (duration * 1000) + (i * 250);
      initialData.push({
        timestamp,
        amplitude: generateArtificialEEG(timestamp),
        time: new Date(timestamp).toLocaleTimeString('fr-FR', { 
          hour12: false, 
          minute: '2-digit', 
          second: '2-digit'
        })
      });
    }
    setData(initialData);

    // Mise à jour en temps réel
    intervalRef.current = setInterval(() => {
      const timestamp = Date.now();
      const newPoint: EEGDataPoint = {
        timestamp,
        amplitude: generateArtificialEEG(timestamp),
        time: new Date(timestamp).toLocaleTimeString('fr-FR', { 
          hour12: false, 
          minute: '2-digit', 
          second: '2-digit'
        })
      };

      setData(prevData => {
        const newData = [...prevData, newPoint];
        // Garder seulement les données des dernières `duration` secondes
        const cutoffTime = timestamp - (duration * 1000);
        return newData.filter(point => point.timestamp >= cutoffTime);
      });
    }, 100); // Mise à jour toutes les 100ms (10 FPS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRealTime, duration]);

  const formatXAxisTick = (tickItem: any) => {
    if (typeof tickItem === 'string') {
      return tickItem.slice(-8); // Afficher seulement HH:MM:SS
    }
    return '';
  };

  return (
    <div className="medical-card rounded-lg p-6" style={{ 
      background: 'linear-gradient(180deg, #FAFBFC 0%, #F8F9FA 100%)' 
    }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Signal EEG en Temps Réel
        </h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Moyenne 23 canaux</span>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-medical-blue rounded-full mr-2"></div>
            <span>Amplitude (μV)</span>
          </div>
        </div>
      </div>
      
      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E1E5E9" 
              strokeWidth={1}
            />
            <XAxis 
              dataKey="time"
              tickFormatter={formatXAxisTick}
              stroke="#64748b"
              fontSize={12}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[-150, 150]}
              stroke="#64748b"
              fontSize={12}
              label={{ value: 'Amplitude (μV)', angle: -90, position: 'insideLeft' }}
            />
            <Line 
              type="monotone" 
              dataKey="amplitude" 
              stroke="hsl(var(--medical-blue))"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>Fréquence d'échantillonnage: 256 Hz simulé</span>
        <span>Fenêtre d'affichage: {duration}s</span>
      </div>
    </div>
  );
};

export default EEGChart;
