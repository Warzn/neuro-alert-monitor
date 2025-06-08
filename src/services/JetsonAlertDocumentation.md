
# Jetson Alert Format Documentation

## Message Format to Send from Jetson Nano

To trigger seizure alerts in the NeuroAlert Monitor, the Jetson Nano should send JSON messages via TCP connection to the WebSocket proxy.

### Seizure Detection Alert

```json
{
  "type": "seizure_alert",
  "confidence": 85.7,
  "timestamp": "2024-06-08T14:30:15.123Z",
  "patient_id": "optional_patient_id",
  "severity": "moderate",
  "duration_detected": 2.5,
  "frequency_bands": {
    "delta": 12.3,
    "theta": 8.7,
    "alpha": 15.2,
    "beta": 22.1,
    "gamma": 5.4
  },
  "channel_data": {
    "channel": "surrogate",
    "max_amplitude": 120.5,
    "mean_amplitude": 45.2
  },
  "additional_data": {
    "algorithm": "CNN_LSTM_v2.1",
    "preprocessing": "bandpass_notch",
    "model_version": "2024.03.15"
  }
}
```

### System Status Update

```json
{
  "type": "status",
  "timestamp": "2024-06-08T14:30:15.123Z",
  "message": "System operational - Model loaded successfully",
  "system_info": {
    "cpu_usage": 45.2,
    "memory_usage": 67.8,
    "gpu_usage": 82.1,
    "temperature": 55.3
  },
  "model_status": "active",
  "last_inference_time": 23.5
}
```

### Error/Warning Messages

```json
{
  "type": "error",
  "timestamp": "2024-06-08T14:30:15.123Z",
  "message": "EDF processing error - Signal quality too low",
  "error_code": "EDF_001",
  "severity": "warning",
  "details": {
    "signal_quality": 23.4,
    "threshold": 50.0,
    "recommendation": "Check electrode connections"
  }
}
```

## Required Fields

### Minimum Seizure Alert:
- `type`: Must be "seizure_alert"
- `confidence`: Number (0-100) representing detection confidence
- `timestamp`: ISO 8601 timestamp or epoch milliseconds

### Recommended Fields:
- `severity`: "low", "moderate", "high", "critical"
- `duration_detected`: Seizure duration in seconds
- `channel_data`: Information about the analyzed channel

## Connection Details

- **Host**: localhost (or Jetson IP)
- **Port**: 8080 (TCP port)
- **Protocol**: Raw TCP socket or WebSocket
- **Reconnection**: Automatic every 5 seconds if disconnected
- **Heartbeat**: Send status messages every 30 seconds recommended

## Example Python Code for Jetson

```python
import json
import socket
import time
from datetime import datetime

class JetsonAlertSender:
    def __init__(self, host='localhost', port=8080):
        self.host = host
        self.port = port
        self.socket = None
    
    def connect(self):
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect((self.host, self.port))
            print(f"Connected to {self.host}:{self.port}")
        except Exception as e:
            print(f"Connection error: {e}")
    
    def send_seizure_alert(self, confidence, severity="moderate"):
        alert = {
            "type": "seizure_alert",
            "confidence": confidence,
            "timestamp": datetime.now().isoformat(),
            "severity": severity
        }
        self.send_message(alert)
    
    def send_message(self, message):
        if self.socket:
            try:
                json_data = json.dumps(message)
                self.socket.send(json_data.encode('utf-8'))
            except Exception as e:
                print(f"Send error: {e}")

# Usage example
jetson = JetsonAlertSender()
jetson.connect()
jetson.send_seizure_alert(confidence=89.5, severity="high")
```
