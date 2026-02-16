from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
import io
import os
import shutil
import logging

from db.database import get_db
from db.models import Test, TestDataPoint, Alarm

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Reports"])

# These will be set from main.py
pdf_generator = None
excel_exporter = None


def set_services(pdf_gen, excel_exp):
    global pdf_generator, excel_exporter
    pdf_generator = pdf_gen
    excel_exporter = excel_exp


# ========== Test History ==========

@router.get("/tests")
async def get_tests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sample_id: Optional[str] = None,
    operator: Optional[str] = None,
    passed: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get test history with pagination and filters"""
    query = select(Test).order_by(desc(Test.test_date))

    # Apply filters
    if sample_id:
        query = query.where(Test.sample_id.contains(sample_id))
    if operator:
        query = query.where(Test.operator.contains(operator))
    if passed is not None:
        query = query.where(Test.passed == passed)

    # Count total
    count_query = select(Test)
    if sample_id:
        count_query = count_query.where(Test.sample_id.contains(sample_id))
    if operator:
        count_query = count_query.where(Test.operator.contains(operator))
    if passed is not None:
        count_query = count_query.where(Test.passed == passed)

    result = await db.execute(count_query)
    total = len(result.scalars().all())

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    tests = result.scalars().all()

    return {
        "tests": [t.to_dict() for t in tests],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/tests/{test_id}")
async def get_test(test_id: int, db: AsyncSession = Depends(get_db)):
    """Get single test details with data points"""
    query = select(Test).options(selectinload(Test.data_points)).where(Test.id == test_id)
    result = await db.execute(query)
    test = result.scalar_one_or_none()

    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    test_dict = test.to_dict()
    test_dict["data_points"] = [dp.to_dict() for dp in test.data_points]
    return test_dict


@router.delete("/tests/{test_id}")
async def delete_test(test_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a test record"""
    query = select(Test).where(Test.id == test_id)
    result = await db.execute(query)
    test = result.scalar_one_or_none()

    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    await db.delete(test)
    await db.commit()

    return {"success": True, "message": f"Test {test_id} deleted"}


# ========== PDF Reports ==========

@router.get("/report/pdf/{test_id}")
async def download_pdf_report(
    test_id: int,
    force_unit: str = Query("N", regex="^(N|kN)$"),
    db: AsyncSession = Depends(get_db)
):
    """Download PDF report for a specific test"""
    if pdf_generator is None:
        raise HTTPException(status_code=503, detail="PDF generator not initialized")

    query = select(Test).options(selectinload(Test.data_points)).where(Test.id == test_id)
    result = await db.execute(query)
    test = result.scalar_one_or_none()

    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    # Generate PDF
    pdf_buffer = pdf_generator.generate_test_report(test, force_unit=force_unit)

    filename = f"test_report_{test_id}_{test.test_date.strftime('%Y%m%d')}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_buffer),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ========== Excel Export ==========

@router.get("/report/excel")
async def export_excel(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    force_unit: str = Query("N", regex="^(N|kN)$"),
    db: AsyncSession = Depends(get_db)
):
    """Export tests to Excel file"""
    if excel_exporter is None:
        raise HTTPException(status_code=503, detail="Excel exporter not initialized")

    query = select(Test).order_by(desc(Test.test_date))

    # Apply date filters
    if start_date:
        start = datetime.fromisoformat(start_date)
        query = query.where(Test.test_date >= start)
    if end_date:
        end = datetime.fromisoformat(end_date)
        query = query.where(Test.test_date <= end)

    result = await db.execute(query)
    tests = result.scalars().all()

    if not tests:
        raise HTTPException(status_code=404, detail="No tests found for export")

    # Generate Excel
    excel_buffer = excel_exporter.export_tests(tests, force_unit=force_unit)

    filename = f"test_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        io.BytesIO(excel_buffer),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/report/excel/{test_id}")
async def download_excel_report(
    test_id: int,
    force_unit: str = Query("N", regex="^(N|kN)$"),
    db: AsyncSession = Depends(get_db)
):
    """Download Excel report for a specific test with data points"""
    if excel_exporter is None:
        raise HTTPException(status_code=503, detail="Excel exporter not initialized")

    query = select(Test).options(selectinload(Test.data_points)).where(Test.id == test_id)
    result = await db.execute(query)
    test = result.scalar_one_or_none()

    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    excel_buffer = excel_exporter.export_test_with_data_points(test, force_unit=force_unit)

    filename = f"test_report_{test_id}_{test.test_date.strftime('%Y%m%d')}.xlsx"

    return StreamingResponse(
        io.BytesIO(excel_buffer),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ========== USB Detection & Export ==========

USB_MOUNT_BASE = "/media/usb"


def _detect_usb_block_devices():
    """Detect USB block devices using lsblk, auto-mount if needed"""
    import subprocess
    devices = []
    try:
        result = subprocess.run(
            ["lsblk", "-J", "-o", "NAME,SIZE,TYPE,MOUNTPOINT,LABEL,TRAN,RM"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode != 0:
            return devices

        import json
        data = json.loads(result.stdout)

        for disk in data.get("blockdevices", []):
            # Look for removable USB disks (rm=True or tran=usb)
            is_usb = disk.get("tran") == "usb" or disk.get("rm") == True or disk.get("rm") == "1"
            if not is_usb or disk.get("type") != "disk":
                continue

            # Check partitions
            for part in disk.get("children", []):
                if part.get("type") != "part":
                    continue

                label = part.get("label") or part.get("name", "USB")
                mountpoint = part.get("mountpoint")
                dev_name = part.get("name")

                # Auto-mount if not mounted
                if not mountpoint:
                    mount_dir = os.path.join(USB_MOUNT_BASE, dev_name)
                    os.makedirs(mount_dir, exist_ok=True)
                    try:
                        mount_result = subprocess.run(
                            ["sudo", "mount", f"/dev/{dev_name}", mount_dir],
                            capture_output=True, text=True, timeout=10
                        )
                        if mount_result.returncode == 0:
                            mountpoint = mount_dir
                            logger.info(f"Auto-mounted /dev/{dev_name} to {mount_dir}")
                        else:
                            logger.warning(f"Failed to mount /dev/{dev_name}: {mount_result.stderr}")
                            continue
                    except Exception as e:
                        logger.warning(f"Mount error for /dev/{dev_name}: {e}")
                        continue

                # Get free space
                free_gb = None
                try:
                    stat = shutil.disk_usage(mountpoint)
                    free_gb = round(stat.free / (1024 ** 3), 2)
                except Exception:
                    pass

                devices.append({
                    "label": label,
                    "path": mountpoint,
                    "free_gb": free_gb,
                    "device": f"/dev/{dev_name}",
                    "size": part.get("size", ""),
                })

    except Exception as e:
        logger.error(f"USB detection error: {e}")

    return devices


@router.get("/usb/devices")
async def get_usb_devices():
    """Detect USB drives, auto-mount if needed"""
    devices = _detect_usb_block_devices()
    return {"devices": devices}


class UsbEjectRequest(BaseModel):
    usb_path: str


@router.post("/usb/eject")
async def eject_usb(req: UsbEjectRequest):
    """Safely unmount/eject a USB drive"""
    import subprocess
    if not req.usb_path or not os.path.ismount(req.usb_path):
        raise HTTPException(status_code=400, detail="Invalid USB path")
    try:
        subprocess.run(["sudo", "umount", req.usb_path], check=True, timeout=10)
        return {"success": True, "message": "USB safely ejected"}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Failed to eject: {e}")
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Eject timed out")


class UsbExportRequest(BaseModel):
    test_ids: List[int]
    format: str  # "pdf" or "excel"
    usb_path: str
    force_unit: str = "N"


@router.post("/usb/export")
async def export_to_usb(
    req: UsbExportRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generate reports and copy them to a USB drive"""
    # Validate USB path is a real mount
    if not os.path.ismount(req.usb_path):
        raise HTTPException(status_code=400, detail="USB device not found at specified path")

    if req.format not in ("pdf", "excel"):
        raise HTTPException(status_code=400, detail="Format must be 'pdf' or 'excel'")

    # Create reports folder on USB
    reports_dir = os.path.join(req.usb_path, "GRP_Test_Reports")
    os.makedirs(reports_dir, exist_ok=True)

    exported = []
    errors = []

    for test_id in req.test_ids:
        query = select(Test).options(selectinload(Test.data_points)).where(Test.id == test_id)
        result = await db.execute(query)
        test = result.scalar_one_or_none()

        if not test:
            errors.append(f"Test {test_id} not found")
            continue

        try:
            date_str = test.test_date.strftime('%Y%m%d') if test.test_date else "unknown"
            if req.format == "pdf":
                if pdf_generator is None:
                    errors.append(f"Test {test_id}: PDF generator not available")
                    continue
                data = pdf_generator.generate_test_report(test, force_unit=req.force_unit)
                filename = f"test_report_{test_id}_{date_str}.pdf"
            else:
                if excel_exporter is None:
                    errors.append(f"Test {test_id}: Excel exporter not available")
                    continue
                data = excel_exporter.export_test_with_data_points(test, force_unit=req.force_unit)
                filename = f"test_report_{test_id}_{date_str}.xlsx"

            filepath = os.path.join(reports_dir, filename)
            with open(filepath, "wb") as f:
                f.write(data)
            exported.append(filename)
        except Exception as e:
            logger.error(f"Failed to export test {test_id}: {e}")
            errors.append(f"Test {test_id}: {str(e)}")

    return {
        "success": len(exported) > 0,
        "exported": exported,
        "errors": errors,
        "export_path": reports_dir,
    }


# ========== Alarms ==========

@router.get("/alarms")
async def get_alarms(
    active_only: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get alarm history"""
    query = select(Alarm).order_by(desc(Alarm.timestamp))

    if active_only:
        query = query.where(Alarm.acknowledged == False)

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    alarms = result.scalars().all()

    return {
        "alarms": [a.to_dict() for a in alarms],
        "page": page,
        "page_size": page_size
    }


@router.post("/alarms/{alarm_id}/acknowledge")
async def acknowledge_alarm(
    alarm_id: int,
    ack_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Acknowledge an alarm"""
    query = select(Alarm).where(Alarm.id == alarm_id)
    result = await db.execute(query)
    alarm = result.scalar_one_or_none()

    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")

    alarm.acknowledged = True
    alarm.ack_timestamp = datetime.utcnow()
    alarm.ack_by = ack_by

    await db.commit()

    return {"success": True, "message": f"Alarm {alarm_id} acknowledged"}


@router.post("/alarms/acknowledge-all")
async def acknowledge_all_alarms(
    ack_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Acknowledge all active alarms"""
    query = select(Alarm).where(Alarm.acknowledged == False)
    result = await db.execute(query)
    alarms = result.scalars().all()

    count = 0
    for alarm in alarms:
        alarm.acknowledged = True
        alarm.ack_timestamp = datetime.utcnow()
        alarm.ack_by = ack_by
        count += 1

    await db.commit()

    return {"success": True, "message": f"{count} alarms acknowledged"}
