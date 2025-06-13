
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.89081287cce04a4c84679dad310df827',
  appName: 'neuro-alert-monitor',
  webDir: 'dist',
  server: {
    url: 'https://89081287-cce0-4a4c-8467-9dad310df827.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      style: 'light',
      backgroundColor: '#4A90E2'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#4A90E2',
      showSpinner: false
    }
  }
};

export default config;
