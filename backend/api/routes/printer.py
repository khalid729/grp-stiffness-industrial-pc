"""
Printer Management API - CUPS-based network printer discovery and configuration
"""

import subprocess
import os
import re
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/printer", tags=["Printer"])


class AddPrinterRequest(BaseModel):
    name: str
    device_uri: str
    driver: str = "everywhere"
    description: Optional[str] = None
    set_default: bool = False


class PrinterNameRequest(BaseModel):
    printer_name: str


def run_command(cmd: list[str], timeout: int = 30) -> tuple[bool, str]:
    """Run a shell command and return success status and output"""
    cmd_paths = {
        "lpstat": "/usr/bin/lpstat",
        "lpinfo": "/usr/sbin/lpinfo",
        "lpadmin": "/usr/sbin/lpadmin",
        "lp": "/usr/bin/lp",
        "lpoptions": "/usr/bin/lpoptions",
        "cupsenable": "/usr/sbin/cupsenable",
        "cupsaccept": "/usr/sbin/cupsaccept",
        "cancel": "/usr/bin/cancel",
        "sudo": "/usr/bin/sudo",
    }
    if cmd and cmd[0] == "sudo":
        cmd = list(cmd)
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


def sanitize_printer_name(name: str) -> str:
    """Sanitize printer name for CUPS (alphanumeric, hyphens, underscores only)"""
    sanitized = re.sub(r'[^a-zA-Z0-9_-]', '_', name)
    return sanitized.strip('_') or "Printer"


@router.get("/list")
async def list_printers():
    """List all configured printers and their status"""
    printers = []

    # Get printer status
    success, output = run_command(["lpstat", "-p"])
    if success and output:
        for line in output.split("\n"):
            match = re.match(r'printer\s+(\S+)\s+.*', line)
            if match:
                name = match.group(1)
                is_idle = "idle" in line.lower()
                is_enabled = "enabled" in line.lower()
                printers.append({
                    "name": name,
                    "device_uri": "",
                    "status": "idle" if is_idle else ("printing" if "printing" in line.lower() else "unknown"),
                    "enabled": is_enabled,
                    "is_default": False,
                    "description": "",
                })

    # Get device URIs
    success, output = run_command(["lpstat", "-v"])
    if success and output:
        for line in output.split("\n"):
            match = re.match(r'device for (\S+):\s+(.+)', line)
            if match:
                name, uri = match.group(1), match.group(2)
                for p in printers:
                    if p["name"] == name:
                        p["device_uri"] = uri.strip()

    # Get default printer
    default_printer = None
    success, output = run_command(["lpstat", "-d"])
    if success and output:
        match = re.search(r'destination:\s+(\S+)', output)
        if match:
            default_printer = match.group(1)
            for p in printers:
                if p["name"] == default_printer:
                    p["is_default"] = True

    return {"printers": printers, "default_printer": default_printer}


@router.get("/discover")
async def discover_printers():
    """Discover network printers via CUPS/DNS-SD"""
    success, output = run_command(["sudo", "lpinfo", "--timeout", "10", "-v"], timeout=30)
    printers = []

    if success and output:
        for line in output.split("\n"):
            line = line.strip()
            if not line:
                continue
            # Format: "network uri" or "direct uri"
            parts = line.split(" ", 1)
            if len(parts) < 2:
                continue
            conn_type, uri = parts[0], parts[1]
            if conn_type != "network":
                continue
            # Skip generic backends
            if any(skip in uri for skip in ["dnssd://", "lpd://", "http://", "https://"]):
                if "dnssd://" not in uri:
                    continue

            # Extract description from URI
            desc = uri
            if "dnssd://" in uri:
                # dnssd://HP%20DeskJet%204800%20series%20%5B1452FD%5D._ipp._tcp.local/
                name_part = uri.replace("dnssd://", "").split("._")[0]
                desc = name_part.replace("%20", " ").replace("%5B", "[").replace("%5D", "]")

            protocol = "IPP"
            if "socket://" in uri:
                protocol = "Socket/RAW"
            elif "ipp://" in uri:
                protocol = "IPP"
            elif "dnssd://" in uri:
                protocol = "DNS-SD"

            printers.append({
                "device_uri": uri,
                "description": desc,
                "protocol": protocol,
            })

    return {"printers": printers}


@router.post("/add")
async def add_printer(req: AddPrinterRequest):
    """Add a new printer"""
    name = sanitize_printer_name(req.name)

    cmd = ["sudo", "lpadmin", "-p", name, "-v", req.device_uri, "-m", req.driver, "-E"]
    if req.description:
        cmd.extend(["-D", req.description])

    success, output = run_command(cmd)
    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to add printer: {output}")

    # Enable and accept jobs
    run_command(["sudo", "cupsenable", name])
    run_command(["sudo", "cupsaccept", name])

    if req.set_default:
        run_command(["sudo", "lpoptions", "-d", name])

    logger.info(f"Printer added: {name} ({req.device_uri})")
    return {"success": True, "message": f"Printer '{name}' added", "name": name}


@router.post("/remove")
async def remove_printer(req: PrinterNameRequest):
    """Remove a printer"""
    success, output = run_command(["sudo", "lpadmin", "-x", req.printer_name])
    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to remove printer: {output}")

    logger.info(f"Printer removed: {req.printer_name}")
    return {"success": True, "message": f"Printer '{req.printer_name}' removed"}


@router.post("/set-default")
async def set_default_printer(req: PrinterNameRequest):
    """Set a printer as the system default"""
    success, output = run_command(["sudo", "lpoptions", "-d", req.printer_name])
    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to set default: {output}")

    logger.info(f"Default printer set: {req.printer_name}")
    return {"success": True, "message": f"'{req.printer_name}' set as default"}


@router.post("/test-page")
async def print_test_page(req: PrinterNameRequest):
    """Print a test page"""
    test_file = "/usr/share/cups/data/testprint.ps"
    if not os.path.exists(test_file):
        # Create a simple text test page
        test_file = "/tmp/cups_test.txt"
        with open(test_file, "w") as f:
            f.write("=== PRINTER TEST PAGE ===\n\n")
            f.write(f"Printer: {req.printer_name}\n")
            f.write("GRP Stiffness Test Machine\n")
            f.write("Print test successful.\n")

    success, output = run_command(["lp", "-d", req.printer_name, test_file])
    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to print test page: {output}")

    logger.info(f"Test page sent to: {req.printer_name}")
    return {"success": True, "message": f"Test page sent to '{req.printer_name}'"}
