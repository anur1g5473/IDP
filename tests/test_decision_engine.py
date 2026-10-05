import sys
import os

# Ensure root project directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import unittest
from src.decision_engine import TrafficDecisionEngine, SignalState

class TestTrafficDecisionEngine(unittest.TestCase):
    
    def setUp(self):
        self.engine = TrafficDecisionEngine(min_green_sec=2, max_green_sec=10, clearance_sec=1)

    def test_initial_state(self):
        status = self.engine.get_status()
        self.assertEqual(status["fsm_state"], "SIDE_A_GREEN")
        self.assertEqual(status["side_a_signal"], "GREEN")
        self.assertEqual(status["side_b_signal"], "RED")

    def test_queue_weight_calculation(self):
        counts = {"car": 2, "motorcycle": 2, "bus": 1}
        weight = self.engine.calculate_queue_weight(counts)
        self.assertEqual(weight, 7.1)

    def test_emergency_ambulance_priority(self):
        side_a = {"counts": {"car": 1}}
        side_b = {"counts": {"ambulance": 1}}
        
        status = self.engine.update(side_a, side_b)
        self.assertEqual(status["fsm_state"], "ALL_RED_CLEARANCE_A_TO_B")
        self.assertEqual(status["side_a_signal"], "RED")
        self.assertEqual(status["side_b_signal"], "RED")

    def test_manual_guard_override(self):
        self.engine.manual_override = "SIDE_B"
        status = self.engine.update({}, {})
        self.assertEqual(status["fsm_state"], "SIDE_B_GREEN")
        self.assertEqual(status["side_b_signal"], "GREEN")

if __name__ == "__main__":
    unittest.main()

