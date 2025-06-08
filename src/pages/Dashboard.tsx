
import React, { useState, useEffect } from 'react';
import EEGChart from '@/components/EEGChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Signal, Wifi, X, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { jetsonService, JetsonAlert } from '@/services/JetsonTCPService';

interface SeizureAlert {
  id: string;
  timestamp: Date;
  confidence: number;
  source: 'jetson' | 'local';
}

const Dashboard = () => {
  const [signalQuality, setSignalQuality] = useState(85);
  const [avgAmplitude, setAvgAmplitude] = useState(45);
  const [currentAlert, setCurrentAlert] = useState<SeizureAlert | null>(null);
  const [jetsonStatus, setJetsonStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastEDFUpdate, setLastEDFUpdate] = useState<Date>(new Date());

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

    // Démarrer la connexion
    jetsonService.connect();

    return () => {
      jetsonService.disconnect();
    };
  }, []);

  // Simulation des métriques
  useEffect(() => {
    const interval = setInterval(() => {
      setSignalQuality(prev => Math.max(60, Math.min(100, prev + (Math.random() - 0.5) * 10)));
      setAvgAmplitude(prev => Math.max(20, Math.min(80, prev + (Math.random() - 0.5) * 8)));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Gestionnaire de données EDF reçues
  const handleEDFData = (samples: number[]) => {
    setLastEDFUpdate(new Date());
    
    // Calculer l'amplitude moyenne des nouveaux échantillons
    const avg = samples.reduce((sum, sample) => sum + Math.abs(sample), 0) / samples.length;
    setAvgAmplitude(Math.round(avg));
    
    // Simuler une alerte locale basée sur les données EDF (rare)
    const maxAmplitude = Math.max(...samples.map(s => Math.abs(s)));
    if (maxAmplitude > 120 && Math.random() < 0.001) {
      setCurrentAlert({
        id: Date.now().toString(),
        timestamp: new Date(),
        confidence: Math.round(85 + Math.random() * 15),
        source: 'local'
      });
    }
  };

  const handleAcknowledgeAlert = () => {
    setCurrentAlert(null);
  };

  const getSignalQualityColor = (quality: number) => {
    if (quality >= 80) return 'bg-mint-green';
    if (quality >= 60) return 'bg-soft-orange';
    return 'bg-coral-red';
  };

  const getJetsonStatusColor = () => {
    switch (jetsonStatus) {
      case 'connected': return 'mint-green';
      case 'connecting': return 'soft-orange';
      case 'error': return 'coral-red';
      default: return 'gray-400';
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
          <Alert className="bg-coral-red/10 border-coral-red">
            <AlertTriangle className="h-4 w-4 coral-red" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <strong className="coral-red">🚨 CRISE DÉTECTÉE</strong>
                <div className="mt-1">
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

      {/* Graphique EEG avec données EDF */}
      <EEGChart isRealTime={true} duration={30} onEDFData={handleEDFData} />

      {/* Métriques en temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Qualité du signal */}
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualité Signal</CardTitle>
            <Signal className="h-4 w-4 medical-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(signalQuality)}%</div>
            <div className="mt-2">
              <Progress 
                value={signalQuality} 
                className={`h-2 ${getSignalQualityColor(signalQuality)}`}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {signalQuality >= 80 ? 'Excellent' : signalQuality >= 60 ? 'Bon' : 'Faible'}
            </p>
          </CardContent>
        </Card>

        {/* Amplitude Moyenne */}
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amplitude Moy</CardTitle>
            <Activity className="h-4 w-4 medical-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgAmplitude)} μV</div>
            <p className="text-xs text-muted-foreground">
              Canal surrogate EDF
            </p>
          </CardContent>
        </Card>

        {/* Statut Jetson */}
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut Jetson</CardTitle>
            <Wifi className={`h-4 w-4 ${getJetsonStatusColor()}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className={`w-3 h-3 bg-${getJetsonStatusColor()} rounded-full mr-2 ${
                jetsonStatus === 'connecting' ? 'animate-pulse' : jetsonStatus === 'connected' ? 'status-pulse' : ''
              }`}></div>
              <span className="text-sm font-medium">{getJetsonStatusText()}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              TCP: localhost:8080
            </p>
            <p className="text-xs text-muted-foreground">
              EDF: {lastEDFUpdate.toLocaleTimeString('fr-FR')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informations système */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-lg">Configuration Actuelle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Canal EEG:</span>
              <span className="text-sm font-medium">Surrogate</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Fréquence d'échantillonnage:</span>
              <span className="text-sm font-medium">256 Hz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Source données:</span>
              <span className="text-sm font-medium">Fichiers EDF PC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Alertes:</span>
              <span className="text-sm font-medium">Jetson TCP</span>
            </div>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-lg">Activité Récente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <div className="flex items-center justify-between py-2">
                <span>Système démarré</span>
                <span className="text-gray-500">09:15</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Connexion Jetson</span>
                <span className="text-gray-500">{jetsonStatus === 'connected' ? '09:18' : 'En cours...'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Réception EDF active</span>
                <span className="text-gray-500">09:20</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="mint-green">Monitoring actif</span>
                <span className="text-gray-500">{lastEDFUpdate.toLocaleTimeString('fr-FR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
