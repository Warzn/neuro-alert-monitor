
export interface EEGDataPoint {
  timestamp: number;
  amplitude: number;
  time: string;
  envelope_max: number;
  envelope_min: number;
}

export interface EEGChartProps {
  isRealTime?: boolean;
  duration?: number;
  onEDFData?: (samples: number[]) => void;
}

export type EDFProcessingStatus = 'waiting' | 'processing' | 'error';
