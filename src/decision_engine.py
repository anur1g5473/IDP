import time
from enum import Enum

class SignalState(Enum):
    SIDE_A_GREEN = "SIDE_A_GREEN"
    ALL_RED_CLEARANCE_A_TO_B = "ALL_RED_CLEARANCE_A_TO_B"
    SIDE_B_GREEN = "SIDE_B_GREEN"
    ALL_RED_CLEARANCE_B_TO_A = "ALL_RED_CLEARANCE_B_TO_A"

VEHICLE_WEIGHTS = {
    "ambulance": 100.0,
    "bus": 2.5,
    "truck": 2.5,
    "car": 1.5,
    "auto_rickshaw": 1.2,
    "motorcycle": 0.8,
    "bicycle": 0.5,
    "person": 0.2
}

class TrafficDecisionEngine:
    def __init__(self, min_green_sec: float = 10.0, max_green_sec: float = 45.0, clearance_sec: float = 4.0):
        self.min_green_sec = min_green_sec
        self.max_green_sec = max_green_sec
        self.clearance_sec = clearance_sec

        self.current_state = SignalState.SIDE_A_GREEN
        self.state_start_time = time.time()
        
        self.side_a_waiting_since = None
        self.side_b_waiting_since = None

        self.manual_override = None  # None, 'SIDE_A', 'SIDE_B', 'ALL_RED'

    def calculate_queue_weight(self, counts: dict) -> float:
        total_weight = 0.0
        for vehicle, count in counts.items():
            weight = VEHICLE_WEIGHTS.get(vehicle, 1.0)
            total_weight += count * weight
        return total_weight

    def update(self, side_a_telemetry: dict, side_b_telemetry: dict) -> dict:
        now = time.time()
        elapsed = now - self.state_start_time

        counts_a = side_a_telemetry.get("counts", {})
        counts_b = side_b_telemetry.get("counts", {})

        weight_a = self.calculate_queue_weight(counts_a)
        weight_b = self.calculate_queue_weight(counts_b)

        has_emergency_a = side_a_telemetry.get("has_emergency", False) or counts_a.get("ambulance", 0) > 0
        has_emergency_b = side_b_telemetry.get("has_emergency", False) or counts_b.get("ambulance", 0) > 0

        if self.manual_override is not None:
            if self.manual_override == "SIDE_A":
                self.current_state = SignalState.SIDE_A_GREEN
            elif self.manual_override == "SIDE_B":
                self.current_state = SignalState.SIDE_B_GREEN
            elif self.manual_override == "ALL_RED":
                self.current_state = SignalState.ALL_RED_CLEARANCE_A_TO_B
            return self.get_status()

        if self.current_state == SignalState.SIDE_A_GREEN:
            if has_emergency_b or (elapsed >= self.min_green_sec and (weight_b > weight_a * 1.5 or elapsed >= self.max_green_sec)):
                self.current_state = SignalState.ALL_RED_CLEARANCE_A_TO_B
                self.state_start_time = now

        elif self.current_state == SignalState.ALL_RED_CLEARANCE_A_TO_B:
            if elapsed >= self.clearance_sec:
                self.current_state = SignalState.SIDE_B_GREEN
                self.state_start_time = now

        elif self.current_state == SignalState.SIDE_B_GREEN:
            if has_emergency_a or (elapsed >= self.min_green_sec and (weight_a > weight_b * 1.5 or elapsed >= self.max_green_sec)):
                self.current_state = SignalState.ALL_RED_CLEARANCE_B_TO_A
                self.state_start_time = now

        elif self.current_state == SignalState.ALL_RED_CLEARANCE_B_TO_A:
            if elapsed >= self.clearance_sec:
                self.current_state = SignalState.SIDE_A_GREEN
                self.state_start_time = now

        return self.get_status()

    def get_status(self) -> dict:
        now = time.time()
        elapsed = round(now - self.state_start_time, 1)

        side_a_signal = "GREEN" if self.current_state == SignalState.SIDE_A_GREEN else "RED"
        side_b_signal = "GREEN" if self.current_state == SignalState.SIDE_B_GREEN else "RED"

        return {
            "fsm_state": self.current_state.value,
            "side_a_signal": side_a_signal,
            "side_b_signal": side_b_signal,
            "elapsed_seconds": elapsed,
            "manual_override": self.manual_override
        }
