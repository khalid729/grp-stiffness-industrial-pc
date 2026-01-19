from typing import Dict, Any, Optional
from .connector import PLCConnector
import logging

logger = logging.getLogger(__name__)


class DataService:
    """Service for reading data from PLC
    
    Data Blocks:
    - DB1: Test Parameters (Read/Write)
    - DB2: Test Results (Read, some Write)
    - DB3: Servo Control (Read status)
    - DB4: HMI Interface (Read)
    """

    # ═══════════════════════════════════════════════════════════════════
    # DB1 - TEST PARAMETERS (Read/Write)
    # ═══════════════════════════════════════════════════════════════════
    DB_PARAMS = 1
    
    PARAM_PIPE_DIAMETER = 0
    PARAM_PIPE_LENGTH = 4
    PARAM_DEFLECTION_PERCENT = 8
    PARAM_DEFLECTION_TARGET = 12
    PARAM_TEST_SPEED = 16
    PARAM_MAX_STROKE = 20
    PARAM_MAX_FORCE = 24
    PARAM_RAW_ANALOG = 28
    PARAM_LOADCELL_ZERO = 30
    PARAM_LOADCELL_SPAN = 34
    PARAM_PRELOAD_FORCE = 38
    PARAM_APPROACH_SPEED = 42
    PARAM_CONTACT_SPEED = 46
    PARAM_RETURN_SPEED = 50
    PARAM_APPROACH_DISTANCE = 54

    # ═══════════════════════════════════════════════════════════════════
    # DB2 - TEST RESULTS (Read)
    # ═══════════════════════════════════════════════════════════════════
    DB_RESULTS = 2
    
    RES_ACTUAL_FORCE = 0
    RES_ACTUAL_DEFLECTION = 4
    RES_DEFLECTION_PERCENT = 8
    RES_FORCE_AT_TARGET = 12
    RES_RING_STIFFNESS = 16
    RES_SN_CLASS = 20
    RES_TEST_STATUS = 22
    RES_TEST_PASSED = (24, 0)
    RES_RAW_ANALOG = 26
    RES_LOADCELL_ZERO = 28
    RES_LOADCELL_SPAN = 32
    RES_FORCE_FILTERED = 36
    RES_FORCE_KG = 40
    RES_FORCE_KN = 44
    RES_LOAD_CELL_RAW = 48
    RES_LOAD_CELL_OFFSET = 52
    RES_LOAD_CELL_ACTUAL = 56
    RES_TARE_COMMAND = (60, 0)
    RES_POSITION_RAW = 62
    RES_POSITION_OFFSET = 66
    RES_POSITION_ACTUAL = 70
    RES_TEST_STAGE = 74
    RES_PRELOAD_REACHED = (76, 0)
    RES_CONTACT_POSITION = 78
    RES_DATA_POINT_COUNT = 82
    RES_RECORDING_ACTIVE = (84, 0)

    # ═══════════════════════════════════════════════════════════════════
    # DB3 - SERVO CONTROL STATUS (Read)
    # ═══════════════════════════════════════════════════════════════════
    DB_SERVO = 3
    
    STATUS_ENABLE = (0, 0)
    STATUS_SERVO_READY = (0, 7)
    STATUS_SERVO_ERROR = (1, 0)
    STATUS_AT_HOME = (1, 1)
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
    STATUS_MODE_CHANGE_OK = (30, 0)
    
    VAL_ACTUAL_POSITION = 2
    VAL_TARGET_POSITION = 6
    VAL_ACTUAL_SPEED = 10
    VAL_JOG_VELOCITY = 16
    VAL_JOG_VELOCITY_SP = 26

    # ═══════════════════════════════════════════════════════════════════
    # DB3 - STEP MOVEMENT (NEW)
    # ═══════════════════════════════════════════════════════════════════
    STEP_DISTANCE = 32             # DB3.DBD32 - Real - Step distance mm
    STEP_FORWARD = (36, 0)         # DB3.DBX36.0 - Bool - Step down command
    STEP_BACKWARD = (36, 1)        # DB3.DBX36.1 - Bool - Step up command
    STEP_ACTIVE = (36, 2)          # DB3.DBX36.2 - Bool - Step in progress
    STEP_DONE = (36, 3)            # DB3.DBX36.3 - Bool - Step completed

    # ═══════════════════════════════════════════════════════════════════
    # DB4 - HMI INTERFACE (Read)
    # ═══════════════════════════════════════════════════════════════════
    DB_HMI = 4
    
    HMI_SCREEN_ID = 0
    HMI_MODE_AUTO = (2, 0)
    HMI_MODE_MANUAL = (2, 1)
    HMI_ALARM_ACTIVE = (2, 2)
    HMI_ALARM_CODE = 4
    HMI_LAMP_READY = (59, 3)
    HMI_LAMP_RUNNING = (59, 4)
    HMI_LAMP_ERROR = (59, 5)
    HMI_TARE_LOADCELL = (59, 6)
    HMI_TARE_POSITION = (59, 7)
    HMI_ESTOP_STATUS = (60, 0)
    HMI_UPPER_LIMIT = (60, 1)
    HMI_LOWER_LIMIT = (60, 2)
    HMI_HOME_STATUS = (60, 3)
    HMI_TEST_PROGRESS = 62

    def __init__(self, plc: PLCConnector):
        self.plc = plc

    def get_live_data(self) -> Dict[str, Any]:
        """Read all real-time values from PLC"""
        if not self.plc.connected:
            return self._get_disconnected_data()

        try:
            return {
                # ═══════════════════════════════════════════════════════════
                # FORCE READINGS (DB2)
                # ═══════════════════════════════════════════════════════════
                "force": {
                    "raw": self.plc.read_real(self.DB_RESULTS, self.RES_LOAD_CELL_RAW) or 0.0,
                    "actual": self.plc.read_real(self.DB_RESULTS, self.RES_LOAD_CELL_ACTUAL) or 0.0,
                    "filtered": self.plc.read_real(self.DB_RESULTS, self.RES_FORCE_FILTERED) or 0.0,
                    "kN": self.plc.read_real(self.DB_RESULTS, self.RES_FORCE_KN) or 0.0,
                    "N": self.plc.read_real(self.DB_RESULTS, self.RES_ACTUAL_FORCE) or 0.0,
                },
                
                # ═══════════════════════════════════════════════════════════
                # POSITION READINGS (DB2 + DB3)
                # ═══════════════════════════════════════════════════════════
                "position": {
                    "raw": self.plc.read_real(self.DB_RESULTS, self.RES_POSITION_RAW) or 0.0,
                    "actual": self.plc.read_real(self.DB_RESULTS, self.RES_POSITION_ACTUAL) or 0.0,
                    "servo": self.plc.read_real(self.DB_SERVO, self.VAL_ACTUAL_POSITION) or 0.0,
                    "target": self.plc.read_real(self.DB_SERVO, self.VAL_TARGET_POSITION) or 0.0,
                },
                
                # ═══════════════════════════════════════════════════════════
                # DEFLECTION (DB2 + DB1)
                # ═══════════════════════════════════════════════════════════
                "deflection": {
                    "actual": self.plc.read_real(self.DB_RESULTS, self.RES_ACTUAL_DEFLECTION) or 0.0,
                    "percent": self.plc.read_real(self.DB_RESULTS, self.RES_DEFLECTION_PERCENT) or 0.0,
                    "target": self.plc.read_real(self.DB_PARAMS, self.PARAM_DEFLECTION_TARGET) or 0.0,
                },
                
                # ═══════════════════════════════════════════════════════════
                # TEST STATUS (DB2 + DB4)
                # ═══════════════════════════════════════════════════════════
                "test": {
                    "status": self.plc.read_int(self.DB_RESULTS, self.RES_TEST_STATUS) or 0,
                    "stage": self.plc.read_int(self.DB_RESULTS, self.RES_TEST_STAGE) or 0,
                    "progress": self.plc.read_int(self.DB_HMI, self.HMI_TEST_PROGRESS) or 0,
                    "recording": self.plc.read_bool(self.DB_RESULTS, *self.RES_RECORDING_ACTIVE) or False,
                    "preload_reached": self.plc.read_bool(self.DB_RESULTS, *self.RES_PRELOAD_REACHED) or False,
                    "passed": self.plc.read_bool(self.DB_RESULTS, *self.RES_TEST_PASSED) or False,
                },
                
                # ═══════════════════════════════════════════════════════════
                # RESULTS (DB2)
                # ═══════════════════════════════════════════════════════════
                "results": {
                    "ring_stiffness": self.plc.read_real(self.DB_RESULTS, self.RES_RING_STIFFNESS) or 0.0,
                    "force_at_target": self.plc.read_real(self.DB_RESULTS, self.RES_FORCE_AT_TARGET) or 0.0,
                    "sn_class": self.plc.read_int(self.DB_RESULTS, self.RES_SN_CLASS) or 0,
                    "contact_position": self.plc.read_real(self.DB_RESULTS, self.RES_CONTACT_POSITION) or 0.0,
                    "data_points": self.plc.read_int(self.DB_RESULTS, self.RES_DATA_POINT_COUNT) or 0,
                },
                
                # ═══════════════════════════════════════════════════════════
                # SERVO STATUS (DB3)
                # ═══════════════════════════════════════════════════════════
                "servo": {
                    "ready": self.plc.read_bool(self.DB_SERVO, *self.STATUS_SERVO_READY) or False,
                    "error": self.plc.read_bool(self.DB_SERVO, *self.STATUS_SERVO_ERROR) or False,
                    "enabled": self.plc.read_bool(self.DB_SERVO, *self.STATUS_ENABLE) or False,
                    "at_home": self.plc.read_bool(self.DB_SERVO, *self.STATUS_AT_HOME) or False,
                    "mc_power": self.plc.read_bool(self.DB_SERVO, *self.STATUS_MC_POWER) or False,
                    "mc_busy": self.plc.read_bool(self.DB_SERVO, *self.STATUS_MC_BUSY) or False,
                    "mc_error": self.plc.read_bool(self.DB_SERVO, *self.STATUS_MC_ERROR) or False,
                    "speed": self.plc.read_real(self.DB_SERVO, self.VAL_ACTUAL_SPEED) or 0.0,
                    "jog_velocity": self.plc.read_real(self.DB_SERVO, self.VAL_JOG_VELOCITY) or 0.0,
                },
                
                # ═══════════════════════════════════════════════════════════
                # STEP MOVEMENT STATUS (DB3) - NEW
                # ═══════════════════════════════════════════════════════════
                "step": {
                    "distance": self.plc.read_real(self.DB_SERVO, self.STEP_DISTANCE) or 0.0,
                    "forward_cmd": self.plc.read_bool(self.DB_SERVO, *self.STEP_FORWARD) or False,
                    "backward_cmd": self.plc.read_bool(self.DB_SERVO, *self.STEP_BACKWARD) or False,
                    "active": self.plc.read_bool(self.DB_SERVO, *self.STEP_ACTIVE) or False,
                    "done": self.plc.read_bool(self.DB_SERVO, *self.STEP_DONE) or False,
                },
                
                # ═══════════════════════════════════════════════════════════
                # SAFETY STATUS (DB3)
                # ═══════════════════════════════════════════════════════════
                "safety": {
                    "e_stop": self.plc.read_bool(self.DB_SERVO, *self.STATUS_ESTOP_ACTIVE) or False,
                    "upper_limit": self.plc.read_bool(self.DB_SERVO, *self.STATUS_UPPER_LIMIT) or False,
                    "lower_limit": self.plc.read_bool(self.DB_SERVO, *self.STATUS_LOWER_LIMIT) or False,
                    "home": self.plc.read_bool(self.DB_SERVO, *self.STATUS_HOME_POSITION) or False,
                    "ok": self.plc.read_bool(self.DB_SERVO, *self.STATUS_SAFETY_OK) or False,
                    "motion_allowed": self.plc.read_bool(self.DB_SERVO, *self.STATUS_MOTION_ALLOWED) or False,
                },
                
                # ═══════════════════════════════════════════════════════════
                # CLAMPS (DB3)
                # ═══════════════════════════════════════════════════════════
                "clamps": {
                    "upper": self.plc.read_bool(self.DB_SERVO, *self.STATUS_LOCK_UPPER) or False,
                    "lower": self.plc.read_bool(self.DB_SERVO, *self.STATUS_LOCK_LOWER) or False,
                },
                
                # ═══════════════════════════════════════════════════════════
                # MODE (DB3)
                # ═══════════════════════════════════════════════════════════
                "mode": {
                    "remote": self.plc.read_bool(self.DB_SERVO, *self.STATUS_REMOTE_MODE) or False,
                    "can_change": self.plc.read_bool(self.DB_SERVO, *self.STATUS_MODE_CHANGE_OK) or False,
                },
                
                # ═══════════════════════════════════════════════════════════
                # ALARMS (DB4)
                # ═══════════════════════════════════════════════════════════
                "alarm": {
                    "active": self.plc.read_bool(self.DB_HMI, *self.HMI_ALARM_ACTIVE) or False,
                    "code": self.plc.read_int(self.DB_HMI, self.HMI_ALARM_CODE) or 0,
                },
                
                # ═══════════════════════════════════════════════════════════
                # LAMPS (DB4)
                # ═══════════════════════════════════════════════════════════
                "lamps": {
                    "ready": self.plc.read_bool(self.DB_HMI, *self.HMI_LAMP_READY) or False,
                    "running": self.plc.read_bool(self.DB_HMI, *self.HMI_LAMP_RUNNING) or False,
                    "error": self.plc.read_bool(self.DB_HMI, *self.HMI_LAMP_ERROR) or False,
                },
                
                # ═══════════════════════════════════════════════════════════
                # PLC CONNECTION
                # ═══════════════════════════════════════════════════════════
                "connected": True,
                "plc": {
                    "connected": True,
                    "cpu_state": self.plc.get_cpu_state(),
                    "ip": self.plc.ip
                },
                
                # ═══════════════════════════════════════════════════════════
                # LEGACY COMPATIBILITY
                # ═══════════════════════════════════════════════════════════
                "servo_ready": self.plc.read_bool(self.DB_SERVO, *self.STATUS_SERVO_READY) or False,
                "servo_error": self.plc.read_bool(self.DB_SERVO, *self.STATUS_SERVO_ERROR) or False,
                "servo_enabled": self.plc.read_bool(self.DB_SERVO, *self.STATUS_ENABLE) or False,
                "at_home": self.plc.read_bool(self.DB_SERVO, *self.STATUS_AT_HOME) or False,
                "lock_upper": self.plc.read_bool(self.DB_SERVO, *self.STATUS_LOCK_UPPER) or False,
                "lock_lower": self.plc.read_bool(self.DB_SERVO, *self.STATUS_LOCK_LOWER) or False,
                "remote_mode": self.plc.read_bool(self.DB_SERVO, *self.STATUS_REMOTE_MODE) or False,
                "e_stop_active": self.plc.read_bool(self.DB_SERVO, *self.STATUS_ESTOP_ACTIVE) or False,
                "actual_position": self.plc.read_real(self.DB_SERVO, self.VAL_ACTUAL_POSITION) or 0.0,
                "actual_force": (self.plc.read_real(self.DB_RESULTS, self.RES_FORCE_KN) or 0.0),
                "actual_deflection": self.plc.read_real(self.DB_RESULTS, self.RES_ACTUAL_DEFLECTION) or 0.0,
                "target_deflection": self.plc.read_real(self.DB_PARAMS, self.PARAM_DEFLECTION_TARGET) or 0.0,
                "test_status": self.plc.read_int(self.DB_RESULTS, self.RES_TEST_STATUS) or 0,
                "test_progress": self.plc.read_int(self.DB_HMI, self.HMI_TEST_PROGRESS) or 0,
            }
        except Exception as e:
            logger.error(f"Error reading live data: {e}")
            return self._get_disconnected_data()

    def _get_disconnected_data(self) -> Dict[str, Any]:
        """Default values when disconnected"""
        return {
            "force": {"raw": 0.0, "actual": 0.0, "filtered": 0.0, "kN": 0.0, "N": 0.0},
            "position": {"raw": 0.0, "actual": 0.0, "servo": 0.0, "target": 0.0},
            "deflection": {"actual": 0.0, "percent": 0.0, "target": 0.0},
            "test": {"status": -1, "stage": 0, "progress": 0, "recording": False, "preload_reached": False, "passed": False},
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
