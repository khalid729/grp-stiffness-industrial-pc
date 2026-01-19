from typing import Dict, Any, Optional
from snap7.util import get_real, get_int, get_bool
from .connector import PLCConnector
import logging

logger = logging.getLogger(__name__)


class DataService:
    """Optimized Service for reading data from PLC using Block Reads
    
    Data Blocks:
    - DB1: Test Parameters (Read/Write)
    - DB2: Test Results (Read) - 85 bytes
    - DB3: Servo Control (Read) - 40 bytes
    - DB4: HMI Interface (Read) - 65 bytes
    """

    # DB Numbers
    DB_PARAMS = 1
    DB_RESULTS = 2
    DB_SERVO = 3
    DB_HMI = 4

    # Block sizes for reading
    DB2_SIZE = 85
    DB3_SIZE = 40
    DB4_SIZE = 65

    # ═══════════════════════════════════════════════════════════════════
    # DB1 - TEST PARAMETERS OFFSETS
    # ═══════════════════════════════════════════════════════════════════
    PARAM_PIPE_DIAMETER = 0
    PARAM_PIPE_LENGTH = 4
    PARAM_DEFLECTION_PERCENT = 8
    PARAM_DEFLECTION_TARGET = 12
    PARAM_TEST_SPEED = 16
    PARAM_MAX_STROKE = 20
    PARAM_MAX_FORCE = 24
    PARAM_PRELOAD_FORCE = 38
    PARAM_APPROACH_SPEED = 42
    PARAM_CONTACT_SPEED = 46
    PARAM_RETURN_SPEED = 50

    # ═══════════════════════════════════════════════════════════════════
    # DB2 - TEST RESULTS OFFSETS
    # ═══════════════════════════════════════════════════════════════════
    RES_ACTUAL_FORCE = 0
    RES_ACTUAL_DEFLECTION = 4
    RES_DEFLECTION_PERCENT = 8
    RES_FORCE_AT_TARGET = 12
    RES_RING_STIFFNESS = 16
    RES_SN_CLASS = 20
    RES_TEST_STATUS = 22
    RES_TEST_PASSED = (24, 0)
    RES_FORCE_FILTERED = 36
    RES_FORCE_KN = 44
    RES_LOAD_CELL_RAW = 48
    RES_LOAD_CELL_ACTUAL = 56
    RES_TARE_COMMAND = (60, 0)
    RES_POSITION_RAW = 62
    RES_POSITION_ACTUAL = 70
    RES_TEST_STAGE = 74
    RES_PRELOAD_REACHED = (76, 0)
    RES_CONTACT_POSITION = 78
    RES_DATA_POINT_COUNT = 82
    RES_RECORDING_ACTIVE = (84, 0)

    # ═══════════════════════════════════════════════════════════════════
    # DB3 - SERVO CONTROL OFFSETS
    # ═══════════════════════════════════════════════════════════════════
    STATUS_ENABLE = (0, 0)
    STATUS_SERVO_READY = (0, 7)
    STATUS_SERVO_ERROR = (1, 0)
    STATUS_AT_HOME = (1, 1)
    VAL_ACTUAL_POSITION = 2
    VAL_ACTUAL_SPEED = 10
    STATUS_LOCK_UPPER = (14, 0)
    STATUS_LOCK_LOWER = (14, 1)
    STATUS_MC_POWER = (20, 0)
    STATUS_MC_BUSY = (20, 1)
    STATUS_MC_ERROR = (20, 2)
    STATUS_REMOTE_MODE = (25, 0)
    STATUS_ESTOP_ACTIVE = (25, 1)
    STATUS_UPPER_LIMIT = (25, 2)
    STATUS_LOWER_LIMIT = (25, 3)
    STATUS_HOME_POSITION = (25, 4)
    STATUS_SAFETY_OK = (25, 5)
    STATUS_MOTION_ALLOWED = (25, 6)
    VAL_JOG_VELOCITY_SP = 26
    STATUS_MODE_CHANGE_OK = (30, 0)
    STEP_DISTANCE = 32
    STEP_FORWARD = (36, 0)
    STEP_BACKWARD = (36, 1)
    STEP_ACTIVE = (36, 2)
    STEP_DONE = (36, 3)

    # ═══════════════════════════════════════════════════════════════════
    # DB4 - HMI INTERFACE OFFSETS
    # ═══════════════════════════════════════════════════════════════════
    HMI_ALARM_ACTIVE = (2, 2)
    HMI_ALARM_CODE = 4
    HMI_LAMP_READY = (59, 3)
    HMI_LAMP_RUNNING = (59, 4)
    HMI_LAMP_ERROR = (59, 5)
    HMI_TEST_PROGRESS = 62

    def __init__(self, plc: PLCConnector):
        self.plc = plc

    def get_live_data(self) -> Dict[str, Any]:
        """OPTIMIZED: Read all real-time values using block reads (3 reads instead of 82!)"""
        if not self.plc.connected:
            return self._get_disconnected_data()

        try:
            # Read all DBs in 3 operations instead of 82!
            db2 = self.plc.read_db_block(self.DB_RESULTS, 0, self.DB2_SIZE)
            db3 = self.plc.read_db_block(self.DB_SERVO, 0, self.DB3_SIZE)
            db4 = self.plc.read_db_block(self.DB_HMI, 0, self.DB4_SIZE)

            if db2 is None or db3 is None or db4 is None:
                return self._get_disconnected_data()

            # Parse data locally (no network calls!)
            return {
                "force": {
                    "raw": get_real(db2, self.RES_LOAD_CELL_RAW),
                    "actual": get_real(db2, self.RES_LOAD_CELL_ACTUAL),
                    "filtered": get_real(db2, self.RES_FORCE_FILTERED),
                    "kN": get_real(db2, self.RES_FORCE_KN),
                    "N": get_real(db2, self.RES_ACTUAL_FORCE),
                },
                "position": {
                    "raw": get_real(db2, self.RES_POSITION_RAW),
                    "actual": get_real(db3, self.VAL_ACTUAL_POSITION),
                },
                "deflection": {
                    "percent": get_real(db2, self.RES_DEFLECTION_PERCENT),
                    "actual": get_real(db2, self.RES_ACTUAL_DEFLECTION),
                    "target": self.plc.read_real(self.DB_PARAMS, self.PARAM_DEFLECTION_TARGET) or 0.0,
                },
                "test": {
                    "status": get_int(db2, self.RES_TEST_STATUS),
                    "stage": get_int(db2, self.RES_TEST_STAGE),
                    "preload_reached": get_bool(db2, self.RES_PRELOAD_REACHED[0], self.RES_PRELOAD_REACHED[1]),
                    "recording": get_bool(db2, self.RES_RECORDING_ACTIVE[0], self.RES_RECORDING_ACTIVE[1]),
                    "progress": get_int(db4, self.HMI_TEST_PROGRESS),
                    "passed": get_bool(db2, self.RES_TEST_PASSED[0], self.RES_TEST_PASSED[1]),
                },
                "results": {
                    "ring_stiffness": get_real(db2, self.RES_RING_STIFFNESS),
                    "force_at_target": get_real(db2, self.RES_FORCE_AT_TARGET),
                    "sn_class": get_int(db2, self.RES_SN_CLASS),
                    "contact_position": get_real(db2, self.RES_CONTACT_POSITION),
                    "data_points": get_int(db2, self.RES_DATA_POINT_COUNT),
                },
                "servo": {
                    "ready": get_bool(db3, self.STATUS_SERVO_READY[0], self.STATUS_SERVO_READY[1]),
                    "error": get_bool(db3, self.STATUS_SERVO_ERROR[0], self.STATUS_SERVO_ERROR[1]),
                    "enabled": get_bool(db3, self.STATUS_ENABLE[0], self.STATUS_ENABLE[1]),
                    "at_home": get_bool(db3, self.STATUS_AT_HOME[0], self.STATUS_AT_HOME[1]),
                    "mc_power": get_bool(db3, self.STATUS_MC_POWER[0], self.STATUS_MC_POWER[1]),
                    "mc_busy": get_bool(db3, self.STATUS_MC_BUSY[0], self.STATUS_MC_BUSY[1]),
                    "mc_error": get_bool(db3, self.STATUS_MC_ERROR[0], self.STATUS_MC_ERROR[1]),
                    "speed": get_real(db3, self.VAL_ACTUAL_SPEED),
                    "jog_velocity": get_real(db3, self.VAL_JOG_VELOCITY_SP),
                },
                "step": {
                    "distance": get_real(db3, self.STEP_DISTANCE),
                    "forward_cmd": get_bool(db3, self.STEP_FORWARD[0], self.STEP_FORWARD[1]),
                    "backward_cmd": get_bool(db3, self.STEP_BACKWARD[0], self.STEP_BACKWARD[1]),
                    "active": get_bool(db3, self.STEP_ACTIVE[0], self.STEP_ACTIVE[1]),
                    "done": get_bool(db3, self.STEP_DONE[0], self.STEP_DONE[1]),
                },
                "safety": {
                    "e_stop": get_bool(db3, self.STATUS_ESTOP_ACTIVE[0], self.STATUS_ESTOP_ACTIVE[1]),
                    "upper_limit": get_bool(db3, self.STATUS_UPPER_LIMIT[0], self.STATUS_UPPER_LIMIT[1]),
                    "lower_limit": get_bool(db3, self.STATUS_LOWER_LIMIT[0], self.STATUS_LOWER_LIMIT[1]),
                    "home": get_bool(db3, self.STATUS_HOME_POSITION[0], self.STATUS_HOME_POSITION[1]),
                    "ok": get_bool(db3, self.STATUS_SAFETY_OK[0], self.STATUS_SAFETY_OK[1]),
                    "motion_allowed": get_bool(db3, self.STATUS_MOTION_ALLOWED[0], self.STATUS_MOTION_ALLOWED[1]),
                },
                "clamps": {
                    "upper": get_bool(db3, self.STATUS_LOCK_UPPER[0], self.STATUS_LOCK_UPPER[1]),
                    "lower": get_bool(db3, self.STATUS_LOCK_LOWER[0], self.STATUS_LOCK_LOWER[1]),
                },
                "mode": {
                    "remote": get_bool(db3, self.STATUS_REMOTE_MODE[0], self.STATUS_REMOTE_MODE[1]),
                    "can_change": get_bool(db3, self.STATUS_MODE_CHANGE_OK[0], self.STATUS_MODE_CHANGE_OK[1]),
                },
                "alarm": {
                    "active": get_bool(db4, self.HMI_ALARM_ACTIVE[0], self.HMI_ALARM_ACTIVE[1]),
                    "code": get_int(db4, self.HMI_ALARM_CODE),
                },
                "lamps": {
                    "ready": get_bool(db4, self.HMI_LAMP_READY[0], self.HMI_LAMP_READY[1]),
                    "running": get_bool(db4, self.HMI_LAMP_RUNNING[0], self.HMI_LAMP_RUNNING[1]),
                    "error": get_bool(db4, self.HMI_LAMP_ERROR[0], self.HMI_LAMP_ERROR[1]),
                },
                "connected": True,
                "plc": {"connected": True, "cpu_state": self.plc.get_cpu_state(), "ip": self.plc.ip},
                # Legacy flat fields
                "servo_ready": get_bool(db3, self.STATUS_SERVO_READY[0], self.STATUS_SERVO_READY[1]),
                "servo_error": get_bool(db3, self.STATUS_SERVO_ERROR[0], self.STATUS_SERVO_ERROR[1]),
                "servo_enabled": get_bool(db3, self.STATUS_ENABLE[0], self.STATUS_ENABLE[1]),
                "at_home": get_bool(db3, self.STATUS_AT_HOME[0], self.STATUS_AT_HOME[1]),
                "lock_upper": get_bool(db3, self.STATUS_LOCK_UPPER[0], self.STATUS_LOCK_UPPER[1]),
                "lock_lower": get_bool(db3, self.STATUS_LOCK_LOWER[0], self.STATUS_LOCK_LOWER[1]),
                "remote_mode": get_bool(db3, self.STATUS_REMOTE_MODE[0], self.STATUS_REMOTE_MODE[1]),
                "e_stop_active": get_bool(db3, self.STATUS_ESTOP_ACTIVE[0], self.STATUS_ESTOP_ACTIVE[1]),
                "actual_position": get_real(db3, self.VAL_ACTUAL_POSITION),
                "actual_force": get_real(db2, self.RES_FORCE_KN),
                "actual_deflection": get_real(db2, self.RES_ACTUAL_DEFLECTION),
                "target_deflection": get_real(db2, self.RES_DEFLECTION_PERCENT),
                "test_status": get_int(db2, self.RES_TEST_STATUS),
                "test_progress": get_int(db4, self.HMI_TEST_PROGRESS),
            }
        except Exception as e:
            logger.error(f"Error in optimized get_live_data: {e}")
            return self._get_disconnected_data()

    def _get_disconnected_data(self) -> Dict[str, Any]:
        return {
            "force": {"raw": 0.0, "actual": 0.0, "filtered": 0.0, "kN": 0.0, "N": 0.0},
            "position": {"raw": 0.0, "actual": 0.0},
            "deflection": {
                    "percent": get_real(db2, self.RES_DEFLECTION_PERCENT),"actual": 0.0, "target": 0.0},
            "test": {"status": -1, "stage": 0, "preload_reached": False, "recording": False},
            "results": {"ring_stiffness": 0.0, "force_at_target": 0.0, "sn_class": 0, "contact_position": 0.0, "data_points": 0},
            "servo": {"ready": False, "error": False, "enabled": False, "at_home": False, "mc_power": False, "mc_busy": False, "mc_error": False, "speed": 0.0, "jog_velocity": 0.0},
            "step": {"distance": 0.0, "forward_cmd": False, "backward_cmd": False, "active": False, "done": False},
            "safety": {"e_stop": False, "upper_limit": False, "lower_limit": False, "home": False, "ok": False, "motion_allowed": False},
            "clamps": {"upper": False, "lower": False},
            "mode": {"remote": False, "can_change": False},
            "alarm": {"active": False, "code": 0},
            "lamps": {"ready": False, "running": False, "error": False},
            "connected": False,
            "plc": {"connected": False, "cpu_state": "unknown", "ip": self.plc.ip},
            "servo_ready": False, "servo_error": False, "servo_enabled": False,
            "at_home": False, "lock_upper": False, "lock_lower": False,
            "remote_mode": False, "e_stop_active": False,
            "actual_position": 0.0, "actual_force": 0.0, "actual_deflection": 0.0,
            "target_deflection": 0.0, "test_status": -1, "test_progress": 0,
        }

    def get_parameters(self) -> Dict[str, Any]:
        if not self.plc.connected:
            return self._get_default_parameters()
        try:
            return {
                "pipe_diameter": self.plc.read_real(self.DB_PARAMS, self.PARAM_PIPE_DIAMETER) or 0.0,
                "pipe_length": self.plc.read_real(self.DB_PARAMS, self.PARAM_PIPE_LENGTH) or 300.0,
                "deflection_percent": self.plc.read_real(self.DB_PARAMS, self.PARAM_DEFLECTION_PERCENT) or 3.0,
                "deflection_target": self.plc.read_real(self.DB_PARAMS, self.PARAM_DEFLECTION_TARGET) or 0.0,
                "test_speed": self.plc.read_real(self.DB_PARAMS, self.PARAM_TEST_SPEED) or 12.0,
                "max_stroke": self.plc.read_real(self.DB_PARAMS, self.PARAM_MAX_STROKE) or 100.0,
                "max_force": self.plc.read_real(self.DB_PARAMS, self.PARAM_MAX_FORCE) or 50000.0,
                "preload_force": self.plc.read_real(self.DB_PARAMS, self.PARAM_PRELOAD_FORCE) or 10.0,
                "approach_speed": self.plc.read_real(self.DB_PARAMS, self.PARAM_APPROACH_SPEED) or 50.0,
                "contact_speed": self.plc.read_real(self.DB_PARAMS, self.PARAM_CONTACT_SPEED) or 2.0,
                "return_speed": self.plc.read_real(self.DB_PARAMS, self.PARAM_RETURN_SPEED) or 100.0,
                "connected": True,
            }
        except Exception as e:
            logger.error(f"Error reading parameters: {e}")
            return self._get_default_parameters()

    def _get_default_parameters(self) -> Dict[str, Any]:
        return {
            "pipe_diameter": 0.0, "pipe_length": 300.0, "deflection_percent": 3.0,
            "deflection_target": 0.0, "test_speed": 12.0, "max_stroke": 100.0,
            "max_force": 50000.0, "preload_force": 10.0, "approach_speed": 50.0,
            "contact_speed": 2.0, "return_speed": 100.0, "connected": False,
        }

    def set_parameters(self, **kwargs) -> bool:
        if not self.plc.connected:
            return False
        try:
            if "pipe_diameter" in kwargs:
                self.plc.write_real(self.DB_PARAMS, self.PARAM_PIPE_DIAMETER, float(kwargs["pipe_diameter"]))
            if "pipe_length" in kwargs:
                self.plc.write_real(self.DB_PARAMS, self.PARAM_PIPE_LENGTH, float(kwargs["pipe_length"]))
            if "deflection_percent" in kwargs:
                self.plc.write_real(self.DB_PARAMS, self.PARAM_DEFLECTION_PERCENT, float(kwargs["deflection_percent"]))
            if "test_speed" in kwargs:
                self.plc.write_real(self.DB_PARAMS, self.PARAM_TEST_SPEED, float(kwargs["test_speed"]))
            if "max_force" in kwargs:
                self.plc.write_real(self.DB_PARAMS, self.PARAM_MAX_FORCE, float(kwargs["max_force"]))
            if "preload_force" in kwargs:
                self.plc.write_real(self.DB_PARAMS, self.PARAM_PRELOAD_FORCE, float(kwargs["preload_force"]))
            logger.info(f"Parameters written: {kwargs}")
            return True
        except Exception as e:
            logger.error(f"Error writing parameters: {e}")
            return False

    def get_test_results(self) -> Dict[str, Any]:
        if not self.plc.connected:
            return {"ring_stiffness": 0.0, "force_at_target": 0.0, "sn_class": 0, "test_passed": False}
        return {
            "ring_stiffness": self.plc.read_real(self.DB_RESULTS, self.RES_RING_STIFFNESS) or 0.0,
            "force_at_target": self.plc.read_real(self.DB_RESULTS, self.RES_FORCE_AT_TARGET) or 0.0,
            "sn_class": self.plc.read_int(self.DB_RESULTS, self.RES_SN_CLASS) or 0,
            "test_passed": self.plc.read_bool(self.DB_RESULTS, *self.RES_TEST_PASSED) or False,
            "deflection_percent": self.plc.read_real(self.DB_RESULTS, self.RES_DEFLECTION_PERCENT) or 0.0,
        }
