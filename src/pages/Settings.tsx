
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, Bell, Monitor, Wifi, Save, TestTube } from 'lucide-react';

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    // Profil
    email: 'docteur@medical.com',
    fullName: 'Dr. Martin Durand',
    
    // Alertes
    soundVolume: [75],
    emailNotifications: true,
    seizureAlerts: true,
    systemAlerts: true,
    secondaryEmail: '',
    
    // Affichage
    displayDuration: '30',
    amplitudeSensitivity: [50],
    chartColors: 'medical',
    
    // Connexion
    jetsonIP: '192.168.1.100',
    jetsonPort: '8080',
    autoReconnect: true
  });

  const handleSave = () => {
    toast({
      title: "Paramètres sauvegardés",
      description: "Vos modifications ont été enregistrées avec succès.",
    });
  };

  const testConnection = async () => {
    toast({
      title: "Test de connexion...",
      description: "Vérification de la connexion avec le Jetson Nano.",
    });
    
    // Simulation du test
    setTimeout(() => {
      toast({
        title: "Connexion réussie",
        description: `Connecté à ${settings.jetsonIP}:${settings.jetsonPort}`,
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>
        <Button onClick={handleSave} className="bg-medical-blue hover:bg-medical-blue/90">
          <Save className="w-4 h-4 mr-2" />
          Sauvegarder
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profil utilisateur */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Profil Utilisateur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                value={settings.fullName}
                onChange={(e) => setSettings(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Photo de profil</Label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-medical-blue rounded-full flex items-center justify-center text-white font-semibold text-xl">
                  {settings.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <Button variant="outline" size="sm">
                  Changer la photo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paramètres d'alertes */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Alertes et Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="seizureAlerts">Alertes de crises</Label>
                <p className="text-sm text-gray-500">Notifications lors de détections</p>
              </div>
              <Switch
                id="seizureAlerts"
                checked={settings.seizureAlerts}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, seizureAlerts: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="systemAlerts">Alertes système</Label>
                <p className="text-sm text-gray-500">Notifications de déconnexion</p>
              </div>
              <Switch
                id="systemAlerts"
                checked={settings.systemAlerts}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, systemAlerts: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Notifications email</Label>
                <p className="text-sm text-gray-500">Recevoir les alertes par email</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secondaryEmail">Email secondaire (optionnel)</Label>
              <Input
                id="secondaryEmail"
                type="email"
                placeholder="email.urgence@hopital.com"
                value={settings.secondaryEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, secondaryEmail: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Volume des alertes sonores: {settings.soundVolume[0]}%</Label>
              <Slider
                value={settings.soundVolume}
                onValueChange={(value) => setSettings(prev => ({ ...prev, soundVolume: value }))}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Paramètres d'affichage */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="w-5 h-5 mr-2" />
              Affichage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayDuration">Durée d'affichage du signal</Label>
              <Select value={settings.displayDuration} onValueChange={(value) => setSettings(prev => ({ ...prev, displayDuration: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 secondes</SelectItem>
                  <SelectItem value="30">30 secondes</SelectItem>
                  <SelectItem value="60">60 secondes</SelectItem>
                  <SelectItem value="120">2 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Sensibilité d'amplitude: {settings.amplitudeSensitivity[0]}%</Label>
              <Slider
                value={settings.amplitudeSensitivity}
                onValueChange={(value) => setSettings(prev => ({ ...prev, amplitudeSensitivity: value }))}
                max={100}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Ajuste la sensibilité de détection des variations d'amplitude
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="chartColors">Thème de couleurs</Label>
              <Select value={settings.chartColors} onValueChange={(value) => setSettings(prev => ({ ...prev, chartColors: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Médical (Bleu)</SelectItem>
                  <SelectItem value="classic">Classique (Noir)</SelectItem>
                  <SelectItem value="high-contrast">Contraste élevé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Paramètres de connexion */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wifi className="w-5 h-5 mr-2" />
              Connexion Jetson Nano
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jetsonIP">Adresse IP</Label>
              <Input
                id="jetsonIP"
                placeholder="192.168.1.100"
                value={settings.jetsonIP}
                onChange={(e) => setSettings(prev => ({ ...prev, jetsonIP: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jetsonPort">Port de communication</Label>
              <Input
                id="jetsonPort"
                placeholder="8080"
                value={settings.jetsonPort}
                onChange={(e) => setSettings(prev => ({ ...prev, jetsonPort: e.target.value }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoReconnect">Reconnexion automatique</Label>
                <p className="text-sm text-gray-500">Se reconnecter en cas de perte</p>
              </div>
              <Switch
                id="autoReconnect"
                checked={settings.autoReconnect}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoReconnect: checked }))}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <Button
                onClick={testConnection}
                variant="outline"
                className="w-full"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Tester la connexion
              </Button>
              
              <div className="flex items-center justify-between text-sm">
                <span>Statut actuel:</span>
                <Badge className="bg-mint-green text-green-800">
                  Connecté
                </Badge>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Dernière connexion: {new Date().toLocaleString('fr-FR')}</p>
                <p>• Données reçues: 1,247 segments</p>
                <p>• Temps de latence: 12ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations système */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle>Informations Système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="font-medium">Version de l'application</Label>
              <p className="text-gray-600">v2.1.0</p>
            </div>
            <div>
              <Label className="font-medium">Algorithme IA</Label>
              <p className="text-gray-600">SeizureDetect v2.1</p>
            </div>
            <div>
              <Label className="font-medium">Dernière mise à jour</Label>
              <p className="text-gray-600">30 mai 2024</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
