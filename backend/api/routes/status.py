from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(tags=["Status"])

# These will be set from main.py
plc = None
data_service = None


def set_services(plc_instance, data_service_instance):
    global plc, data_service
    plc = plc_instance
    data_service = data_service_instance


class ParametersRequest(BaseModel):
    pipe_diameter: Optional[float] = None
    pipe_length: Optional[float] = None
    deflection_percent: Optional[float] = None
    test_speed: Optional[float] = None
    max_stroke: Optional[float] = None
    max_force: Optional[float] = None
    target_sn_class: Optional[int] = None
    test_mode: Optional[int] = None
    crack_stage1_percent: Optional[float] = None
    crack_stage2_percent: Optional[float] = None
    fracture_max_percent: Optional[float] = None
    fracture_drop_threshold: Optional[float] = None


class TestMetadataRequest(BaseModel):
    sample_id: Optional[str] = ''
    operator: Optional[str] = ''
    notes: Optional[str] = ''
    lot_number: Optional[str] = ''
    nominal_diameter: Optional[float] = None
    pressure_class: Optional[str] = ''
    stiffness_class: Optional[str] = ''
    product_id: Optional[str] = ''
    thickness: Optional[float] = None
    nominal_weight: Optional[float] = None
    project_name: Optional[str] = ''
    customer_name: Optional[str] = ''
    po_number: Optional[str] = ''
    num_positions: Optional[int] = 1
    angles: Optional[list] = None


class ConnectionResponse(BaseModel):
    connected: bool
    ip: str
    message: str


@router.get("/status")
async def get_status():
    """Get all live data (force, position, status, indicators)"""
    if data_service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    return data_service.get_live_data()


@router.get("/status/connection", response_model=ConnectionResponse)
async def get_connection_status():
    """Check PLC connection status"""
    if plc is None:
        return ConnectionResponse(
            connected=False,
            ip="",
            message="PLC service not initialized"
        )
    return ConnectionResponse(
        connected=plc.connected,
        ip=plc.ip,
        message="Connected" if plc.connected else "Disconnected"
    )


@router.post("/status/reconnect")
async def reconnect_plc():
    """Reconnect to PLC"""
    if plc is None:
        raise HTTPException(status_code=503, detail="PLC service not initialized")

    success = plc.reconnect()
    return {
        "success": success,
        "connected": plc.connected,
        "message": "Reconnected successfully" if success else "Reconnection failed"
    }


@router.get("/parameters")
async def get_parameters():
    """Get current test parameters from PLC"""
    if data_service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    return data_service.get_parameters()


@router.post("/parameters")
async def set_parameters(params: ParametersRequest):
    """Set test parameters to PLC"""
    if data_service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")

    # Only send non-None params to PLC
    kwargs = {k: v for k, v in params.model_dump().items() if v is not None}
    success = data_service.set_parameters(**kwargs)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to write parameters to PLC")

    return {"success": True, "message": "Parameters updated successfully"}


@router.get("/test-metadata")
async def get_test_metadata():
    from api.websocket import get_pending_metadata
    return get_pending_metadata()


@router.post("/test-metadata")
async def set_test_metadata(meta: TestMetadataRequest):
    from api.websocket import set_pending_metadata, set_group_config
    data = meta.model_dump()
    set_pending_metadata(data)
    set_group_config(data)
    return {"success": True, "message": "Test metadata saved"}
