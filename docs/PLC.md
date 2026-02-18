# PLC Integration Guide

Complete documentation for Siemens S7-1214C PLC communication using Snap7.

---

## Overview

The system uses **Snap7** library to communicate with a Siemens S7-1200 series PLC via TCP/IP (port 102).

### Connection Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| IP Address | 192.168.0.10 | PLC IP address |
| Rack | 0 | PLC rack number |
| Slot | 1 | PLC slot number |
| Port | 102 | S7 communication port |

---

## Data Block Memory Map

The PLC uses three Data Blocks for communication:

### DB1 - Test Parameters (Read/Write)

| Offset | Type | Name | Unit | Description |
|--------|------|------|------|-------------|
| 0 | Real | pipe_diameter | mm | Pipe outer diameter |
| 4 | Real | pipe_length | mm | Pipe length (typically 300mm) |
| 8 | Real | deflection_percent | % | Target deflection percentage (3% per ISO 9969) |
| 12 | Real | test_speed | mm/min | Actuator movement speed |
| 16 | Real | max_stroke | mm | Maximum stroke limit |
| 20 | Real | max_force | kN | Maximum force limit |
| 58 | Int | target_sn_class | - | Target SN class for pass/fail (1250/2500/5000/10000) |

**Memory Layout:**
```
DB1
├── DBD0   : pipe_diameter (Real, 4 bytes)
├── DBD4   : pipe_length (Real, 4 bytes)
├── DBD8   : deflection_percent (Real, 4 bytes)
├── DBD12  : test_speed (Real, 4 bytes)
├── DBD16  : max_stroke (Real, 4 bytes)
├── DBD20  : max_force (Real, 4 bytes)
└── DBW58  : target_sn_class (Int, 2 bytes)
```

---

### DB2 - Test Results (Read Only)

| Offset | Type | Name | Unit | Description |
|--------|------|------|------|-------------|
| 0 | Real | actual_force | kN | Current force reading |
| 4 | Real | actual_deflection | mm | Current deflection |
| 8 | Real | target_deflection | mm | Calculated target deflection |
| 12 | Real | ring_stiffness | kN/m² | Calculated ring stiffness |
| 16 | Real | force_at_target | kN | Force at target deflection |
| 20 | Int | sn_class | - | SN classification (2500/5000/10000) |
| 22 | Int | test_status | - | Current test status code |
| 24 | Bool | test_passed | - | Pass/fail result |

**Test Status Codes:**
| Code | Status | Description |
|------|--------|-------------|
| 0 | Idle | Ready for test |
| 1 | Starting | Test initialization |
| 2 | Testing | Compression in progress |
| 3 | At Target | Target deflection reached |
| 4 | Returning | Returning to home position |
| 5 | Complete | Test finished |

**Memory Layout:**
```
DB2
├── DBD0   : actual_force (Real, 4 bytes)
├── DBD4   : actual_deflection (Real, 4 bytes)
├── DBD8   : target_deflection (Real, 4 bytes)
├── DBD12  : ring_stiffness (Real, 4 bytes)
├── DBD16  : force_at_target (Real, 4 bytes)
├── DBW20  : sn_class (Int, 2 bytes)
├── DBW22  : test_status (Int, 2 bytes)
└── DBX24.0: test_passed (Bool, 1 bit)
```

---

### DB3 - Servo Control (Read/Write)

#### Control Bits - Commands (Write)

| Byte | Bit | Address | Name | Type | Description |
|------|-----|---------|------|------|-------------|
| 0 | 0 | DBX0.0 | Enable | Latch | Servo motor enable |
| 0 | 1 | DBX0.1 | Jog_Forward | Hold | Jog down (hold while moving) |
| 0 | 2 | DBX0.2 | Jog_Backward | Hold | Jog up (hold while moving) |
| 0 | 3 | DBX0.3 | Start_Test | Latch | Start automated test |
| 0 | 4 | DBX0.4 | Stop | Pulse | Emergency stop (pulse) |
| 0 | 5 | DBX0.5 | Reset | Pulse | Reset servo alarm (pulse) |
| 0 | 6 | DBX0.6 | Home | Latch | Go to home position |
| 14 | 0 | DBX14.0 | Lock_Upper | Latch | Lock upper clamp |
| 14 | 1 | DBX14.1 | Lock_Lower | Latch | Lock lower clamp |
| 25 | 0 | DBX25.0 | Remote_Mode | Latch | Enable remote control mode |
| 25 | 1 | DBX25.1 | E_Stop_Active | Status | E-Stop latched state (read) |

#### Status Bits (Read)

| Byte | Bit | Address | Name | Description |
|------|-----|---------|------|-------------|
| 0 | 0 | DBX0.0 | Enable | Servo enable status (echo) |
| 0 | 7 | DBX0.7 | Servo_Ready | Servo motor ready |
| 1 | 0 | DBX1.0 | Servo_Error | Servo fault active |
| 1 | 1 | DBX1.1 | At_Home | At home position |
| 14 | 0 | DBX14.0 | Lock_Upper | Upper clamp locked status |
| 14 | 1 | DBX14.1 | Lock_Lower | Lower clamp locked status |
| 20 | 0 | DBX20.0 | MC_Power | Motion control power on |
| 20 | 1 | DBX20.1 | MC_Busy | Motion control busy |
| 20 | 2 | DBX20.2 | MC_Error | Motion control error |
| 25 | 0 | DBX25.0 | Remote_Mode | Remote mode status (echo) |
| 25 | 1 | DBX25.1 | E_Stop_Active | E-Stop latched state |

#### Analog Values (Real - 4 bytes)

| Offset | Address | Name | Unit | Description |
|--------|---------|------|------|-------------|
| 2 | DBD2 | Actual_Position | mm | Current actuator position |
| 6 | DBD6 | Target_Position | mm | Target position setpoint |
| 10 | DBD10 | Actual_Speed | mm/min | Current speed |
| 16 | DBD16 | Jog_Velocity | mm/min | Jog speed setpoint (1-100) |

**Memory Layout:**
```
DB3 - Servo Control Data Block
├── Byte 0 (Commands)
│   ├── DBX0.0 : Enable
│   ├── DBX0.1 : Jog_Forward
│   ├── DBX0.2 : Jog_Backward
│   ├── DBX0.3 : Start_Test
│   ├── DBX0.4 : Stop
│   ├── DBX0.5 : Reset
│   ├── DBX0.6 : Home
│   └── DBX0.7 : Servo_Ready (status)
│
├── Byte 1 (Status)
│   ├── DBX1.0 : Servo_Error
│   └── DBX1.1 : At_Home
│
├── DBD2  : Actual_Position (Real, 4 bytes)
├── DBD6  : Target_Position (Real, 4 bytes)
├── DBD10 : Actual_Speed (Real, 4 bytes)
│
├── Byte 14 (Clamps)
│   ├── DBX14.0 : Lock_Upper
│   └── DBX14.1 : Lock_Lower
│
├── DBD16 : Jog_Velocity (Real, 4 bytes)
│
├── Byte 20 (MC Status)
│   ├── DBX20.0 : MC_Power
│   ├── DBX20.1 : MC_Busy
│   └── DBX20.2 : MC_Error
│
└── Byte 25 (Mode & E-Stop)
    ├── DBX25.0 : Remote_Mode
    └── DBX25.1 : E_Stop_Active (read-only)
```

---

## Python Implementation

### PLCConnector Class

Located in `backend/plc/connector.py`:

```python
from snap7.client import Client
from snap7.util import get_real, set_real, get_bool, set_bool

class PLCConnector:
    def __init__(self, ip: str, rack: int = 0, slot: int = 1):
        self.client = Client()
        self.ip = ip
        self.rack = rack
        self.slot = slot

    def connect(self) -> bool:
        """Connect to PLC"""
        self.client.connect(self.ip, self.rack, self.slot)
        return self.client.get_connected()

    def read_real(self, db: int, offset: int) -> float:
        """Read Real (float) value from DB"""
        data = self.client.db_read(db, offset, 4)
        return get_real(data, 0)

    def write_real(self, db: int, offset: int, value: float) -> bool:
        """Write Real value to DB"""
        data = bytearray(4)
        set_real(data, 0, value)
        self.client.db_write(db, offset, data)
        return True

    def read_bool(self, db: int, byte: int, bit: int) -> bool:
        """Read Bool value from DB"""
        data = self.client.db_read(db, byte, 1)
        return get_bool(data, 0, bit)

    def write_bool(self, db: int, byte: int, bit: int, value: bool) -> bool:
        """Write Bool value to DB"""
        data = self.client.db_read(db, byte, 1)
        set_bool(data, 0, bit, value)
        self.client.db_write(db, byte, data)
        return True
```

### DataService Class

Located in `backend/plc/data_service.py`:

```python
class DataService:
    """Read data from PLC via DB3"""

    DB_NUMBER = 3

    # Status bits
    STATUS_ENABLE = (0, 0)        # DB3.DBX0.0
    STATUS_SERVO_READY = (0, 7)   # DB3.DBX0.7
    STATUS_SERVO_ERROR = (1, 0)   # DB3.DBX1.0
    STATUS_AT_HOME = (1, 1)       # DB3.DBX1.1
    STATUS_LOCK_UPPER = (14, 0)   # DB3.DBX14.0
    STATUS_LOCK_LOWER = (14, 1)   # DB3.DBX14.1
    STATUS_MC_POWER = (20, 0)     # DB3.DBX20.0
    STATUS_MC_BUSY = (20, 1)      # DB3.DBX20.1
    STATUS_MC_ERROR = (20, 2)     # DB3.DBX20.2
    STATUS_REMOTE_MODE = (25, 0)  # DB3.DBX25.0
    STATUS_ESTOP_ACTIVE = (25, 1) # DB3.DBX25.1

    # Real values
    VAL_ACTUAL_POSITION = 2       # DB3.DBD2
    VAL_TARGET_POSITION = 6       # DB3.DBD6
    VAL_ACTUAL_SPEED = 10         # DB3.DBD10
    VAL_JOG_VELOCITY = 16         # DB3.DBD16

    def get_live_data(self) -> dict:
        """Read all real-time values - called every 100ms"""
        return {
            "servo_ready": self.plc.read_bool(self.DB_NUMBER, *self.STATUS_SERVO_READY),
            "servo_error": self.plc.read_bool(self.DB_NUMBER, *self.STATUS_SERVO_ERROR),
            "at_home": self.plc.read_bool(self.DB_NUMBER, *self.STATUS_AT_HOME),
            "remote_mode": self.plc.read_bool(self.DB_NUMBER, *self.STATUS_REMOTE_MODE),
            "actual_position": self.plc.read_real(self.DB_NUMBER, self.VAL_ACTUAL_POSITION),
            "connected": True,
            # ... more fields
        }
```

### CommandService Class

Located in `backend/plc/command_service.py`:

```python
class CommandService:
    """Send commands to PLC via DB3"""

    DB_NUMBER = 3

    # Commands (Byte 0)
    CMD_ENABLE = (0, 0)         # DB3.DBX0.0
    CMD_JOG_FORWARD = (0, 1)    # DB3.DBX0.1
    CMD_JOG_BACKWARD = (0, 2)   # DB3.DBX0.2
    CMD_START_TEST = (0, 3)     # DB3.DBX0.3
    CMD_STOP = (0, 4)           # DB3.DBX0.4
    CMD_RESET = (0, 5)          # DB3.DBX0.5
    CMD_HOME = (0, 6)           # DB3.DBX0.6

    # Clamps (Byte 14)
    CMD_LOCK_UPPER = (14, 0)    # DB3.DBX14.0
    CMD_LOCK_LOWER = (14, 1)    # DB3.DBX14.1

    # Mode (Byte 25)
    CMD_REMOTE_MODE = (25, 0)   # DB3.DBX25.0

    # Real Values
    CMD_JOG_VELOCITY = 16       # DB3.DBD16

    def jog_forward(self, state: bool) -> bool:
        """Jog forward - DB3.DBX0.1"""
        if state:
            self.plc.write_bool(self.DB_NUMBER, *self.CMD_JOG_BACKWARD, False)
        return self.plc.write_bool(self.DB_NUMBER, *self.CMD_JOG_FORWARD, state)

    def set_remote_mode(self, is_remote: bool) -> bool:
        """Set remote mode - DB3.DBX25.0"""
        return self.plc.write_bool(self.DB_NUMBER, *self.CMD_REMOTE_MODE, is_remote)
```

---

## TIA Portal Configuration

### Enabling PUT/GET Communication

In TIA Portal, configure the PLC to allow Snap7 access:

1. Open PLC properties
2. Go to **Protection & Security** > **Connection mechanisms**
3. Enable **Permit access with PUT/GET communication from remote partner**

### Optimized Block Access

Disable optimized block access for Data Blocks:

1. Right-click on the Data Block
2. Select **Properties**
3. Under **Attributes**, uncheck **Optimized block access**
4. Recompile and download

---

## Network Configuration

### IP Address Setup

```
┌────────────────────────────────────────┐
│              NETWORK                    │
│                                         │
│  Backend Server: 192.168.0.10          │
│         │                               │
│         │ TCP Port 102                  │
│         ▼                               │
│  PLC: 192.168.0.10                    │
│                                         │
└────────────────────────────────────────┘
```

### Firewall Rules

Ensure port 102 is open between the server and PLC:

```bash
# Linux (iptables)
sudo iptables -A OUTPUT -p tcp --dport 102 -j ACCEPT
sudo iptables -A INPUT -p tcp --sport 102 -j ACCEPT
```

---

## Safety Considerations

### Software Interlocks

The backend implements these safety measures:

1. **Jog Auto-Stop**: When WebSocket disconnects, all jog movements stop
2. **Velocity Limits**: Jog velocity clamped to 1.2-400 mm/min
3. **Shutdown Safety**: All movements stopped on server shutdown

### PLC Interlocks (Recommended)

The PLC should implement:

1. **Position Limits**: Prevent movement beyond stroke limits
2. **Force Limits**: Stop if force exceeds max_force
3. **Watchdog**: Monitor communication with backend
4. **E-Stop Chain**: Hardware emergency stop circuit

---

## Troubleshooting

### Connection Issues

| Problem | Solution |
|---------|----------|
| Connection refused | Check PLC IP, ensure port 102 open |
| Timeout | Verify network connectivity, ping PLC |
| Read error | Check DB exists, verify offsets |
| Write error | Ensure PUT/GET enabled, check block access |

### Debug Logging

Enable verbose logging in `backend/config.py`:

```python
LOGGING_LEVEL = "DEBUG"
```

Check logs for Snap7 communication:

```bash
tail -f backend/grp_test.log | grep -i plc
```

### Common Error Codes

| Snap7 Error | Meaning | Solution |
|-------------|---------|----------|
| 0x00100000 | TCP Connection error | Check network |
| 0x00200000 | Read/Write error | Verify DB offsets |
| 0x00300000 | Address error | Check DB number |

---

## Ring Stiffness Calculation

The PLC calculates ring stiffness according to ISO 9969:

```
Ring Stiffness (S) = F / (L × y)

Where:
  F = Force at 3% deflection (kN)
  L = Pipe length (m)
  y = Deflection (m)
```

### SN Classification

| SN Class | Min Stiffness (kN/m²) |
|----------|----------------------|
| SN 2500 | 2500 |
| SN 5000 | 5000 |
| SN 10000 | 10000 |

Pass criteria: Ring stiffness >= 90% of SN class value

---

## Data Types Reference

### Siemens to Python Type Mapping

| S7 Type | Size | Python Type | Snap7 Function |
|---------|------|-------------|----------------|
| Bool | 1 bit | bool | get_bool/set_bool |
| Int | 2 bytes | int | get_int |
| Real | 4 bytes | float | get_real/set_real |
| DInt | 4 bytes | int | get_dint |
| String | variable | str | get_string |

### Byte Order

Siemens PLCs use **Big Endian** byte order. Snap7 handles conversion automatically.
