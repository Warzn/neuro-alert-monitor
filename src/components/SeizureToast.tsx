
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SeizureToastProps {
  confidence: number;
  predictionTime: string;
  isUrgent: boolean;
  onDismiss: () => void;
}

const SeizureToast: React.FC<SeizureToastProps> = ({
  confidence,
  predictionTime,
  isUrgent,
  onDismiss
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 w-80 animate-slide-in-right">
      <div className={`rounded-lg border-l-4 p-4 shadow-lg ${
        isUrgent 
          ? 'bg-red-500 border-red-600 text-white' 
          : 'bg-orange-500 border-orange-600 text-white'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">
                🚨 Crise Prédite - {isUrgent ? 'Urgent' : 'Attention'}
              </h4>
              <p className="text-sm opacity-90">
                Confiance: {confidence}% - Prévue dans {predictionTime}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-white hover:bg-white/20 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SeizureToast;
