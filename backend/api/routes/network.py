"""
Network Configuration API - WiFi and LAN settings
"""

import subprocess
import os
import logging
import re
import re as regex
import socket
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


def _tcp_reachable(host: str, port: int, timeout: float = 1.5) -> bool:
    """Quick TCP connect test — used as a light internet-reachability probe."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False

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
    cmd_paths = {
        "nmcli": "/usr/bin/nmcli",
        "ip": "/usr/sbin/ip",
        "sudo": "/usr/bin/sudo",
        "iwlist": "/usr/sbin/iwlist",
        "cp": "/bin/cp",
        "cat": "/bin/cat",
        "netplan": "/usr/sbin/netplan",
        "pgrep": "/usr/bin/pgrep",
        "pkill": "/usr/bin/pkill",
    }
    # Handle sudo specially - need to replace both sudo and the command after it
    if cmd and cmd[0] == "sudo":
        cmd = list(cmd)  # Make a copy
        cmd[0] = cmd_paths.get("sudo", cmd[0])
        if len(cmd) > 1 and cmd[1] in cmd_paths:
            cmd[1] = cmd_paths[cmd[1]]
    elif cmd and cmd[0] in cmd_paths:
        cmd = [cmd_paths[cmd[0]]] + cmd[1:]
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


def get_wifi_interface() -> Optional[str]:
    """Auto-detect the WiFi interface name using nmcli"""
    success, output = run_command(["nmcli", "-t", "-f", "DEVICE,TYPE", "dev"])
    if success:
        for line in output.split("\n"):
            parts = line.strip().split(":")
            if len(parts) >= 2 and parts[1] == "wifi":
                return parts[0]
    return None


def _saved_wifi_ssids() -> set[str]:
    """Return the set of SSIDs that have a saved NM profile (regardless of state)."""
    ok, out = run_command(["nmcli", "-t", "-f", "NAME,TYPE", "con", "show"])
    if not ok:
        return set()
    saved = set()
    for line in out.splitlines():
        parts = line.split(":")
        if len(parts) >= 2 and parts[1] == "802-11-wireless":
            saved.add(parts[0])
    return saved


@router.get("/wifi/scan")
async def scan_wifi_networks():
    """Scan for available WiFi networks. Each entry includes `saved: bool` so
    the UI can connect to known networks without prompting for the password.
    """
    success, output = run_command(["sudo", "nmcli", "-t", "-f", "SSID,SIGNAL,SECURITY", "dev", "wifi", "list", "--rescan", "yes"])
    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to scan WiFi: {output}")
    saved = _saved_wifi_ssids()
    networks = []
    seen_ssids = set()
    for line in output.split("\n"):
        if line.strip():
            parts = line.split(":")
            if len(parts) >= 3:
                ssid = parts[0].strip()
                if ssid and ssid not in seen_ssids and ssid != "--":
                    seen_ssids.add(ssid)
                    networks.append({
                        "ssid": ssid,
                        "signal": int(parts[1]) if parts[1].isdigit() else 0,
                        "security": parts[2] if len(parts) > 2 else "Open",
                        "saved": ssid in saved,
                    })
    networks.sort(key=lambda x: x["signal"], reverse=True)
    return {"networks": networks}


@router.get("/wifi/status")
async def get_wifi_status():
    """Get current WiFi connection status"""
    success, output = run_command(["nmcli", "-t", "-f", "NAME,TYPE,DEVICE", "con", "show", "--active"])
    wifi_connection = None
    wifi_device = None
    for line in output.split("\n"):
        parts = line.split(":")
        if len(parts) >= 3 and parts[1] == "802-11-wireless":
            wifi_connection = parts[0]
            wifi_device = parts[2]
            break

    # Use the device from the active connection, fall back to auto-detect
    iface = wifi_device or get_wifi_interface() or "wlan0"

    ip_address = None
    success2, ip_output = run_command(["ip", "-4", "addr", "show", iface])
    if success2:
        for line in ip_output.split("\n"):
            if "inet " in line:
                ip_address = line.split()[1].split("/")[0]
                break
    # Internet reachability probe — uses a TCP connect (no ICMP perms needed,
    # and faster + more reliable than ping). 1.1.1.1:53 is Cloudflare DNS.
    internet_ok = _tcp_reachable("1.1.1.1", 53, timeout=1.5)

    return {
        "connected": wifi_connection is not None and ip_address is not None,
        "ssid": wifi_connection,
        "ip_address": ip_address,
        "internet_ok": internet_ok,
    }


def _profile_exists(ssid: str) -> bool:
    """Check if a NetworkManager connection profile with this name exists."""
    ok, out = run_command(["nmcli", "-t", "-f", "NAME", "con", "show"])
    if not ok:
        return False
    return ssid in out.splitlines()


@router.post("/wifi/connect")
async def connect_wifi(request: WifiConnectRequest):
    """Connect to a WiFi network.

    Behavior depends on whether a profile for `ssid` already exists:

      - **Existing profile + password provided**: update the stored PSK with
        `nmcli con modify`, then activate with `con up`. We do NOT use
        `nmcli dev wifi connect` here because it triggers a partial profile
        rewrite that can fail with `802-11-wireless-security.key-mgmt:
        property is missing` and crash wpa_supplicant (observed once, took
        the wifi card down until reboot).

      - **Existing profile + no password**: `con up` using the stored PSK.

      - **New SSID**: `nmcli dev wifi connect SSID password XXX` creates a
        fresh profile.
    """
    logger.info(f"Attempting to connect to WiFi: {request.ssid}")

    has_password = bool(request.password and request.password.strip())
    exists = _profile_exists(request.ssid)

    if exists and has_password:
        # Update the stored password on the existing profile, then activate.
        ok, out = run_command([
            "sudo", "nmcli", "con", "modify", request.ssid,
            "802-11-wireless-security.psk", request.password,
        ])
        if not ok:
            logger.error(f"Failed to update PSK on {request.ssid}: {out}")
            raise HTTPException(status_code=400, detail=f"Failed to update password: {out}")
        success, output = run_command(["sudo", "nmcli", "con", "up", request.ssid], timeout=60)
    elif exists:
        # No password — reuse stored credentials.
        success, output = run_command(["sudo", "nmcli", "con", "up", request.ssid], timeout=60)
    else:
        # New SSID — create profile + connect in one shot.
        if not has_password:
            raise HTTPException(status_code=400, detail="Password required for a new network")
        success, output = run_command([
            "sudo", "nmcli", "dev", "wifi", "connect",
            request.ssid, "password", request.password,
        ], timeout=60)

    if not success:
        logger.error(f"Failed to connect to WiFi {request.ssid}: {output}")
        raise HTTPException(status_code=400, detail=f"Failed to connect: {output}")

    # Defensive: make sure autoconnect is on for the profile we just brought up.
    run_command(["sudo", "nmcli", "con", "modify", request.ssid, "connection.autoconnect", "yes"])
    logger.info(f"Successfully connected to WiFi: {request.ssid}")
    return {"success": True, "message": f"Connected to {request.ssid}"}


@router.post("/wifi/disconnect")
async def disconnect_wifi():
    """Disconnect the wireless device. Non-sticky — NetworkManager will
    re-activate the highest-priority autoconnect=yes profile in range. To
    switch networks, just call /wifi/connect with the new SSID (no need to
    disconnect first; nmcli handles the swap atomically).
    """
    iface = get_wifi_interface() or "wlan0"
    success, output = run_command(["sudo", "nmcli", "dev", "disconnect", iface])
    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to disconnect: {output}")
    return {"success": True, "message": "Disconnected from WiFi"}


@router.get("/lan/status")
async def get_lan_status():
    """Get LAN (enp2s0) configuration status"""
    config = {
        "mode": "dhcp",
        "ip_address": None,
        "subnet_mask": "255.255.255.0",
        "gateway": None,
        "connected": False
    }
    success, ip_output = run_command(["ip", "-4", "addr", "show", "enp2s0"])
    if success:
        for line in ip_output.split("\n"):
            if "inet " in line:
                parts = line.split()
                if len(parts) >= 2:
                    ip_with_prefix = parts[1]
                    config["ip_address"] = ip_with_prefix.split("/")[0]
                break

    # Check link state
    success2, link_output = run_command(["ip", "link", "show", "enp2s0"])
    if success2 and "state UP" in link_output:
        config["connected"] = True

    return config


@router.post("/lan/configure")
async def configure_lan(request: LanConfigRequest):
    """Configure LAN (enp2s0) via netplan"""
    logger.info(f"Configuring LAN (enp2s0): mode={request.mode}")

    try:
        # Read current enp1s0 config to preserve it
        lan2_config = ""
        try:
            success, netplan_out = run_command(["sudo", "cat", "/etc/netplan/00-installer-config.yaml"])
            if success and "enp1s0" in netplan_out:
                # Extract enp1s0 section
                match = regex.search(r'enp1s0:[^e]*?(?=enp|$)', netplan_out, regex.DOTALL)
                if match:
                    lan2_config = match.group(0).rstrip()
        except:
            pass

        if not lan2_config:
            lan2_config = """enp1s0:
      dhcp4: true"""

        if request.mode == "static":
            if not request.ip_address:
                raise HTTPException(status_code=400, detail="IP address required for static mode")
            prefix = 24
            if request.subnet_mask:
                octets = request.subnet_mask.split(".")
                binary = "".join(format(int(o), "08b") for o in octets)
                prefix = binary.count("1")

            lan1_config = f"""enp2s0:
      addresses:
        - {request.ip_address}/{prefix}"""
            if request.gateway:
                lan1_config += f"""
      routes:
        - to: default
          via: {request.gateway}"""
        else:
            lan1_config = """enp2s0:
      dhcp4: true
      dhcp6: true"""

        netplan_config = f"""network:
  version: 2
  renderer: networkd
  ethernets:
    {lan2_config}
    {lan1_config}
"""

        with open("/tmp/netplan-config.yaml", "w") as f:
            f.write(netplan_config)

        success, output = run_command(["sudo", "cp", "/tmp/netplan-config.yaml", "/etc/netplan/00-installer-config.yaml"])
        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to write config: {output}")

        success, output = run_command(["sudo", "netplan", "apply"])
        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to apply netplan: {output}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply: {str(e)}")

    logger.info(f"LAN (enp2s0) configured successfully: {request.mode}")
    return {"success": True, "message": f"LAN configured as {request.mode}"}


# ═══════════════════════════════════════════════════════════════════════════════
# POWER CONTROL APIs
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/power/shutdown")
async def shutdown_system():
    """Shutdown the system"""
    logger.warning("System shutdown requested!")
    success, output = run_command(["sudo", "shutdown", "-h", "now"])
    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to shutdown: {output}")
    return {"success": True, "message": "System is shutting down..."}


@router.post("/power/restart")
async def restart_system():
    """Restart the system"""
    logger.warning("System restart requested!")
    success, output = run_command(["sudo", "reboot"])
    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to restart: {output}")
    return {"success": True, "message": "System is restarting..."}


# ═══════════════════════════════════════════════════════════════════════════════
# LAN2 (enp1s0 - General Network) APIs
# ═══════════════════════════════════════════════════════════════════════════════

class Lan2ConfigRequest(BaseModel):
    mode: str
    ip_address: Optional[str] = None
    subnet_mask: Optional[str] = "255.255.255.0"
    gateway: Optional[str] = None


@router.get("/lan2/status")
async def get_lan2_status():
    """Get LAN2 (enp1s0 - General) configuration status"""
    config = {
        "interface": "enp1s0",
        "mode": "static",
        "ip_address": "192.168.0.100",
        "subnet_mask": "255.255.255.0",
        "gateway": None,
        "connected": False
    }

    # Try to read configured IP from netplan
    try:
        success, netplan_output = run_command(["sudo", "cat", "/etc/netplan/00-installer-config.yaml"])
        if success and "enp1s0" in netplan_output:
            if "enp1s0:" in netplan_output:
                enp1s0_part = netplan_output.split("enp1s0:")[1]
                if "enp2s0:" in enp1s0_part:
                    enp1s0_part = enp1s0_part.split("enp2s0:")[0]
                if "dhcp4: true" in enp1s0_part:
                    config["mode"] = "dhcp"
                    config["ip_address"] = None
                else:
                    match = regex.search(r"addresses:\s*\n\s*-\s*([\d.]+)/(\d+)", enp1s0_part)
                    if match:
                        config["ip_address"] = match.group(1)
                        prefix = int(match.group(2))
                        mask = (0xffffffff >> (32 - prefix)) << (32 - prefix)
                        config["subnet_mask"] = f"{(mask >> 24) & 0xff}.{(mask >> 16) & 0xff}.{(mask >> 8) & 0xff}.{mask & 0xff}"
    except Exception as e:
        logger.error(f"Error reading netplan: {e}")

    # Get actual IP if interface is up
    success, ip_output = run_command(["ip", "-4", "addr", "show", "enp1s0"])
    if success:
        for line in ip_output.split("\n"):
            if "inet " in line:
                parts = line.split()
                if len(parts) >= 2:
                    config["ip_address"] = parts[1].split("/")[0]
                break

    # Check if link is up
    success2, link_output = run_command(["ip", "link", "show", "enp1s0"])
    if success2 and "state UP" in link_output:
        config["connected"] = True

    return config


@router.post("/lan2/configure")
async def configure_lan2(request: Lan2ConfigRequest):
    """Configure LAN2 (enp1s0) via netplan, preserving enp2s0 config"""
    logger.info(f"Configuring LAN2 (enp1s0): mode={request.mode}")

    # Read current enp2s0 (PLC) config to preserve it
    enp2s0_config = ""
    try:
        success, netplan_out = run_command(["sudo", "cat", "/etc/netplan/00-installer-config.yaml"])
        if success and "enp2s0" in netplan_out:
            match = regex.search(r'(enp2s0:[^e]*?)(?=enp1s0|$)', netplan_out, regex.DOTALL)
            if match:
                enp2s0_config = match.group(1).rstrip()
    except Exception:
        pass

    if not enp2s0_config:
        # Safe fallback: read live config from ip addr
        enp2s0_config = "enp2s0:\n      dhcp4: true"
        logger.warning("Could not read enp2s0 config from netplan, using dhcp fallback")

    if request.mode == "static":
        if not request.ip_address:
            raise HTTPException(status_code=400, detail="IP address required for static mode")
        prefix = 24
        if request.subnet_mask:
            octets = request.subnet_mask.split(".")
            binary = "".join(format(int(o), "08b") for o in octets)
            prefix = binary.count("1")
        enp1s0_config = f"""enp1s0:
      addresses:
        - {request.ip_address}/{prefix}"""
        if request.gateway:
            enp1s0_config += f"""
      routes:
        - to: default
          via: {request.gateway}"""
    else:
        enp1s0_config = """enp1s0:
      dhcp4: true"""

    netplan_config = f"""network:
  version: 2
  renderer: networkd
  ethernets:
    {enp1s0_config}
    {enp2s0_config}
"""

    try:
        with open("/tmp/netplan-config.yaml", "w") as f:
            f.write(netplan_config)
        success, output = run_command(["sudo", "cp", "/tmp/netplan-config.yaml", "/etc/netplan/00-installer-config.yaml"])
        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to write config: {output}")
        success, output = run_command(["sudo", "netplan", "apply"])
        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to apply netplan: {output}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    logger.info(f"LAN2 configured successfully: {request.mode}")
    return {"success": True, "message": f"LAN2 configured as {request.mode}"}


# ═══════════════════════════════════════════════════════════════════════════════
# CURSOR CONTROL APIs
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/cursor/status")
async def get_cursor_status():
    """Check if mouse cursor is hidden (unclutter running)"""
    success, output = run_command(["pgrep", "-x", "unclutter"])
    return {
        "hidden": success,  # If pgrep succeeds, unclutter is running = cursor hidden
    }


@router.post("/cursor/toggle")
async def toggle_cursor():
    """Toggle mouse cursor visibility by starting/stopping unclutter"""
    success, _ = run_command(["pgrep", "-x", "unclutter"])
    if success:
        # Unclutter is running - kill it to show cursor
        run_command(["pkill", "-x", "unclutter"])
        logger.info("Cursor shown (unclutter killed)")
        return {"success": True, "hidden": False, "message": "Cursor is now visible"}
    else:
        # Unclutter is not running - start it to hide cursor
        try:
            subprocess.Popen(
                ["/usr/bin/unclutter", "-idle", "0.5", "-root"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                env={**os.environ, "DISPLAY": ":0"}
            )
            logger.info("Cursor hidden (unclutter started)")
            return {"success": True, "hidden": True, "message": "Cursor is now hidden"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to start unclutter: {str(e)}")
