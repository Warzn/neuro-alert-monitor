
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
}

const Dashboard = () => {
  const [currentAlert, setCurrentAlert] = useState<SeizureAlert | null>(null);
  const [jetsonStatus, setJetsonStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [alertCount, setAlertCount] = useState(0);

  // Simulation d'alertes
  useEffect(() => {
    if (jetsonStatus === 'connected') {
      const alertInterval = setInterval(() => {
        // Simulation aléatoire d'alertes (5% de chance toutes les 5 secondes)
        if (Math.random() < 0.05) {
          const minTime = Math.floor(Math.random() * 25) + 25; // 25-50 min
          const maxTime = minTime + Math.floor(Math.random() * 10); // +0-10 min
          
          const newAlert: SeizureAlert = {
            id: Date.now().toString(),
            timestamp: new Date(),
            confidence: Math.floor(Math.random() * 30) + 70, // 70-99%
            source: 'jetson',
            predictionTime: `${minTime}-${maxTime} min`
          };
          
          setCurrentAlert(newAlert);
          setAlertCount(prev => prev + 1);
          
          // Notification sonore améliorée
          playEnhancedAlertSound();
          
          // Toast notification
          toast({
            title: "🚨 Crise Prédite",
            description: `Confiance: ${newAlert.confidence}% - Prévue dans ${newAlert.predictionTime}`,
            variant: "destructive",
          });
        }
      }, 5000);

      return () => clearInterval(alertInterval);
    }
  }, [jetsonStatus]);

  // Fonction pour jouer un son d'alerte amélioré et plus attirant
  const playEnhancedAlertSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Première séquence - son urgent montant
      const createUrgentBeep = (freq: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + startTime);
        oscillator.frequency.exponentialRampToValueAtTime(freq * 1.5, audioContext.currentTime + startTime + duration);
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
        gainNode.gain.rapidlyTo(0.4, audioContext.currentTime + startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);
        
        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(audioContext.currentTime + startTime + duration);
      };
      
      // Séquence d'alarme médical
      createUrgentBeep(800, 0, 0.3);      // Premier beep
      createUrgentBeep(1000, 0.4, 0.3);   // Deuxième beep plus aigu
      createUrgentBeep(1200, 0.8, 0.3);   // Troisième beep encore plus aigu
      
      // Son continu d'alerte grave
      setTimeout(() => {
        const lowOscillator = audioContext.createOscillator();
        const lowGain = audioContext.createGain();
        
        lowOscillator.connect(lowGain);
        lowGain.connect(audioContext.destination);
        
        lowOscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        lowOscillator.type = 'square';
        
        lowGain.gain.setValueAtTime(0.2, audioContext.currentTime);
        lowGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
        
        lowOscillator.start(audioContext.currentTime);
        lowOscillator.stop(audioContext.currentTime + 1.5);
      }, 1200);
      
    } catch (error) {
      console.log('Audio non supporté:', error);
    }
  };

  // Configuration du service Jetson
  useEffect(() => {
    jetsonService.setCallbacks({
      onAlert: (alert: JetsonAlert) => {
        if (alert.type === 'seizure_detected') {
          const minTime = Math.floor(Math.random() * 25) + 25;
          const maxTime = minTime + Math.floor(Math.random() * 10);
          
          setCurrentAlert({
            id: Date.now().toString(),
            timestamp: alert.timestamp,
            confidence: alert.confidence || 0,
            source: 'jetson',
            predictionTime: `${minTime}-${maxTime} min`
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
    playEnhancedAlertSound();
    toast({
      title: "🔊 Test Audio",
      description: "Son d'alerte testé avec succès",
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

  return (
    <div className="space-y-6">
      {/* Alerte de crise */}
      {currentAlert && (
        <div className="alert-animation">
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <strong className="text-red-600">🚨 CRISE PRÉDITE</strong>
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

      {/* Graphique EEG avec signal simulé basé sur connexion Jetson */}
      <EEGChart 
        isRealTime={true} 
        duration={30} 
        jetsonConnected={jetsonStatus === 'connected'} 
      />

      {/* Statut Jetson avec même largeur que le graphique */}
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
