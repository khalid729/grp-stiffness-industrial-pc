import socketio
import asyncio
import logging
from typing import Optional
from config import settings
from datetime import datetime, timezone, timedelta
import time

logger = logging.getLogger(__name__)

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=False,
    engineio_logger=False
)

# Services - will be set from main.py
data_service = None
command_service = None
plc_connector = None  # PLC connector for reconnection

# Background task handle
broadcast_task: Optional[asyncio.Task] = None

# Calculated deflection state
_test_start_time: Optional[float] = None
_test_speed: float = 0.0
_test_data_points: list = []

# Pending test metadata
_pending_metadata: dict = {}

SAUDI_TZ = timezone(timedelta(hours=3))


def set_pending_metadata(data: dict):
    global _pending_metadata
    _pending_metadata = {
        'sample_id': data.get('sample_id', ''),
        'operator': data.get('operator', ''),
        'notes': data.get('notes', ''),
    }


def get_pending_metadata() -> dict:
    return dict(_pending_metadata)


def set_services(data_svc, cmd_svc, plc=None):
    """Set service instances from main.py"""
    global data_service, command_service, plc_connector
    data_service = data_svc
    command_service = cmd_svc
    plc_connector = plc


@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    logger.info(f"Client connected: {sid}")
    await sio.emit('connection_status', {'connected': True}, room=sid)


@sio.event
async def disconnect(sid):
    """Handle client disconnect - SAFETY: stop all jog on disconnect"""
    logger.info(f"Client disconnected: {sid}")
    if command_service:
        # Safety: stop all jog movements when client disconnects
        command_service.stop_all_jog()
        logger.warning(f"Safety stop executed for disconnected client: {sid}")


@sio.event
async def subscribe(sid, data):
    """Subscribe to live data updates"""
    await sio.enter_room(sid, 'live_data')
    logger.info(f"Client {sid} subscribed to live_data")


@sio.event
async def unsubscribe(sid, data):
    """Unsubscribe from live data updates"""
    await sio.leave_room(sid, 'live_data')
    logger.info(f"Client {sid} unsubscribed from live_data")


@sio.event
async def jog_forward(sid, data):
    """Handle jog forward command from client"""
    if command_service:
        state = data.get('state', False)
        result = command_service.jog_forward(state)

        # Check if jog was rejected due to LOCAL mode
        if not result.get('success') and result.get('reason') == 'LOCAL_MODE':
            await sio.emit('jog_rejected', {
                'direction': 'forward',
                'reason': result.get('reason'),
                'message': result.get('message')
            }, room=sid)

        await sio.emit('jog_response', {
            'direction': 'forward',
            'state': state,
            'success': result.get('success', False)
        }, room=sid)


@sio.event
async def jog_backward(sid, data):
    """Handle jog backward command from client"""
    if command_service:
        state = data.get('state', False)
        result = command_service.jog_backward(state)

        # Check if jog was rejected due to LOCAL mode
        if not result.get('success') and result.get('reason') == 'LOCAL_MODE':
            await sio.emit('jog_rejected', {
                'direction': 'backward',
                'reason': result.get('reason'),
                'message': result.get('message')
            }, room=sid)

        await sio.emit('jog_response', {
            'direction': 'backward',
            'state': state,
            'success': result.get('success', False)
        }, room=sid)


@sio.event
async def set_jog_speed(sid, data):
    """Set jog velocity"""
    if command_service:
        velocity = data.get('velocity', 50)
        success = command_service.set_jog_velocity(velocity)
        await sio.emit('jog_speed_response', {
            'velocity': velocity,
            'success': success
        }, room=sid)


async def _save_test_result(data: dict):
    """Save completed test result to database"""
    global _pending_metadata, _test_data_points
    from db.database import AsyncSessionLocal
    from db.models import Test, TestDataPoint

    try:
        params = data_service.get_parameters() if data_service else {}
        results = data.get('results', {})
        test_info = data.get('test', {})

        test_record = Test(
            pipe_diameter=params.get('pipe_diameter', 0),
            pipe_length=params.get('pipe_length', 300),
            deflection_percent=params.get('deflection_percent', 3),
            force_at_target=results.get('force_at_target', 0),
            ring_stiffness=results.get('ring_stiffness', 0),
            sn_class=results.get('sn_class', 0),
            passed=test_info.get('passed', False),
            test_speed=params.get('test_speed', 12),
            max_force=results.get('force_at_target', 0),
        )

        # Apply pending metadata
        if _pending_metadata.get('sample_id'):
            test_record.sample_id = _pending_metadata.get('sample_id')
        if _pending_metadata.get('operator'):
            test_record.operator = _pending_metadata.get('operator')
        if _pending_metadata.get('notes'):
            test_record.notes = _pending_metadata.get('notes')
        test_record.test_date = datetime.now(SAUDI_TZ)

        async with AsyncSessionLocal() as session:
            session.add(test_record)
            await session.flush()  # Get the test ID
            
            # Save data points
            if _test_data_points:
                for dp in _test_data_points:
                    point = TestDataPoint(
                        test_id=test_record.id,
                        timestamp=dp['timestamp'],
                        force=dp['force'],
                        deflection=dp['deflection'],
                        position=dp.get('position', 0),
                    )
                    session.add(point)
                logger.info(f"Saving {len(_test_data_points)} data points")
            
            await session.commit()
            logger.info(f"Test result saved: Ø{test_record.pipe_diameter}mm, "
                        f"RS={test_record.ring_stiffness:.1f} kN/m², "
                        f"SN{test_record.sn_class}, {'PASS' if test_record.passed else 'FAIL'}")
            _pending_metadata = {}
            return test_record.id
    except Exception as e:
        logger.error(f"Failed to save test result: {e}")
        return None


async def broadcast_live_data():
    """Background task to broadcast live data every 100ms"""
    global _test_start_time, _test_speed, _test_data_points
    
    logger.info("Starting live data broadcast task")
    reconnect_interval = 0
    last_connected = False
    last_test_status = 0

    while True:
        try:
            # Try to reconnect if disconnected (every 5 seconds)
            if plc_connector and not plc_connector.connected:
                reconnect_interval += 1
                if reconnect_interval >= 50:
                    reconnect_interval = 0
                    logger.info("Attempting to reconnect to PLC...")
                    if plc_connector.connect():
                        logger.info("Reconnected to PLC successfully!")
                        await emit_connection_status(True)
                        last_connected = True
                    else:
                        if last_connected:
                            await emit_connection_status(False)
                            last_connected = False
            else:
                reconnect_interval = 0
                if plc_connector and plc_connector.connected and not last_connected:
                    last_connected = True
                    await emit_connection_status(True)

            if data_service:
                data = data_service.get_live_data()
                
                current_test_status = data.get('test_status', 0)
                
                # Detect test start: transition into active testing (status >= 2)
                if current_test_status >= 2 and last_test_status < 2:
                    _test_start_time = time.monotonic()
                    params = data_service.get_parameters()
                    _test_speed = params.get('test_speed', 12.0) or 12.0
                    _test_data_points = []
                    logger.info(f"Calculated deflection started: speed={_test_speed} mm/min")
                
                # Calculate deflection during active test (status 2-5)
                calculated_deflection = 0.0
                if _test_start_time is not None and 2 <= current_test_status <= 5:
                    elapsed = time.monotonic() - _test_start_time
                    calculated_deflection = (_test_speed / 60.0) * elapsed
                    
                    # Accumulate data points
                    force_kn = data.get('actual_force', 0) or 0.0
                    _test_data_points.append({
                        'timestamp': elapsed,
                        'force': force_kn,
                        'deflection': calculated_deflection,
                        'position': data.get('actual_position', 0) or 0.0,
                    })
                
                # Inject calculated_deflection into broadcast
                data['calculated_deflection'] = calculated_deflection
                
                await sio.emit('live_data', data, room='live_data')
                
                # Detect test completion: active -> complete/idle
                if last_test_status >= 2 and last_test_status <= 5 and (current_test_status == 0 or current_test_status >= 5):
                    if last_test_status != current_test_status:
                        logger.info(f"Test completed (status {last_test_status} -> {current_test_status}) - saving results")
                        saved_test_id = await _save_test_result(data)
                        await emit_test_complete({
                            'results': data.get('results', {}),
                            'test': data.get('test', {}),
                            'test_id': saved_test_id,
                        })
                        # Reset calculated deflection state
                        _test_start_time = None
                        _test_data_points = []
                
                last_test_status = current_test_status

        except Exception as e:
            logger.error(f"Error broadcasting live data: {e}")

        await asyncio.sleep(settings.WS_UPDATE_INTERVAL)


async def emit_test_complete(test_data: dict):
    """Emit test complete event to all clients"""
    await sio.emit('test_complete', test_data, room='live_data')
    logger.info(f"Test complete event emitted: {test_data}")


async def emit_alarm(alarm_data: dict):
    """Emit alarm event to all clients"""
    await sio.emit('alarm', alarm_data, room='live_data')
    logger.warning(f"Alarm event emitted: {alarm_data}")


async def emit_connection_status(connected: bool):
    """Emit PLC connection status change"""
    await sio.emit('connection_status', {'connected': connected}, room='live_data')
    logger.info(f"Connection status emitted: {connected}")


def start_broadcast_task():
    """Start the background broadcast task"""
    global broadcast_task
    if broadcast_task is None or broadcast_task.done():
        broadcast_task = asyncio.create_task(broadcast_live_data())
        logger.info("Broadcast task started")


def stop_broadcast_task():
    """Stop the background broadcast task"""
    global broadcast_task
    if broadcast_task and not broadcast_task.done():
        broadcast_task.cancel()
        logger.info("Broadcast task stopped")
