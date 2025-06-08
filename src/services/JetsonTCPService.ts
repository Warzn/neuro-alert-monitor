
interface JetsonAlert {
  type: 'seizure_detected' | 'system_status' | 'error';
  confidence?: number;
  timestamp: Date;
  message: string;
  data?: any;
}

interface TCPConnectionConfig {
  host: string;
  port: number;
  reconnectInterval: number;
}

class JetsonTCPService {
  private ws: WebSocket | null = null;
  private config: TCPConnectionConfig;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private callbacks: {
    onAlert: (alert: JetsonAlert) => void;
    onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
    onError: (error: string) => void;
  } = {
    onAlert: () => {},
    onStatusChange: () => {},
    onError: () => {}
  };

  constructor(config: TCPConnectionConfig) {
    this.config = config;
  }

  // Configuration des callbacks
  setCallbacks(callbacks: Partial<typeof this.callbacks>) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Connexion au Jetson via WebSocket (proxy TCP)
  connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.callbacks.onStatusChange('connecting');

    try {
      // En développement, on simule la connexion TCP via WebSocket
      // En production, vous devrez configurer un proxy WebSocket vers TCP
      const wsUrl = `ws://${this.config.host}:${this.config.port + 1000}`; // Port WebSocket
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Connexion Jetson établie');
        this.isConnecting = false;
        this.callbacks.onStatusChange('connected');
        this.clearReconnectTimer();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleJetsonMessage(data);
        } catch (error) {
          console.error('Erreur parsing message Jetson:', error);
          this.callbacks.onError('Erreur de format de message');
        }
      };

      this.ws.onclose = () => {
        console.log('Connexion Jetson fermée');
        this.isConnecting = false;
        this.callbacks.onStatusChange('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Erreur connexion Jetson:', error);
        this.isConnecting = false;
        this.callbacks.onStatusChange('error');
        this.callbacks.onError('Erreur de connexion TCP');
        this.scheduleReconnect();
      };

    } catch (error) {
      this.isConnecting = false;
      this.callbacks.onStatusChange('error');
      this.callbacks.onError('Impossible de créer la connexion');
    }
  }

  // Traitement des messages du Jetson
  private handleJetsonMessage(data: any): void {
    try {
      let alert: JetsonAlert;

      if (data.type === 'seizure_alert') {
        alert = {
          type: 'seizure_detected',
          confidence: data.confidence || 0,
          timestamp: new Date(data.timestamp || Date.now()),
          message: `🚨 CRISE DÉTECTÉE - Confiance: ${data.confidence}%${data.severity ? ` - Sévérité: ${data.severity}` : ''}`,
          data: data
        };
      } else if (data.type === 'status') {
        alert = {
          type: 'system_status',
          timestamp: new Date(data.timestamp || Date.now()),
          message: data.message || 'Statut système mis à jour',
          data: data
        };
      } else if (data.type === 'error') {
        alert = {
          type: 'error',
          timestamp: new Date(data.timestamp || Date.now()),
          message: `⚠️ ${data.message || 'Erreur système'}${data.error_code ? ` (${data.error_code})` : ''}`,
          data: data
        };
      } else {
        alert = {
          type: 'error',
          timestamp: new Date(data.timestamp || Date.now()),
          message: 'Message inconnu du Jetson',
          data: data
        };
      }

      this.callbacks.onAlert(alert);
    } catch (error) {
      console.error('Erreur traitement message:', error);
      this.callbacks.onError('Erreur de traitement du message');
    }
  }

  // Reconnexion automatique
  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      console.log('Tentative de reconnexion au Jetson...');
      this.connect();
    }, this.config.reconnectInterval);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Déconnexion
  disconnect(): void {
    this.clearReconnectTimer();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.callbacks.onStatusChange('disconnected');
  }

  // Envoyer un message au Jetson
  sendMessage(message: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Erreur envoi message:', error);
        return false;
      }
    }
    return false;
  }

  // Statut de connexion
  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (this.isConnecting) return 'connecting';
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return 'connected';
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) return 'connecting';
    return 'disconnected';
  }
}

// Instance singleton
export const jetsonService = new JetsonTCPService({
  host: 'localhost', // IP du Jetson
  port: 8080,        // Port TCP du Jetson
  reconnectInterval: 5000 // 5 secondes
});

export default JetsonTCPService;
export type { JetsonAlert, TCPConnectionConfig };
