import time
import logging
from .connector import PLCConnector

logger = logging.getLogger(__name__)


class CommandService:
    """Service for sending commands to PLC
    
    Data Blocks:
    - DB2: Tare commands
    - DB3: Servo Control
    - DB4: HMI commands
    """

    DB_RESULTS = 2   # DB2 - Test Results
    DB_SERVO = 3     # DB3 - Servo Control
    DB_HMI = 4       # DB4 - HMI Interface

    # ═══════════════════════════════════════════════════════════════════
    # DB2 - TARE COMMANDS
    # ═══════════════════════════════════════════════════════════════════
    CMD_TARE_LOADCELL = (59, 6)    # DB4.DBX59.6 - Tare load cell (HMI_TARE_LOADCELL)

    # ═══════════════════════════════════════════════════════════════════
    # DB3 - SERVO COMMANDS (Byte 0) - Main control bits
    # ═══════════════════════════════════════════════════════════════════
    CMD_ENABLE = (0, 0)            # DB3.DBX0.0 - Enable Servo
    CMD_JOG_FORWARD = (0, 1)       # DB3.DBX0.1 - Jog Forward (down)
    CMD_JOG_BACKWARD = (0, 2)      # DB3.DBX0.2 - Jog Backward (up)
    CMD_START_TEST = (0, 3)        # DB3.DBX0.3 - Start Test
    CMD_STOP = (0, 4)              # DB3.DBX0.4 - Stop
    CMD_RESET = (0, 5)             # DB3.DBX0.5 - Reset
    CMD_HOME = (0, 6)              # DB3.DBX0.6 - Home

    # ═══════════════════════════════════════════════════════════════════
    # DB3 - CLAMPS (Byte 14)
    # ═══════════════════════════════════════════════════════════════════
    CMD_LOCK_UPPER = (14, 0)       # DB3.DBX14.0 - Lock Upper Clamp
    CMD_LOCK_LOWER = (14, 1)       # DB3.DBX14.1 - Lock Lower Clamp

    # ═══════════════════════════════════════════════════════════════════
    # DB3 - MODE & STATUS (Byte 25)
    # ═══════════════════════════════════════════════════════════════════
    CMD_REMOTE_MODE = (25, 0)      # DB3.DBX25.0 - Remote Mode
    STATUS_ESTOP = (25, 1)         # DB3.DBX25.1 - E-Stop Active (Read)
    STATUS_UPPER_LIMIT = (25, 2)   # DB3.DBX25.2 - Upper Limit (Read)
    STATUS_LOWER_LIMIT = (25, 3)   # DB3.DBX25.3 - Lower Limit (Read)
    STATUS_HOME_POS = (25, 4)      # DB3.DBX25.4 - Home Position (Read)
    STATUS_SAFETY_OK = (25, 5)     # DB3.DBX25.5 - Safety OK (Read)
    STATUS_MOTION_OK = (25, 6)     # DB3.DBX25.6 - Motion Allowed (Read)
    
    # ═══════════════════════════════════════════════════════════════════
    # DB3 - MODE CHANGE (Byte 30)
    # ═══════════════════════════════════════════════════════════════════
    STATUS_MODE_CHANGE_OK = (30, 0) # DB3.DBX30.0 - Mode Change Allowed

    # ═══════════════════════════════════════════════════════════════════
    # DB3 - REAL VALUES
    # ═══════════════════════════════════════════════════════════════════
    CMD_JOG_VELOCITY_SETPOINT = 26          # DB3.DBD26 - Jog Speed (Real)

    # ═══════════════════════════════════════════════════════════════════
    # DB4 - HMI COMMANDS
    # ═══════════════════════════════════════════════════════════════════
    HMI_ZERO_LOADCELL = (58, 0)    # DB4.DBX58.0 - Zero command (legacy)
    HMI_LOCK_UPPER = (58, 1)       # DB4.DBX58.1 - Lock upper HMI
    HMI_LOCK_LOWER = (58, 2)       # DB4.DBX58.2 - Lock lower HMI
    HMI_UNLOCK_BOTH = (58, 3)      # DB4.DBX58.3 - Unlock HMI
    HMI_ENABLE = (58, 4)           # DB4.DBX58.4 - Enable HMI
    HMI_START = (58, 5)            # DB4.DBX58.5 - Start HMI
    HMI_STOP = (58, 6)             # DB4.DBX58.6 - Stop HMI
    HMI_RESET = (58, 7)            # DB4.DBX58.7 - Reset HMI
    HMI_JOG_UP = (59, 0)           # DB4.DBX59.0 - Jog up HMI
    HMI_JOG_DOWN = (59, 1)         # DB4.DBX59.1 - Jog down HMI
    HMI_HOME = (59, 2)             # DB4.DBX59.2 - Home HMI
    HMI_TARE_LOADCELL = (59, 6)    # DB4.DBX59.6 - Tare command
    HMI_TARE_POSITION = (59, 7)    # DB4.DBX59.7 - Zero position

    def __init__(self, plc: PLCConnector):
        self.plc = plc

    def _check_connection(self) -> bool:
        """Check PLC connection before command"""
        if not self.plc.connected:
            logger.warning("Cannot execute command: PLC not connected")
            return False
        return True

    def _check_remote_mode(self) -> bool:
        """Check if system is in REMOTE mode"""
        return self.plc.read_bool(self.DB_SERVO, *self.CMD_REMOTE_MODE) or False

    def _check_mode_change_allowed(self) -> bool:
        """Check if mode change is allowed"""
        return self.plc.read_bool(self.DB_SERVO, *self.STATUS_MODE_CHANGE_OK) or False

    def _check_safety_ok(self) -> bool:
        """Check if safety is OK"""
        return self.plc.read_bool(self.DB_SERVO, *self.STATUS_SAFETY_OK) or False

    def _check_motion_allowed(self) -> bool:
        """Check if motion is allowed"""
        return self.plc.read_bool(self.DB_SERVO, *self.STATUS_MOTION_OK) or False

    # ========== TARE / ZERO Commands ==========

    def tare_loadcell(self) -> dict:
        """Tare the load cell via HMI - DB4.DBX59.6"""
        if not self._check_connection():
            return {"success": False, "message": "PLC not connected"}
        
        try:
            # Send tare pulse to DB2
            self.plc.write_bool(self.DB_HMI, *self.CMD_TARE_LOADCELL, True)
            time.sleep(0.1)
            self.plc.write_bool(self.DB_HMI, *self.CMD_TARE_LOADCELL, False)
            logger.info("Load cell tare command sent (DB4.DBX59.6)")
            return {"success": True, "message": "Tare command sent"}
        except Exception as e:
            logger.error(f"Tare error: {e}")
            return {"success": False, "message": str(e)}

    def zero_position(self) -> dict:
        """Zero the position display - DB4.DBX59.7"""
        if not self._check_connection():
            return {"success": False, "message": "PLC not connected"}
        
        try:
            # Send zero position pulse to DB4
            self.plc.write_bool(self.DB_HMI, *self.HMI_TARE_POSITION, True)
            time.sleep(0.1)
            self.plc.write_bool(self.DB_HMI, *self.HMI_TARE_POSITION, False)
            logger.info("Position zero command sent (DB4.DBX59.7)")
            return {"success": True, "message": "Position zeroed"}
        except Exception as e:
            logger.error(f"Zero position error: {e}")
            return {"success": False, "message": str(e)}

    # ========== Servo Control ==========

    def enable_servo(self) -> bool:
        """Enable servo motor - DB3.DBX0.0"""
        if not self._check_connection():
            return False
        result = self.plc.write_bool(self.DB_SERVO, *self.CMD_ENABLE, True)
        logger.info("Servo enabled (DB3.DBX0.0 = True)")
        return result

    def disable_servo(self) -> bool:
        """Disable servo motor - DB3.DBX0.0"""
        if not self._check_connection():
            return False
        self.stop_all_jog()
        result = self.plc.write_bool(self.DB_SERVO, *self.CMD_ENABLE, False)
        logger.info("Servo disabled (DB3.DBX0.0 = False)")
        return result

    def reset_alarm(self) -> bool:
        """Reset servo alarm - DB3.DBX0.5 (pulse)"""
        if not self._check_connection():
            return False
        self.plc.write_bool(self.DB_SERVO, *self.CMD_RESET, True)
        time.sleep(0.5)
        result = self.plc.write_bool(self.DB_SERVO, *self.CMD_RESET, False)
        logger.info("Alarm reset (DB3.DBX0.5 pulse)")
        return result

    # ========== Jog Control - Requires REMOTE Mode ==========

    def jog_forward(self, state: bool) -> dict:
        """Jog forward (down) - DB3.DBX0.1 - HOLD button"""
        if not self._check_connection():
            return {"success": False, "reason": "DISCONNECTED", "message": "PLC not connected"}

        if state and not self._check_remote_mode():
            return {"success": False, "reason": "LOCAL_MODE", "message": "Jog disabled - System in LOCAL mode"}

        if state and not self._check_motion_allowed():
            return {"success": False, "reason": "MOTION_BLOCKED", "message": "Motion not allowed - Check safety"}

        if state:
            self.plc.write_bool(self.DB_SERVO, *self.CMD_JOG_BACKWARD, False)
        result = self.plc.write_bool(self.DB_SERVO, *self.CMD_JOG_FORWARD, state)
        logger.info(f"Jog forward: {state} (DB3.DBX0.1)")
        return {"success": result}

    def jog_backward(self, state: bool) -> dict:
        """Jog backward (up) - DB3.DBX0.2 - HOLD button"""
        if not self._check_connection():
            return {"success": False, "reason": "DISCONNECTED", "message": "PLC not connected"}

        if state and not self._check_remote_mode():
            return {"success": False, "reason": "LOCAL_MODE", "message": "Jog disabled - System in LOCAL mode"}

        if state and not self._check_motion_allowed():
            return {"success": False, "reason": "MOTION_BLOCKED", "message": "Motion not allowed - Check safety"}

        if state:
            self.plc.write_bool(self.DB_SERVO, *self.CMD_JOG_FORWARD, False)
        result = self.plc.write_bool(self.DB_SERVO, *self.CMD_JOG_BACKWARD, state)
        logger.info(f"Jog backward: {state} (DB3.DBX0.2)")
        return {"success": result}

    def set_jog_velocity(self, velocity: float) -> bool:
        """Set jog speed setpoint - DB3.DBD26 (mm/min)"""
        if not self._check_connection():
            return False
        velocity = max(1.2, min(6000.0, velocity))
        result = self.plc.write_real(self.DB_SERVO, self.CMD_JOG_VELOCITY_SETPOINT, velocity)
        logger.info(f"Jog velocity setpoint: {velocity} mm/min (DB3.DBD26)")
        return result

    def stop_all_jog(self) -> bool:
        """Stop all jog movements"""
        if not self._check_connection():
            return False
        success = True
        success &= self.plc.write_bool(self.DB_SERVO, *self.CMD_JOG_FORWARD, False)
        success &= self.plc.write_bool(self.DB_SERVO, *self.CMD_JOG_BACKWARD, False)
        logger.info("All jog stopped")
        return success

    # ========== Clamp Control ==========

    def lock_upper(self) -> bool:
        """Lock upper clamp - DB3.DBX14.0"""
        if not self._check_connection():
            return False
        result = self.plc.write_bool(self.DB_SERVO, *self.CMD_LOCK_UPPER, True)
        logger.info("Upper clamp locked (DB3.DBX14.0 = True)")
        return result

    def lock_lower(self) -> bool:
        """Lock lower clamp - DB3.DBX14.1"""
        if not self._check_connection():
            return False
        result = self.plc.write_bool(self.DB_SERVO, *self.CMD_LOCK_LOWER, True)
        logger.info("Lower clamp locked (DB3.DBX14.1 = True)")
        return result

    def unlock_upper(self) -> bool:
        """Unlock upper clamp - DB3.DBX14.0"""
        if not self._check_connection():
            return False
        result = self.plc.write_bool(self.DB_SERVO, *self.CMD_LOCK_UPPER, False)
        logger.info("Upper clamp unlocked (DB3.DBX14.0 = False)")
        return result

    def unlock_lower(self) -> bool:
        """Unlock lower clamp - DB3.DBX14.1"""
        if not self._check_connection():
            return False
        result = self.plc.write_bool(self.DB_SERVO, *self.CMD_LOCK_LOWER, False)
        logger.info("Lower clamp unlocked (DB3.DBX14.1 = False)")
        return result

    def unlock_all(self) -> bool:
        """Unlock all clamps"""
        success = self.unlock_upper() and self.unlock_lower()
        logger.info("All clamps unlocked")
        return success

    # ========== Test Control ==========

    def start_test(self) -> dict:
        """Start test - DB3.DBX0.3"""
        if not self._check_connection():
            return {"success": False, "message": "PLC not connected"}
        
        if not self._check_remote_mode():
            return {"success": False, "message": "Cannot start - System in LOCAL mode"}
        
        if not self._check_safety_ok():
            return {"success": False, "message": "Cannot start - Safety not OK"}
        
        result = self.plc.write_bool(self.DB_SERVO, *self.CMD_START_TEST, True)
        logger.info("Test started (DB3.DBX0.3 = True)")
        return {"success": result, "message": "Test started" if result else "Failed to start"}

    def stop(self) -> bool:
        """Emergency stop - DB3.DBX0.4"""
        if not self._check_connection():
            return False
        self.stop_all_jog()
        self.plc.write_bool(self.DB_SERVO, *self.CMD_STOP, True)
        time.sleep(0.1)
        result = self.plc.write_bool(self.DB_SERVO, *self.CMD_STOP, False)
        logger.warning("STOP executed (DB3.DBX0.4)")
        return result

    def home(self) -> dict:
        """Go home - DB3.DBX0.6"""
        if not self._check_connection():
            return {"success": False, "message": "PLC not connected"}
        
        if not self._check_remote_mode():
            return {"success": False, "message": "Cannot home - System in LOCAL mode"}
        
        result = self.plc.write_bool(self.DB_SERVO, *self.CMD_HOME, True)
        logger.info("Homing started (DB3.DBX0.6 = True)")
        return {"success": result, "message": "Homing started" if result else "Failed to start homing"}

    # ========== Mode Control ==========

    def set_remote_mode(self, is_remote: bool) -> dict:
        """Set remote mode - DB3.DBX25.0"""
        if not self._check_connection():
            return {"success": False, "message": "PLC not connected"}
        
        # Check if mode change is allowed
        if not self._check_mode_change_allowed():
            return {"success": False, "message": "Mode change not allowed - Test may be running"}
        
        result = self.plc.write_bool(self.DB_SERVO, *self.CMD_REMOTE_MODE, is_remote)
        mode = "Remote" if is_remote else "Local"
        logger.info(f"Mode: {mode} (DB3.DBX25.0 = {is_remote})")
        return {"success": result, "message": f"Switched to {mode} mode"}

    def get_remote_mode(self) -> bool:
        """Get remote mode - DB3.DBX25.0"""
        if not self.plc.connected:
            return False
        return self.plc.read_bool(self.DB_SERVO, *self.CMD_REMOTE_MODE) or False

    # ========== Safety Status (Read Only) ==========

    def get_safety_status(self) -> dict:
        """Read all safety status bits"""
        if not self.plc.connected:
            return {
                "e_stop": False, "upper_limit": False, "lower_limit": False,
                "home": False, "safety_ok": False, "motion_allowed": False
            }
        
        return {
            "e_stop": self.plc.read_bool(self.DB_SERVO, *self.STATUS_ESTOP) or False,
            "upper_limit": self.plc.read_bool(self.DB_SERVO, *self.STATUS_UPPER_LIMIT) or False,
            "lower_limit": self.plc.read_bool(self.DB_SERVO, *self.STATUS_LOWER_LIMIT) or False,
            "home": self.plc.read_bool(self.DB_SERVO, *self.STATUS_HOME_POS) or False,
            "safety_ok": self.plc.read_bool(self.DB_SERVO, *self.STATUS_SAFETY_OK) or False,
            "motion_allowed": self.plc.read_bool(self.DB_SERVO, *self.STATUS_MOTION_OK) or False,
        }

    # ═══════════════════════════════════════════════════════════════════
    # STEP MOVEMENT CONTROL
    # ═══════════════════════════════════════════════════════════════════
    
    # Step Movement Offsets
    STEP_DISTANCE = 32             # DB3.DBD32 - Real
    STEP_COMMANDS = 36             # DB3.DBB36 - Byte with step bits
    BIT_STEP_FORWARD = 0           # DB3.DBX36.0
    BIT_STEP_BACKWARD = 1          # DB3.DBX36.1
    BIT_STEP_ACTIVE = 2            # DB3.DBX36.2
    BIT_STEP_DONE = 3              # DB3.DBX36.3

    def set_step_distance(self, distance: float) -> dict:
        """Set step distance in mm - DB3.DBD32"""
        if not self._check_connection():
            return {"success": False, "message": "PLC not connected"}
        
        # Validate distance (0.1 - 100 mm)
        distance = abs(distance)
        if distance < 0.1 or distance > 100:
            return {"success": False, "message": "Distance must be between 0.1 and 100 mm"}
        
        result = self.plc.write_real(self.DB_SERVO, self.STEP_DISTANCE, distance)
        logger.info(f"Step distance set to {distance} mm (DB3.DBD32)")
        return {"success": result, "distance": distance}

    def step_forward(self) -> dict:
        """Execute one step down (toward sample) - DB3.DBX36.0"""
        if not self._check_connection():
            return {"success": False, "error": "PLC not connected"}
        
        # Check if step already in progress
        if self.plc.read_bool(self.DB_SERVO, self.STEP_COMMANDS, self.BIT_STEP_ACTIVE):
            return {"success": False, "error": "Step already in progress"}
        
        # Check remote mode
        if not self._check_remote_mode():
            return {"success": False, "error": "System in LOCAL mode"}
        
        # Check safety
        if not self._check_safety_ok():
            return {"success": False, "error": "Safety not OK"}
        
        # Send step forward command (one-shot)
        result = self.plc.write_bool(self.DB_SERVO, self.STEP_COMMANDS, self.BIT_STEP_FORWARD, True)
        logger.info("Step forward command sent (DB3.DBX36.0)")
        return {"success": result, "direction": "forward"}

    def step_backward(self) -> dict:
        """Execute one step up (away from sample) - DB3.DBX36.1"""
        if not self._check_connection():
            return {"success": False, "error": "PLC not connected"}
        
        # Check if step already in progress
        if self.plc.read_bool(self.DB_SERVO, self.STEP_COMMANDS, self.BIT_STEP_ACTIVE):
            return {"success": False, "error": "Step already in progress"}
        
        # Check remote mode
        if not self._check_remote_mode():
            return {"success": False, "error": "System in LOCAL mode"}
        
        # Check safety
        if not self._check_safety_ok():
            return {"success": False, "error": "Safety not OK"}
        
        # Send step backward command (one-shot)
        result = self.plc.write_bool(self.DB_SERVO, self.STEP_COMMANDS, self.BIT_STEP_BACKWARD, True)
        logger.info("Step backward command sent (DB3.DBX36.1)")
        return {"success": result, "direction": "backward"}

    def get_step_status(self) -> dict:
        """Get current step movement status"""
        if not self.plc.connected:
            return {"distance": 0.0, "active": False, "done": False}
        
        return {
            "distance": self.plc.read_real(self.DB_SERVO, self.STEP_DISTANCE) or 0.0,
            "active": self.plc.read_bool(self.DB_SERVO, self.STEP_COMMANDS, self.BIT_STEP_ACTIVE) or False,
            "done": self.plc.read_bool(self.DB_SERVO, self.STEP_COMMANDS, self.BIT_STEP_DONE) or False,
        }
