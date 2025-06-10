import React, { useState, useEffect } from 'react';
import EEGChart from '@/components/EEGChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wifi, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { jetsonService, JetsonAlert } from '@/services/JetsonTCPService';

interface SeizureAlert {
  id: string;
  timestamp: Date;
  confidence: number;
  source: 'jetson' | 'local';
}

const Dashboard = () => {
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

  const handleAcknowledgeAlert = () => {
    setCurrentAlert(null);
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

      {/* Graphique EEG avec signal simulé basé sur connexion Jetson */}
      <EEGChart 
        isRealTime={true} 
        duration={30} 
        jetsonConnected={jetsonStatus === 'connected'} 
      />

      {/* Statut Jetson uniquement */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-md">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
