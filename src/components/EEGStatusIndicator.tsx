
import React from 'react';
import { Activity, Upload } from 'lucide-react';
import { EDFProcessingStatus } from '@/types/eeg';

interface EEGStatusIndicatorProps {
  edfProcessingStatus: EDFProcessingStatus;
  duration: number;
  onFileUpload: (file: File) => void;
}

const EEGStatusIndicator: React.FC<EEGStatusIndicatorProps> = ({ 
  edfProcessingStatus, 
  duration, 
  onFileUpload 
}) => {
  const getStatusColor = () => {
    switch (edfProcessingStatus) {
      case 'processing': return 'text-soft-orange';
      case 'error': return 'text-coral-red';
      default: return 'text-mint-green';
    }
  };

  const getStatusText = () => {
    switch (edfProcessingStatus) {
      case 'processing': return 'Traitement en cours...';
      case 'error': return 'Erreur de traitement';
      default: return 'Signal EEG actif';
    }
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="flex items-center">
          <Activity className={`w-5 h-5 mr-2 ${getStatusColor()}`} />
          <span className="font-medium text-gray-800">EEG Monitor</span>
        </div>
        <div className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>
      <div className="text-sm text-gray-600">
        Canal: Surrogate | 256 Hz
      </div>
    </div>
  );
};

export default EEGStatusIndicator;
