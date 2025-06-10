
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
          const newAlert: SeizureAlert = {
            id: Date.now().toString(),
            timestamp: new Date(),
            confidence: Math.floor(Math.random() * 30) + 70, // 70-99%
            source: 'jetson'
          };
          
          setCurrentAlert(newAlert);
          setAlertCount(prev => prev + 1);
          
          // Notification sonore
          playAlertSound();
          
          // Toast notification
          toast({
            title: "🚨 Crise Prédites",
            description: `Confiance: ${newAlert.confidence}% - ${newAlert.timestamp.toLocaleTimeString('fr-FR')}`,
            variant: "destructive",
          });
        }
      }, 5000);

      return () => clearInterval(alertInterval);
    }
  }, [jetsonStatus]);

  // Fonction pour jouer le son d'alerte
  const playAlertSound = () => {
    try {
      // Créer un contexte audio pour générer un son d'alerte
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Premier beep
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      
      oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator1.type = 'sine';
      
      gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.5);
      
      // Deuxième beep
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator2.type = 'sine';
        
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.5);
      }, 600);
      
    } catch (error) {
      console.log('Audio non supporté:', error);
    }
  };

  // Configuration du service Jetson
  useEffect(() => {
    jetsonService.setCallbacks({
      onAlert: (alert: JetsonAlert) => {
        if (alert.type === 'seizure_detected') {
          setCurrentAlert({
            id: Date.now().toString(),
            timestamp: alert.timestamp,
            confidence: alert.confidence || 0,
            source: 'jetson'
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
    playAlertSound();
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
                <strong className="text-red-600">🚨 CRISE PRÉDITES</strong>
                <div className="mt-1 text-sm">
                  Source: {currentAlert.source === 'jetson' ? 'Jetson Nano' : 'Analyse EDF'} | 
                  Confiance: {currentAlert.confidence}% | 
                  Heure: {currentAlert.timestamp.toLocaleTimeString('fr-FR')}
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
