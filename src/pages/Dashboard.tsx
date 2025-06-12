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
        // Simulation aléatoire d'alertes (5% de chance toutes les 5 secondes)
        if (Math.random() < 0.05) {
          // Déterminer le type d'alerte (50% urgent, 50% warning)
          const isUrgent = Math.random() < 0.5;
          
          const newAlert: SeizureAlert = {
            id: Date.now().toString(),
            timestamp: new Date(),
            confidence: Math.floor(Math.random() * 30) + 70, // 70-99%
            source: 'jetson',
            predictionTime: isUrgent ? 'moins de 25 min' : 'moins de 50 min',
            alertType: isUrgent ? 'urgent' : 'warning'
          };
          
          setCurrentAlert(newAlert);
          setAlertCount(prev => prev + 1);
          
          // Notification sonore professionnelle améliorée
          playProfessionalAlertSound(isUrgent);
          
          // Toast notification avec type d'alerte
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

  // Fonction pour jouer un son d'alerte professionnel et sophistiqué
  const playProfessionalAlertSound = (isUrgent: boolean = false) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Fonction pour créer un beep médical propre
      const createMedicalBeep = (frequency: number, startTime: number, duration: number, volume: number = 0.3) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        // Chaîne audio: Oscillator -> Filter -> Gain -> Destination
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Configuration de l'oscillateur
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime);
        oscillator.type = 'sine'; // Onde sinusoïdale pure pour un son médical propre
        
        // Filtre passe-bas pour adoucir le son
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, audioContext.currentTime + startTime);
        filter.Q.setValueAtTime(1, audioContext.currentTime + startTime);
        
        // Enveloppe ADSR sophistiquée
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + startTime + 0.05); // Attack
        gainNode.gain.linearRampToValueAtTime(volume * 0.8, audioContext.currentTime + startTime + 0.1); // Decay
        gainNode.gain.setValueAtTime(volume * 0.8, audioContext.currentTime + startTime + duration - 0.1); // Sustain
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration); // Release
        
        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(audioContext.currentTime + startTime + duration);
      };
      
      if (isUrgent) {
        // Séquence d'urgence : 3 beeps rapides + tonalité continue
        createMedicalBeep(800, 0, 0.2, 0.4);      // Premier beep urgent
        createMedicalBeep(1000, 0.3, 0.2, 0.4);   // Deuxième beep plus aigu
        createMedicalBeep(1200, 0.6, 0.2, 0.4);   // Troisième beep très aigu
        
        // Tonalité continue d'urgence
        setTimeout(() => {
          const urgentTone = audioContext.createOscillator();
          const urgentGain = audioContext.createGain();
          const urgentFilter = audioContext.createBiquadFilter();
          
          urgentTone.connect(urgentFilter);
          urgentFilter.connect(urgentGain);
          urgentGain.connect(audioContext.destination);
          
          urgentTone.frequency.setValueAtTime(600, audioContext.currentTime);
          urgentTone.type = 'sine';
          
          urgentFilter.type = 'lowpass';
          urgentFilter.frequency.setValueAtTime(1500, audioContext.currentTime);
          
          urgentGain.gain.setValueAtTime(0.25, audioContext.currentTime);
          urgentGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5);
          
          urgentTone.start(audioContext.currentTime);
          urgentTone.stop(audioContext.currentTime + 1.5);
        }, 900);
      } else {
        // Séquence d'attention : 2 beeps doux + écho
        createMedicalBeep(500, 0, 0.3, 0.25);     // Premier beep doux
        createMedicalBeep(700, 0.5, 0.3, 0.25);   // Deuxième beep
        
        // Écho subtil
        setTimeout(() => {
          createMedicalBeep(600, 0, 0.4, 0.15);
        }, 1000);
      }
      
    } catch (error) {
      console.log('Audio non supporté:', error);
      // Fallback : vibration si supportée
      if (navigator.vibrate) {
        navigator.vibrate(isUrgent ? [200, 100, 200, 100, 400] : [300, 200, 300]);
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

    // Démarrer la connexion automatiquement pour la simulation
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
    // Test des deux types de sons
    playProfessionalAlertSound(false);
    setTimeout(() => {
      playProfessionalAlertSound(true);
    }, 2000);
    
    toast({
      title: "🔊 Test Audio",
      description: "Son d'alerte testé - attention puis urgent",
    });
  };

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

  // Couleur de l'alerte basée sur le type
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
                  Test Son
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
