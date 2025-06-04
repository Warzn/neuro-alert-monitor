import React, { useEffect, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

interface EEGDataPoint {
  timestamp: number;
  amplitude: number;
  time: string;
  envelope_max: number;
  envelope_min: number;
}

interface EEGChartProps {
  isRealTime?: boolean;
  duration?: number; // en secondes
}

const EEGChart: React.FC<EEGChartProps> = ({ isRealTime = true, duration = 30 }) => {
  const [data, setData] = useState<EEGDataPoint[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour générer un signal EEG artificiel plus sophistiqué
  const generateSophisticatedEEG = (timestamp: number): { amplitude: number; envelope_max: number; envelope_min: number } => {
    const time = timestamp / 1000;
    
    // Ondes multiples pour plus de réalisme
    const alpha = 50 * Math.sin(2 * Math.PI * 10 * time); // 10 Hz - ondes alpha
    const beta = 25 * Math.sin(2 * Math.PI * 20 * time); // 20 Hz - ondes beta
    const theta = 35 * Math.sin(2 * Math.PI * 6 * time); // 6 Hz - ondes theta
    const gamma = 15 * Math.sin(2 * Math.PI * 40 * time); // 40 Hz - ondes gamma
    
    // Harmoniques pour plus de complexité
    const harmonic1 = 20 * Math.sin(2 * Math.PI * 15 * time);
    const harmonic2 = 12 * Math.sin(2 * Math.PI * 8 * time);
    
    // Bruit réaliste (rose noise)
    const noise = 8 * (Math.random() - 0.5) + 3 * (Math.random() - 0.5);
    
    // Modulation d'amplitude lente pour simulation de vigilance
    const modulation = 1 + 0.3 * Math.sin(2 * Math.PI * 0.1 * time);
    
    const baseSignal = (alpha + beta * 0.6 + theta * 0.8 + gamma * 0.3 + harmonic1 * 0.4 + harmonic2 * 0.3) * modulation + noise;
    
    // Calcul de l'enveloppe pour effet visuel
    const envelope_range = 15;
    
    return {
      amplitude: baseSignal,
      envelope_max: baseSignal + envelope_range,
      envelope_min: baseSignal - envelope_range
    };
  };

  useEffect(() => {
    if (!isRealTime) return;

    // Initialiser avec des données plus denses
    const initialData: EEGDataPoint[] = [];
    const now = Date.now();
    for (let i = 0; i < duration * 10; i++) { // 10 points par seconde pour plus de fluidité
      const timestamp = now - (duration * 1000) + (i * 100);
      const eegValues = generateSophisticatedEEG(timestamp);
      initialData.push({
        timestamp,
        ...eegValues,
        time: new Date(timestamp).toLocaleTimeString('fr-FR', { 
          hour12: false, 
          minute: '2-digit', 
          second: '2-digit',
          fractionalSecondDigits: 1
        })
      });
    }
    setData(initialData);

    // Mise à jour en temps réel plus fluide
    intervalRef.current = setInterval(() => {
      const timestamp = Date.now();
      const eegValues = generateSophisticatedEEG(timestamp);
      const newPoint: EEGDataPoint = {
        timestamp,
        ...eegValues,
        time: new Date(timestamp).toLocaleTimeString('fr-FR', { 
          hour12: false, 
          minute: '2-digit', 
          second: '2-digit',
          fractionalSecondDigits: 1
        })
      };

      setData(prevData => {
        const newData = [...prevData, newPoint];
        const cutoffTime = timestamp - (duration * 1000);
        return newData.filter(point => point.timestamp >= cutoffTime);
      });
    }, 50); // Mise à jour toutes les 50ms (20 FPS) pour plus de fluidité

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRealTime, duration]);

  const formatXAxisTick = (tickItem: any) => {
    if (typeof tickItem === 'string') {
      return tickItem.slice(-8);
    }
    return '';
  };

  return (
    <div className="medical-card rounded-lg p-6 shadow-lg" style={{ 
      background: 'linear-gradient(180deg, #FAFBFC 0%, #F8F9FA 100%)',
      border: '1px solid #E1E5E9'
    }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <div className="w-3 h-3 bg-medical-blue rounded-full mr-2 animate-pulse"></div>
          Signal EEG en Temps Réel
        </h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Moyenne 23 canaux</span>
        </div>
      </div>
      
      <div style={{ width: '100%', height: '450px' }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
            {/* Grille sophistiquée */}
            <CartesianGrid 
              strokeDasharray="2 4" 
              stroke="#E1E5E9" 
              strokeWidth={0.8}
              opacity={0.6}
            />
            
            {/* Ligne de référence zéro */}
            <ReferenceLine 
              y={0} 
              stroke="#2C3E50" 
              strokeWidth={1}
              strokeOpacity={0.7}
            />
            
            {/* Lignes de seuil d'alerte */}
            <ReferenceLine 
              y={100} 
              stroke="#FF6B6B" 
              strokeDasharray="5 5"
              strokeWidth={1.5}
              strokeOpacity={0.6}
            />
            <ReferenceLine 
              y={-100} 
              stroke="#FF6B6B" 
              strokeDasharray="5 5"
              strokeWidth={1.5}
              strokeOpacity={0.6}
            />
            
            <XAxis 
              dataKey="time"
              tickFormatter={formatXAxisTick}
              stroke="#64748b"
              fontSize={11}
              interval="preserveStartEnd"
              tick={{ fill: '#64748b' }}
            />
            <YAxis 
              domain={[-150, 150]}
              stroke="#64748b"
              fontSize={11}
              label={{ 
                value: 'Amplitude (μV)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#64748b', fontSize: '12px' }
              }}
              tick={{ fill: '#64748b' }}
            />
            
            {/* Zone d'enveloppe */}
            <Area
              type="monotone"
              dataKey="envelope_max"
              stroke="none"
              fill="url(#envelopeGradient)"
              fillOpacity={0.2}
            />
            
            {/* Signal principal avec effet de lueur */}
            <Line 
              type="monotone" 
              dataKey="amplitude" 
              stroke="#4A90E2"
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
              filter="drop-shadow(0px 0px 3px rgba(74, 144, 226, 0.3))"
            />
            
            {/* Définition du gradient pour l'enveloppe */}
            <defs>
              <linearGradient id="envelopeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4A90E2" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
        
        {/* Indicateur de temps actuel */}
        <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-600 border">
          <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1 animate-pulse"></span>
          Temps réel
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500 bg-gray-50/50 p-3 rounded-lg">
        <div className="flex items-center space-x-4">
          <span>📊 Fréquence: 256 Hz simulé</span>
          <span>⏱️ Fenêtre: {duration}s</span>
        </div>
      </div>
    </div>
  );
};

export default EEGChart;
