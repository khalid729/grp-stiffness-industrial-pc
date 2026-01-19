from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["Commands"])

# This will be set from main.py
command_service = None


def set_services(command_service_instance):
    global command_service
    command_service = command_service_instance


class JogSpeedRequest(BaseModel):
    velocity: float  # mm/min


class CommandResponse(BaseModel):
    success: bool
    message: str


class ModeResponse(BaseModel):
    remote_mode: bool
    mode: str  # "local" or "remote"


class SafetyStatus(BaseModel):
    e_stop: bool
    upper_limit: bool
    lower_limit: bool
    home: bool
    safety_ok: bool
    motion_allowed: bool


def _check_service():
    if command_service is None:
        raise HTTPException(status_code=503, detail="Command service not initialized")


# ========== TARE / ZERO ==========

@router.post("/tare", response_model=CommandResponse)
async def tare_loadcell():
    """Zero/Tare the load cell - DB2.DBX60.0"""
    _check_service()
    result = command_service.tare_loadcell()
    return CommandResponse(
        success=result["success"],
        message=result["message"]
    )


@router.post("/zero-position", response_model=CommandResponse)
async def zero_position():
    """Zero the position display - DB4.DBX59.7"""
    _check_service()
    result = command_service.zero_position()
    return CommandResponse(
        success=result["success"],
        message=result["message"]
    )


# ========== Safety Status ==========

@router.get("/safety", response_model=SafetyStatus)
async def get_safety_status():
    """Get all safety status bits"""
    _check_service()
    return command_service.get_safety_status()


# ========== Test Control ==========

@router.post("/command/start", response_model=CommandResponse)
async def start_test():
    """Start automated test"""
    _check_service()
    result = command_service.start_test()
    return CommandResponse(
        success=result["success"],
        message=result["message"]
    )


@router.post("/command/stop", response_model=CommandResponse)
async def emergency_stop():
    """Emergency stop - stops all movement"""
    _check_service()
    success = command_service.stop()
    return CommandResponse(
        success=success,
        message="Emergency stop executed" if success else "Failed to execute stop"
    )


@router.post("/command/home", response_model=CommandResponse)
async def go_home():
    """Move to home position"""
    _check_service()
    result = command_service.home()
    return CommandResponse(
        success=result["success"],
        message=result["message"]
    )


# ========== Servo Control ==========

@router.post("/servo/enable", response_model=CommandResponse)
async def enable_servo():
    """Enable servo motor"""
    _check_service()
    success = command_service.enable_servo()
    return CommandResponse(
        success=success,
        message="Servo enabled" if success else "Failed to enable servo"
    )


@router.post("/servo/disable", response_model=CommandResponse)
async def disable_servo():
    """Disable servo motor"""
    _check_service()
    success = command_service.disable_servo()
    return CommandResponse(
        success=success,
        message="Servo disabled" if success else "Failed to disable servo"
    )


@router.post("/servo/reset", response_model=CommandResponse)
async def reset_servo_alarm():
    """Reset servo alarm"""
    _check_service()
    success = command_service.reset_alarm()
    return CommandResponse(
        success=success,
        message="Alarm reset" if success else "Failed to reset alarm"
    )


# ========== Jog Control ==========

@router.post("/jog/speed", response_model=CommandResponse)
async def set_jog_speed(request: JogSpeedRequest):
    """Set jog velocity (mm/min)"""
    _check_service()
    if request.velocity < 1.2 or request.velocity > 6000:
        raise HTTPException(status_code=400, detail="Velocity must be between 1.2 and 6000 mm/min")

    success = command_service.set_jog_velocity(request.velocity)
    return CommandResponse(
        success=success,
        message=f"Jog speed set to {request.velocity} mm/min" if success else "Failed to set jog speed"
    )


@router.post("/jog/forward/start", response_model=CommandResponse)
async def jog_forward_start():
    """Start jog forward (down)"""
    _check_service()
    result = command_service.jog_forward(True)
    return CommandResponse(
        success=result.get("success", False),
        message=result.get("message", "Jog forward started") if result.get("success") else result.get("message", "Failed")
    )


@router.post("/jog/forward/stop", response_model=CommandResponse)
async def jog_forward_stop():
    """Stop jog forward"""
    _check_service()
    result = command_service.jog_forward(False)
    return CommandResponse(
        success=result.get("success", False),
        message="Jog forward stopped"
    )


@router.post("/jog/backward/start", response_model=CommandResponse)
async def jog_backward_start():
    """Start jog backward (up)"""
    _check_service()
    result = command_service.jog_backward(True)
    return CommandResponse(
        success=result.get("success", False),
        message=result.get("message", "Jog backward started") if result.get("success") else result.get("message", "Failed")
    )


@router.post("/jog/backward/stop", response_model=CommandResponse)
async def jog_backward_stop():
    """Stop jog backward"""
    _check_service()
    result = command_service.jog_backward(False)
    return CommandResponse(
        success=result.get("success", False),
        message="Jog backward stopped"
    )


# ========== Clamp Control ==========

@router.post("/clamp/upper/lock", response_model=CommandResponse)
async def lock_upper_clamp():
    """Lock upper clamp"""
    _check_service()
    success = command_service.lock_upper()
    return CommandResponse(
        success=success,
        message="Upper clamp locked" if success else "Failed to lock upper clamp"
    )


@router.post("/clamp/lower/lock", response_model=CommandResponse)
async def lock_lower_clamp():
    """Lock lower clamp"""
    _check_service()
    success = command_service.lock_lower()
    return CommandResponse(
        success=success,
        message="Lower clamp locked" if success else "Failed to lock lower clamp"
    )


@router.post("/clamp/unlock", response_model=CommandResponse)
async def unlock_all_clamps():
    """Unlock all clamps"""
    _check_service()
    success = command_service.unlock_all()
    return CommandResponse(
        success=success,
        message="All clamps unlocked" if success else "Failed to unlock clamps"
    )


# ========== Mode Control ==========

@router.get("/mode", response_model=ModeResponse)
async def get_mode():
    """Get current control mode"""
    _check_service()
    remote_mode = command_service.get_remote_mode()
    return ModeResponse(
        remote_mode=remote_mode,
        mode="remote" if remote_mode else "local"
    )


@router.post("/mode/local", response_model=CommandResponse)
async def set_local_mode():
    """Switch to Local mode (Physical buttons)"""
    _check_service()
    result = command_service.set_remote_mode(False)
    return CommandResponse(
        success=result["success"],
        message=result["message"]
    )


@router.post("/mode/remote", response_model=CommandResponse)
async def set_remote_mode():
    """Switch to Remote mode (Web interface)"""
    _check_service()
    result = command_service.set_remote_mode(True)
    return CommandResponse(
        success=result["success"],
        message=result["message"]
    )


# ========== Step Movement Control ==========

class StepDistanceRequest(BaseModel):
    distance: float  # mm (0.1 - 100)


class StepStatusResponse(BaseModel):
    distance: float
    active: bool
    done: bool


@router.post("/step/distance", response_model=CommandResponse)
async def set_step_distance(request: StepDistanceRequest):
    """Set step distance in mm (0.1 - 100)"""
    _check_service()
    if request.distance < 0.1 or request.distance > 100:
        raise HTTPException(status_code=400, detail="Distance must be between 0.1 and 100 mm")
    
    result = command_service.set_step_distance(request.distance)
    return CommandResponse(
        success=result["success"],
        message=f"Step distance set to {result.get('distance', request.distance)} mm" if result["success"] else result.get("message", "Failed")
    )


@router.post("/step/forward", response_model=CommandResponse)
async def step_forward():
    """Execute one step down (toward sample)"""
    _check_service()
    result = command_service.step_forward()
    return CommandResponse(
        success=result["success"],
        message="Step forward" if result["success"] else result.get("error", "Failed")
    )


@router.post("/step/backward", response_model=CommandResponse)
async def step_backward():
    """Execute one step up (away from sample)"""
    _check_service()
    result = command_service.step_backward()
    return CommandResponse(
        success=result["success"],
        message="Step backward" if result["success"] else result.get("error", "Failed")
    )


@router.get("/step/status", response_model=StepStatusResponse)
async def get_step_status():
    """Get current step movement status"""
    _check_service()
    return command_service.get_step_status()
