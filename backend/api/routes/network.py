"""
Network Configuration API - WiFi and LAN settings
"""

import subprocess
import os
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/network", tags=["Network"])


class WifiConnectRequest(BaseModel):
    ssid: str
    password: str


class LanConfigRequest(BaseModel):
    mode: str  # "static" or "dhcp"
    ip_address: Optional[str] = None
    subnet_mask: Optional[str] = "255.255.255.0"
    gateway: Optional[str] = None


def run_command(cmd: list[str], timeout: int = 30) -> tuple[bool, str]:
    """Run a shell command and return success status and output"""
    # Full paths for system commands
    cmd_paths = {
        "nmcli": "/usr/bin/nmcli",
        "ip": "/usr/sbin/ip",
        "sudo": "/usr/bin/sudo",
        "iwlist": "/usr/sbin/iwlist",
    }

    # Replace command with full path if available
    if cmd and cmd[0] in cmd_paths:
        cmd = [cmd_paths[cmd[0]]] + cmd[1:]
    elif cmd and len(cmd) > 1 and cmd[0] == "sudo" and cmd[1] in cmd_paths:
        cmd = [cmd_paths["sudo"], cmd_paths[cmd[1]]] + cmd[2:]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            env={**os.environ, "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"}
        )
        output = result.stdout + result.stderr
        return result.returncode == 0, output.strip()
    except subprocess.TimeoutExpired:
        return False, "Command timed out"
    except Exception as e:
        return False, str(e)


@router.get("/wifi/scan")
async def scan_wifi_networks():
    """Scan for available WiFi networks"""
    success, output = run_command(["sudo", "nmcli", "-t", "-f", "SSID,SIGNAL,SECURITY", "dev", "wifi", "list", "--rescan", "yes"])

    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to scan WiFi: {output}")

    networks = []
    seen_ssids = set()

    for line in output.split('\n'):
        if line.strip():
            parts = line.split(':')
            if len(parts) >= 3:
                ssid = parts[0].strip()
                if ssid and ssid not in seen_ssids and ssid != "--":
                    seen_ssids.add(ssid)
                    networks.append({
                        "ssid": ssid,
                        "signal": int(parts[1]) if parts[1].isdigit() else 0,
                        "security": parts[2] if len(parts) > 2 else "Open"
                    })

    # Sort by signal strength
    networks.sort(key=lambda x: x["signal"], reverse=True)

    return {"networks": networks}


@router.get("/wifi/status")
async def get_wifi_status():
    """Get current WiFi connection status"""
    # Get active connections
    success, output = run_command(["nmcli", "-t", "-f", "NAME,TYPE,DEVICE", "con", "show", "--active"])

    wifi_connection = None
    for line in output.split('\n'):
        parts = line.split(':')
        if len(parts) >= 3 and parts[1] == '802-11-wireless':
            wifi_connection = parts[0]
            break

    # Get IP address from wlan0
    ip_address = None
    success2, ip_output = run_command(["ip", "-4", "addr", "show", "wlan0"])
    if success2:
        for line in ip_output.split('\n'):
            if 'inet ' in line:
                ip_address = line.split()[1].split('/')[0]
                break

    return {
        "connected": ip_address is not None,
        "ssid": wifi_connection,
        "ip_address": ip_address
    }


@router.post("/wifi/connect")
async def connect_wifi(request: WifiConnectRequest):
    """Connect to a WiFi network"""
    logger.info(f"Attempting to connect to WiFi: {request.ssid}")

    # Try to connect
    success, output = run_command([
        "sudo", "nmcli", "dev", "wifi", "connect",
        request.ssid, "password", request.password
    ], timeout=60)

    if not success:
        logger.error(f"Failed to connect to WiFi {request.ssid}: {output}")
        raise HTTPException(status_code=400, detail=f"Failed to connect: {output}")

    logger.info(f"Successfully connected to WiFi: {request.ssid}")
    return {"success": True, "message": f"Connected to {request.ssid}"}


@router.post("/wifi/disconnect")
async def disconnect_wifi():
    """Disconnect from current WiFi network"""
    success, output = run_command(["sudo", "nmcli", "dev", "disconnect", "wlan0"])

    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to disconnect: {output}")

    return {"success": True, "message": "Disconnected from WiFi"}


@router.get("/lan/status")
async def get_lan_status():
    """Get LAN (eth0) configuration status"""
    config = {
        "mode": "dhcp",
        "ip_address": None,
        "subnet_mask": "255.255.255.0",
        "gateway": None,
        "connected": False
    }

    # Get connection config
    success, output = run_command(["nmcli", "-t", "-f", "ipv4.method,ipv4.addresses,ipv4.gateway", "con", "show", "Wired connection 1"])

    for line in output.split('\n'):
        if line.startswith('ipv4.method:'):
            method = line.split(':', 1)[1].strip()
            config["mode"] = "static" if method == "manual" else "dhcp"
        elif line.startswith('ipv4.addresses:'):
            addr = line.split(':', 1)[1].strip()
            if addr and addr != "--" and addr != "":
                if '/' in addr:
                    config["ip_address"] = addr.split('/')[0]
                    try:
                        prefix = int(addr.split('/')[1])
                        mask = (0xffffffff >> (32 - prefix)) << (32 - prefix)
                        config["subnet_mask"] = f"{(mask >> 24) & 0xff}.{(mask >> 16) & 0xff}.{(mask >> 8) & 0xff}.{mask & 0xff}"
                    except:
                        pass
        elif line.startswith('ipv4.gateway:'):
            gw = line.split(':', 1)[1].strip()
            if gw and gw != "--" and gw != "":
                config["gateway"] = gw

    # Get actual current IP from interface
    success2, ip_output = run_command(["ip", "-4", "addr", "show", "eth0"])
    if success2:
        for line in ip_output.split('\n'):
            if 'inet ' in line:
                parts = line.split()
                if len(parts) >= 2:
                    ip_with_prefix = parts[1]
                    config["ip_address"] = ip_with_prefix.split('/')[0]
                    config["connected"] = True
                break

    return config


@router.post("/lan/configure")
async def configure_lan(request: LanConfigRequest):
    """Configure LAN (eth0) - static IP or DHCP"""
    logger.info(f"Configuring LAN: mode={request.mode}")

    if request.mode == "static":
        if not request.ip_address:
            raise HTTPException(status_code=400, detail="IP address is required for static mode")

        # Calculate prefix from subnet mask
        prefix = 24  # default
        if request.subnet_mask:
            octets = request.subnet_mask.split('.')
            binary = ''.join(format(int(o), '08b') for o in octets)
            prefix = binary.count('1')

        # Set static IP
        success, output = run_command([
            "sudo", "nmcli", "con", "mod", "Wired connection 1",
            "ipv4.addresses", f"{request.ip_address}/{prefix}",
            "ipv4.method", "manual"
        ])

        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to set IP: {output}")

        # Set gateway if provided
        if request.gateway:
            run_command([
                "sudo", "nmcli", "con", "mod", "Wired connection 1",
                "ipv4.gateway", request.gateway
            ])

    else:  # DHCP
        success, output = run_command([
            "sudo", "nmcli", "con", "mod", "Wired connection 1",
            "ipv4.method", "auto"
        ])

        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to set DHCP: {output}")

        # Clear static settings
        run_command([
            "sudo", "nmcli", "con", "mod", "Wired connection 1",
            "ipv4.addresses", "",
            "ipv4.gateway", ""
        ])

    # Restart connection
    run_command(["sudo", "nmcli", "con", "down", "Wired connection 1"])
    success, output = run_command(["sudo", "nmcli", "con", "up", "Wired connection 1"])

    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to apply settings: {output}")

    logger.info(f"LAN configured successfully: {request.mode}")
    return {"success": True, "message": f"LAN configured as {request.mode}"}
