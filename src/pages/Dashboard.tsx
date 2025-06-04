import React, { useState, useEffect } from 'react';
import EEGChart from '@/components/EEGChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Signal, Wifi, X, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SeizureAlert {
  id: string;
  timestamp: Date;
  confidence: number;
}

const Dashboard = () => {
  const [signalQuality, setSignalQuality] = useState(85);
  const [avgAmplitude, setAvgAmplitude] = useState(45);
  const [currentAlert, setCurrentAlert] = useState<SeizureAlert | null>(null);

  // Simulation des métriques
  useEffect(() => {
    const interval = setInterval(() => {
      setSignalQuality(prev => Math.max(60, Math.min(100, prev + (Math.random() - 0.5) * 10)));
      setAvgAmplitude(prev => Math.max(20, Math.min(80, prev + (Math.random() - 0.5) * 8)));
      
      // Simulation d'alerte (très rare)
      if (Math.random() < 0.001) { // 0.1% de chance
        setCurrentAlert({
          id: Date.now().toString(),
          timestamp: new Date(),
          confidence: Math.round(Math.random() * 30 + 70) // 70-100%
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleAcknowledgeAlert = () => {
    setCurrentAlert(null);
  };

  const getSignalQualityColor = (quality: number) => {
    if (quality >= 80) return 'bg-mint-green';
    if (quality >= 60) return 'bg-soft-orange';
    return 'bg-coral-red';
  };

  return (
    <div className="space-y-6">
      {/* Alerte de crise simplifiée */}
      {currentAlert && (
        <div className="alert-animation">
          <Alert className="bg-coral-red/10 border-coral-red">
            <AlertTriangle className="h-4 w-4 coral-red" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <strong className="coral-red">🚨 CRISE DÉTECTÉE</strong>
                <div className="mt-1">
                  Une activité épileptique a été détectée | 
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

      {/* Graphique EEG */}
      <EEGChart isRealTime={true} duration={30} />

      {/* Métriques en temps réel - simplifiées */}
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
              Signal dans la plage normale
            </p>
          </CardContent>
        </Card>

        {/* Statut connexion */}
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut Système</CardTitle>
            <Wifi className="h-4 w-4 mint-green" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-mint-green rounded-full status-pulse mr-2"></div>
              <span className="text-sm font-medium">Connecté</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Jetson Nano en ligne
            </p>
            <p className="text-xs text-muted-foreground">
              Dernière donnée: Il y a 2s
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informations additionnelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-lg">Configuration Actuelle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Canaux EEG:</span>
              <span className="text-sm font-medium">23 canaux actifs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Fréquence d'échantillonnage:</span>
              <span className="text-sm font-medium">256 Hz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Durée segment:</span>
              <span className="text-sm font-medium">15 secondes</span>
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
                <span>Calibration terminée</span>
                <span className="text-gray-500">09:18</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Monitoring actif</span>
                <span className="text-gray-500">09:20</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="mint-green">Signal optimal détecté</span>
                <span className="text-gray-500">09:25</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
