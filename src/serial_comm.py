import time
import serial

class ESP32SerialBridge:
    def __init__(self, port: str = "COM3", baud_rate: int = 115200):
        self.port = port
        self.baud_rate = baud_rate
        self.ser = None
        self.connected = False

    def connect(self) -> bool:
        try:
            print(f"[Serial] Connecting to ESP32 on {self.port} @ {self.baud_rate} baud...")
            self.ser = serial.Serial(self.port, self.baud_rate, timeout=1)
            time.sleep(2)
            self.connected = True
            print("[Serial] Connection established with ESP32 Traffic Controller.")
            return True
        except serial.SerialException as e:
            print(f"[Serial Warning] Could not open port {self.port}: {e}")
            print("[Serial Fallback] Running in hardware simulation mode.")
            self.connected = False
            return False

    def send_state(self, state_str: str):
        command = f"STATE:{state_str}\n"
        if self.connected and self.ser and self.ser.is_open:
            try:
                self.ser.write(command.encode('utf-8'))
            except Exception as e:
                print(f"[Serial Error] Failed to send state: {e}")
        else:
            print(f"[Hardware Sim Out] -> {command.strip()}")

    def close(self):
        if self.ser and self.ser.is_open:
            self.ser.close()
            print("[Serial] Port closed.")
