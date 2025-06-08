
import React, { useEffect, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Area } from 'recharts';

interface EEGDataPoint {
  timestamp: number;
  amplitude: number;
  time: string;
  envelope_max: number;
  envelope_min: number;
}

interface EEGChartProps {
  isRealTime?: boolean;
  duration?: number;
  onEDFData?: (data: number[]) => void;
}

const EEGChart: React.FC<EEGChartProps> = ({ isRealTime = true, duration = 30, onEDFData }) => {
  const [data, setData] = useState<EEGDataPoint[]>([]);
  const [edfProcessingStatus, setEdfProcessingStatus] = useState<'waiting' | 'processing' | 'error'>('waiting');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fonction pour traiter les données EDF reçues
  const processEDFData = (edfBuffer: ArrayBuffer): number[] => {
    try {
      setEdfProcessingStatus('processing');
      console.log('Traitement fichier EDF, taille:', edfBuffer.byteLength);
      
      // Simulation du traitement EDF - 256 échantillons à 256 Hz (1 seconde)
      const samples: number[] = [];
      const view = new DataView(edfBuffer);
      
      // Simulation de lecture du canal surrogate
      for (let i = 0; i < 256; i++) {
        if (i * 4 < view.byteLength) {
          try {
            const sample = view.getFloat32(i * 4, true);
            samples.push(sample);
          } catch {
            // Si erreur de lecture, générer une valeur simulée
            const time = i / 256;
            const simulatedValue = 50 * Math.sin(2 * Math.PI * 10 * time) + 
                                 25 * Math.sin(2 * Math.PI * 20 * time) + 
                                 (Math.random() - 0.5) * 10;
            samples.push(simulatedValue);
          }
        }
      }
      
      setEdfProcessingStatus('waiting');
      return samples;
    } catch (error) {
      console.error('Erreur traitement EDF:', error);
      setEdfProcessingStatus('error');
      return [];
    }
  };

  // Convertir les échantillons EDF en points de données pour le graphique
  const convertSamplesToDataPoints = (samples: number[]): void => {
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

    setData(prevData => {
      const updatedData = [...prevData, ...newDataPoints];
      const cutoffTime = now - (duration * 1000);
      return updatedData.filter(point => point.timestamp >= cutoffTime);
    });
  };

  // Gestionnaire de fichier EDF
  const handleEDFFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result instanceof ArrayBuffer) {
        const samples = processEDFData(event.target.result);
        if (samples.length > 0) {
          convertSamplesToDataPoints(samples);
          onEDFData?.(samples);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Simulation de réception de fichiers EDF toutes les secondes
  useEffect(() => {
    if (!isRealTime) return;

    // Initialisation avec des données simulées
    const initialData: EEGDataPoint[] = [];
    const now = Date.now();
    for (let i = 0; i < duration * 10; i++) {
      const timestamp = now - (duration * 1000) + (i * 100);
      const time = timestamp / 1000;
      const amplitude = 50 * Math.sin(2 * Math.PI * 10 * time) + 
                       25 * Math.sin(2 * Math.PI * 20 * time) + 
                       (Math.random() - 0.5) * 10;
      
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
    }
    setData(initialData);

    // Simulation de réception EDF toutes les secondes
    intervalRef.current = setInterval(() => {
      // Simulation d'un fichier EDF de 1 seconde
      const samples: number[] = [];
      for (let i = 0; i < 256; i++) {
        const time = i / 256;
        const amplitude = 50 * Math.sin(2 * Math.PI * 10 * (Date.now() / 1000 + time)) + 
                         25 * Math.sin(2 * Math.PI * 20 * (Date.now() / 1000 + time)) + 
                         (Math.random() - 0.5) * 10;
        samples.push(amplitude);
      }
      convertSamplesToDataPoints(samples);
      onEDFData?.(samples);
    }, 1000); // Toutes les secondes

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
          Signal EEG Canal Surrogate
        </h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Fréquence: 256 Hz</span>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-1 ${
              edfProcessingStatus === 'processing' ? 'bg-yellow-500 animate-pulse' :
              edfProcessingStatus === 'error' ? 'bg-red-500' : 'bg-green-500'
            }`}></div>
            <span className="text-xs">
              {edfProcessingStatus === 'processing' ? 'Traitement...' :
               edfProcessingStatus === 'error' ? 'Erreur' : 'Prêt'}
            </span>
          </div>
        </div>
      </div>
      
      <div style={{ width: '100%', height: '450px' }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid 
              strokeDasharray="2 4" 
              stroke="#E1E5E9" 
              strokeWidth={0.8}
              opacity={0.6}
            />
            
            <ReferenceLine 
              y={0} 
              stroke="#2C3E50" 
              strokeWidth={1}
              strokeOpacity={0.7}
            />
            
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
            
            <Line 
              type="monotone" 
              dataKey="amplitude" 
              stroke="#4A90E2"
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-600 border">
          <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1 animate-pulse"></span>
          EDF Live
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500 bg-gray-50/50 p-3 rounded-lg">
        <div className="flex items-center space-x-4">
          <span>📁 Source: Fichiers EDF PC</span>
          <span>⏱️ Fenêtre: {duration}s</span>
          <span>🔄 Mise à jour: 1s</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".edf"
          onChange={(e) => e.target.files?.[0] && handleEDFFile(e.target.files[0])}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-xs px-2 py-1 bg-medical-blue text-white rounded hover:bg-medical-blue/90"
        >
          Charger EDF
        </button>
      </div>
    </div>
  );
};

export default EEGChart;
