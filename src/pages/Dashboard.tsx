import React, { useState, useEffect } from 'react';
import EEGChart from '@/components/EEGChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wifi, Volume2 } from 'lucide-react';
import { jetsonService, JetsonAlert } from '@/services/JetsonTCPService';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import SeizureToast from '@/components/SeizureToast';

interface SeizureAlert {
  id: string;
  timestamp: Date;
  confidence: number;
  source: 'jetson' | 'local';
  predictionTime: string;
  alertType: 'urgent' | 'warning';
}

const Dashboard = () => {
  const [currentAlert, setCurrentAlert] = useState<SeizureAlert | null>(null);
  const [jetsonStatus, setJetsonStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [alertCount, setAlertCount] = useState(0);
  const isMobile = useIsMobile();

  // Simulation d'alertes avec deux types
  useEffect(() => {
    if (jetsonStatus === 'connected') {
      const alertInterval = setInterval(() => {
        if (Math.random() < 0.05) {
          const isUrgent = Math.random() < 0.5;
          
          const newAlert: SeizureAlert = {
            id: Date.now().toString(),
            timestamp: new Date(),
            confidence: Math.floor(Math.random() * 30) + 70,
            source: 'jetson',
            predictionTime: isUrgent ? 'moins de 25 min' : 'moins de 50 min',
            alertType: isUrgent ? 'urgent' : 'warning'
          };
          
          setCurrentAlert(newAlert);
          setAlertCount(prev => prev + 1);
          
          // Son d'alarme de minuteur
          playTimerAlarm(isUrgent);
        }
      }, 5000);

      return () => clearInterval(alertInterval);
    }
  }, [jetsonStatus]);

  // Son d'alarme simple de minuteur
  const playTimerAlarm = (isUrgent: boolean = false) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Son d'alarme simple de minuteur
      const createTimerBeep = (frequency: number, startTime: number, duration: number, volume: number = 0.3) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + startTime + 0.01);
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime + startTime + duration - 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration);
        
        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(audioContext.currentTime + startTime + duration);
      };
      
      if (isUrgent) {
        // Alarme urgente : 4 bips rapides
        createTimerBeep(800, 0, 0.1, 0.4);
        createTimerBeep(800, 0.15, 0.1, 0.4);
        createTimerBeep(800, 0.3, 0.1, 0.4);
        createTimerBeep(800, 0.45, 0.1, 0.4);
      } else {
        // Alarme normale : 2 bips
        createTimerBeep(600, 0, 0.15, 0.3);
        createTimerBeep(600, 0.25, 0.15, 0.3);
      }
      
    } catch (error) {
      console.log('Audio non supporté:', error);
      if (navigator.vibrate) {
        navigator.vibrate(isUrgent ? [100, 50, 100, 50, 100, 50, 100] : [200, 100, 200]);
      }
    }
  };

  // Configuration du service Jetson
  useEffect(() => {
    jetsonService.setCallbacks({
      onAlert: (alert: JetsonAlert) => {
        if (alert.type === 'seizure_detected') {
          const isUrgent = Math.random() < 0.5;
          
          setCurrentAlert({
            id: Date.now().toString(),
            timestamp: alert.timestamp,
            confidence: alert.confidence || 0,
            source: 'jetson',
            predictionTime: isUrgent ? 'moins de 25 min' : 'moins de 50 min',
            alertType: isUrgent ? 'urgent' : 'warning'
          });
        }
      },
      onStatusChange: (status) => {
        setJetsonStatus(status);
      },
      onError: (error) => {
        console.error('Erreur Jetson:', error);
      }
    });

    setTimeout(() => {
      setJetsonStatus('connecting');
      setTimeout(() => {
        setJetsonStatus('connected');
      }, 2000);
    }, 1000);

    return () => {
      jetsonService.disconnect();
    };
  }, []);

  const handleDismissAlert = () => {
    setCurrentAlert(null);
  };

  const testAlertSound = () => {
    playTimerAlarm(false);
    setTimeout(() => {
      playTimerAlarm(true);
    }, 1500);
    
    toast({
      title: "🔊 Test Alarme",
      description: "Son d'alarme testé - normal puis urgent",
    });
  };

  // Couleur de l'alerte basée sur le type
  const getJetsonStatusColor = () => {
    switch (jetsonStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-orange-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getJetsonStatusText = () => {
    switch (jetsonStatus) {
      case 'connected': return 'Jetson Connecté';
      case 'connecting': return 'Connexion...';
      case 'error': return 'Erreur Jetson';
      default: return 'Jetson Hors ligne';
    }
  };

  const getAlertBgColor = () => {
    if (!currentAlert) return 'bg-red-50';
    return currentAlert.alertType === 'urgent' ? 'bg-red-50' : 'bg-orange-50';
  };

  const getAlertBorderColor = () => {
    if (!currentAlert) return 'border-red-200';
    return currentAlert.alertType === 'urgent' ? 'border-red-200' : 'border-orange-200';
  };

  const getAlertIcon = () => {
    if (!currentAlert) return '🚨';
    return currentAlert.alertType === 'urgent' ? '🚨' : '⚠️';
  };

  const getAlertTitle = () => {
    if (!currentAlert) return 'CRISE PRÉDITE';
    return currentAlert.alertType === 'urgent' ? 'CRISE PRÉDITE - URGENT' : 'CRISE PRÉDITE - ATTENTION';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast de crise */}
      {currentAlert && (
        <SeizureToast
          confidence={currentAlert.confidence}
          predictionTime={currentAlert.predictionTime}
          isUrgent={currentAlert.alertType === 'urgent'}
          onDismiss={handleDismissAlert}
        />
      )}

      {/* Graphique EEG responsive */}
      <EEGChart 
        isRealTime={true} 
        duration={30} 
        jetsonConnected={jetsonStatus === 'connected'} 
      />

      {/* Statut Jetson responsive */}
      <div className="w-full">
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut Jetson</CardTitle>
            <Wifi className={`h-4 w-4 ${getJetsonStatusColor()}`} />
          </CardHeader>
          <CardContent>
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  jetsonStatus === 'connected' ? 'bg-green-500' : 
                  jetsonStatus === 'connecting' ? 'bg-orange-500 animate-pulse' : 
                  jetsonStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                }`}></div>
                <span className="text-sm font-medium">{getJetsonStatusText()}</span>
              </div>
              <div className={`flex items-center ${isMobile ? 'justify-between' : 'space-x-2'}`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testAlertSound}
                  className="text-xs"
                >
                  <Volume2 className="w-3 h-3 mr-1" />
                  Test Alarme
                </Button>
                {alertCount > 0 && (
                  <span className="text-xs text-gray-500">
                    Alertes: {alertCount}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              TCP: localhost:8080
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
