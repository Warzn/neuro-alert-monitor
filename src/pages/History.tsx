
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Eye, FileText, Filter } from 'lucide-react';

interface SeizureRecord {
  id: string;
  date: Date;
  type: 'ictal' | 'preictal' | 'postictal' | 'interictal';
  duration: number; // en secondes
  confidence: number;
  acknowledged: boolean;
}

const History = () => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Données simulées
  const seizureHistory: SeizureRecord[] = [
    {
      id: '1',
      date: new Date('2024-05-30T14:32:00'),
      type: 'ictal',
      duration: 45,
      confidence: 95,
      acknowledged: true
    },
    {
      id: '2',
      date: new Date('2024-05-29T09:15:00'),
      type: 'preictal',
      duration: 120,
      confidence: 87,
      acknowledged: true
    },
    {
      id: '3',
      date: new Date('2024-05-28T16:45:00'),
      type: 'postictal',
      duration: 180,
      confidence: 92,
      acknowledged: false
    },
    {
      id: '4',
      date: new Date('2024-05-27T11:20:00'),
      type: 'ictal',
      duration: 38,
      confidence: 89,
      acknowledged: true
    },
    {
      id: '5',
      date: new Date('2024-05-26T13:55:00'),
      type: 'interictal',
      duration: 60,
      confidence: 76,
      acknowledged: true
    }
  ];

  const getTypeLabel = (type: string) => {
    const labels = {
      ictal: 'Ictale',
      preictal: 'Pré-Ictale',
      postictal: 'Post-Ictale',
      interictal: 'Inter-Ictale'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      ictal: 'bg-red-100 text-red-800',
      preictal: 'bg-yellow-100 text-yellow-800',
      postictal: 'bg-blue-100 text-blue-800',
      interictal: 'bg-green-100 text-green-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const filteredData = seizureHistory.filter(record => {
    const typeMatch = selectedType === 'all' || record.type === selectedType;
    const dateMatch = !dateFilter || record.date.toISOString().slice(0, 10) === dateFilter;
    return typeMatch && dateMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Historique des Crises</h1>
        <Button className="bg-medical-blue hover:bg-medical-blue/90">
          <Download className="w-4 h-4 mr-2" />
          Exporter PDF
        </Button>
      </div>

      {/* Filtres */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Type de crise</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="ictal">Ictale</SelectItem>
                  <SelectItem value="preictal">Pré-Ictale</SelectItem>
                  <SelectItem value="postictal">Post-Ictale</SelectItem>
                  <SelectItem value="interictal">Inter-Ictale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <div className="relative">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10"
                />
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedType('all');
                  setDateFilter('');
                }}
                className="w-full"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="medical-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {seizureHistory.filter(r => r.type === 'ictal').length}
            </div>
            <div className="text-sm text-gray-600">Crises Ictales</div>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {seizureHistory.filter(r => r.type === 'preictal').length}
            </div>
            <div className="text-sm text-gray-600">Pré-Ictales</div>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {seizureHistory.filter(r => r.type === 'postictal').length}
            </div>
            <div className="text-sm text-gray-600">Post-Ictales</div>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {Math.round(seizureHistory.reduce((acc, r) => acc + r.confidence, 0) / seizureHistory.length)}%
            </div>
            <div className="text-sm text-gray-600">Confiance Moyenne</div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des crises */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle>Enregistrements ({filteredData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Heure</TableHead>
                  <TableHead>Type de Crise</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Confiance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {record.date.toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.date.toLocaleTimeString('fr-FR')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(record.type)}>
                        {getTypeLabel(record.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDuration(record.duration)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="text-sm font-medium">{record.confidence}%</div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-medical-blue h-2 rounded-full" 
                            style={{ width: `${record.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.acknowledged ? "secondary" : "destructive"}>
                        {record.acknowledged ? 'Acquittée' : 'En attente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun enregistrement trouvé pour les critères sélectionnés.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default History;
