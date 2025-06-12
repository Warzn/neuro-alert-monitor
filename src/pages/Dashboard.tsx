import React, { useState, useEffect } from 'react';
import EEGChart from '@/components/EEGChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wifi, X, Volume2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { jetsonService, JetsonAlert } from '@/services/JetsonTCPService';
import { toast } from '@/hooks/use-toast';

interface SeizureAlert {
  id: string;
  timestamp: Date;
  confidence: number;
  source: 'jetson' | 'local';
  predictionTime: string;
  alertType: 'urgent' | 'warning'; // Type d'alerte
}

const Dashboard = () => {
  const [currentAlert, setCurrentAlert] = useState<SeizureAlert | null>(null);
  const [jetsonStatus, setJetsonStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [alertCount, setAlertCount] = useState(0);

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
          
          // Son d'alarme de danger professionnel
          playDangerAlarm(isUrgent);
          
          toast({
            title: isUrgent ? "🚨 Crise Prédite - Urgent" : "⚠️ Crise Prédite - Attention",
            description: `Confiance: ${newAlert.confidence}% - Prévue dans ${newAlert.predictionTime}`,
            variant: "destructive",
          });
        }
      }, 5000);

      return () => clearInterval(alertInterval);
    }
  }, [jetsonStatus]);

  // Fonction pour jouer un son d'alarme de danger professionnel
  const playDangerAlarm = (isUrgent: boolean = false) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Fonction pour créer un beep d'alarme médical
      const createAlarmBeep = (frequency: number, startTime: number, duration: number, volume: number = 0.4) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime);
        oscillator.type = 'square'; // Onde carrée pour un son d'alarme plus percutant
        
        // Filtre pour adoucir légèrement
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, audioContext.currentTime + startTime);
        filter.Q.setValueAtTime(2, audioContext.currentTime + startTime);
        
        // Enveloppe pour l'alarme
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + startTime + 0.02);
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime + startTime + duration - 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration);
        
        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(audioContext.currentTime + startTime + duration);
      };
      
      if (isUrgent) {
        // Alarme d'urgence : Séquence rapide + sirène continue
        createAlarmBeep(1000, 0, 0.15, 0.5);    // Beep 1
        createAlarmBeep(1200, 0.2, 0.15, 0.5);  // Beep 2
        createAlarmBeep(1000, 0.4, 0.15, 0.5);  // Beep 3
        createAlarmBeep(1200, 0.6, 0.15, 0.5);  // Beep 4
        
        // Sirène d'urgence continue
        setTimeout(() => {
          const sirenOsc = audioContext.createOscillator();
          const sirenGain = audioContext.createGain();
          const sirenFilter = audioContext.createBiquadFilter();
          
          sirenOsc.connect(sirenFilter);
          sirenFilter.connect(sirenGain);
          sirenGain.connect(audioContext.destination);
          
          sirenOsc.type = 'sawtooth';
          sirenFilter.type = 'lowpass';
          sirenFilter.frequency.setValueAtTime(2000, audioContext.currentTime);
          
          // Modulation de fréquence pour effet sirène
          sirenOsc.frequency.setValueAtTime(800, audioContext.currentTime);
          sirenOsc.frequency.linearRampToValueAtTime(1400, audioContext.currentTime + 0.5);
          sirenOsc.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 1.0);
          sirenOsc.frequency.linearRampToValueAtTime(1400, audioContext.currentTime + 1.5);
          sirenOsc.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 2.0);
          
          sirenGain.gain.setValueAtTime(0.3, audioContext.currentTime);
          sirenGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2.0);
          
          sirenOsc.start(audioContext.currentTime);
          sirenOsc.stop(audioContext.currentTime + 2.0);
        }, 800);
        
      } else {
        // Alarme d'attention : Double beep + tonalité descendante
        createAlarmBeep(900, 0, 0.2, 0.35);     // Beep 1
        createAlarmBeep(900, 0.3, 0.2, 0.35);   // Beep 2
        
        // Tonalité descendante d'attention
        setTimeout(() => {
          const descendingOsc = audioContext.createOscillator();
          const descendingGain = audioContext.createGain();
          const descendingFilter = audioContext.createBiquadFilter();
          
          descendingOsc.connect(descendingFilter);
          descendingFilter.connect(descendingGain);
          descendingGain.connect(audioContext.destination);
          
          descendingOsc.type = 'triangle';
          descendingFilter.type = 'lowpass';
          descendingFilter.frequency.setValueAtTime(1800, audioContext.currentTime);
          
          descendingOsc.frequency.setValueAtTime(1000, audioContext.currentTime);
          descendingOsc.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 1.2);
          
          descendingGain.gain.setValueAtTime(0.25, audioContext.currentTime);
          descendingGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.2);
          
          descendingOsc.start(audioContext.currentTime);
          descendingOsc.stop(audioContext.currentTime + 1.2);
        }, 600);
      }
      
    } catch (error) {
      console.log('Audio non supporté:', error);
      // Fallback : vibration si supportée
      if (navigator.vibrate) {
        navigator.vibrate(isUrgent ? [200, 100, 200, 100, 500] : [400, 200, 400]);
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

  const handleAcknowledgeAlert = () => {
    setCurrentAlert(null);
  };

  const testAlertSound = () => {
    playDangerAlarm(false);
    setTimeout(() => {
      playDangerAlarm(true);
    }, 3000);
    
    toast({
      title: "🔊 Test Alarme",
      description: "Son d'alarme testé - attention puis urgent",
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
    <div className="space-y-6">
      {/* Alerte de crise avec deux types */}
      {currentAlert && (
        <div className="alert-animation">
          <Alert className={`${getAlertBgColor()} ${getAlertBorderColor()}`}>
            <AlertTriangle className={`h-4 w-4 ${currentAlert.alertType === 'urgent' ? 'text-red-600' : 'text-orange-600'}`} />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <strong className={currentAlert.alertType === 'urgent' ? 'text-red-600' : 'text-orange-600'}>
                  {getAlertIcon()} {getAlertTitle()}
                </strong>
                <div className="mt-1 text-sm">
                  Source: {currentAlert.source === 'jetson' ? 'Jetson Nano' : 'Analyse EDF'} | 
                  Confiance: {currentAlert.confidence}% | 
                  Prévue dans: {currentAlert.predictionTime}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAcknowledgeAlert}
                className="ml-4"
              >
                <X className="w-4 h-4 mr-1" />
                Acquitter
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Graphique EEG avec signal périodique simple */}
      <EEGChart 
        isRealTime={true} 
        duration={30} 
        jetsonConnected={jetsonStatus === 'connected'} 
      />

      {/* Statut Jetson */}
      <div className="w-full">
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut Jetson</CardTitle>
            <Wifi className={`h-4 w-4 ${getJetsonStatusColor()}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  jetsonStatus === 'connected' ? 'bg-green-500' : 
                  jetsonStatus === 'connecting' ? 'bg-orange-500 animate-pulse' : 
                  jetsonStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                }`}></div>
                <span className="text-sm font-medium">{getJetsonStatusText()}</span>
              </div>
              <div className="flex items-center space-x-2">
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
