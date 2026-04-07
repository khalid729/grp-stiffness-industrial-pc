"""Sample Management API - Clients, Projects, Samples"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import Optional, List
from pydantic import BaseModel
from db.database import get_db
from db.models import Client, Project, Sample, SamplePosition
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/samples", tags=["Samples"])


# === Pydantic Models ===

class ClientCreate(BaseModel):
    name: str
    client_type: str = "external"
    contact_info: Optional[str] = None
    notes: Optional[str] = None

class ProjectCreate(BaseModel):
    client_id: int
    name: str
    po_number: Optional[str] = None
    notes: Optional[str] = None

class PositionData(BaseModel):
    position: int
    angle: float
    h_id: Optional[float] = None
    v_id: Optional[float] = None
    wall_thickness: Optional[float] = None
    ring_length: float = 300

class SampleCreate(BaseModel):
    project_id: int
    sample_id: str
    operator: Optional[str] = None
    pipe_diameter: Optional[float] = None
    pipe_length: Optional[float] = None
    deflection_percent: float = 5.0
    lot_number: Optional[str] = None
    product_id: Optional[str] = None
    nominal_diameter: Optional[float] = None
    nominal_weight: Optional[float] = None
    pressure_class: Optional[str] = None
    target_sn_class: Optional[int] = None
    num_positions: int = 3
    crack_stage1_percent: float = 12.0
    crack_stage2_percent: float = 17.0
    fracture_max_percent: float = 50.0
    positions: List[PositionData] = []


class SampleUpdate(BaseModel):
    """All fields optional. positions are MERGED — only positions in the list are updated;
    positions not in the list are preserved."""
    sample_id: Optional[str] = None
    operator: Optional[str] = None
    pipe_diameter: Optional[float] = None
    pipe_length: Optional[float] = None
    deflection_percent: Optional[float] = None
    lot_number: Optional[str] = None
    product_id: Optional[str] = None
    nominal_diameter: Optional[float] = None
    nominal_weight: Optional[float] = None
    pressure_class: Optional[str] = None
    target_sn_class: Optional[int] = None
    num_positions: Optional[int] = None
    crack_stage1_percent: Optional[float] = None
    crack_stage2_percent: Optional[float] = None
    fracture_max_percent: Optional[float] = None
    positions: Optional[List[PositionData]] = None


# === Clients ===

@router.get("/clients")
async def list_clients(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).order_by(desc(Client.created_at)))
    clients = result.scalars().all()
    return {"clients": [c.to_dict() for c in clients]}

@router.post("/clients")
async def create_client(data: ClientCreate, db: AsyncSession = Depends(get_db)):
    client = Client(**data.model_dump())
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client.to_dict()

@router.delete("/clients/{client_id}")
async def delete_client(client_id: int, db: AsyncSession = Depends(get_db)):
    client = await db.get(Client, client_id)
    if not client: raise HTTPException(404, "Client not found")
    await db.delete(client)
    await db.commit()
    return {"success": True}


# === Projects ===

@router.get("/projects/{client_id}")
async def list_projects(client_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.client_id == client_id).order_by(desc(Project.created_at)))
    projects = result.scalars().all()
    return {"projects": [p.to_dict() for p in projects]}

@router.post("/projects")
async def create_project(data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = Project(**data.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project.to_dict()

@router.delete("/projects/{project_id}")
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project: raise HTTPException(404, "Project not found")
    await db.delete(project)
    await db.commit()
    return {"success": True}


# === Samples ===

@router.get("/list/{project_id}")
async def list_samples(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Sample).options(selectinload(Sample.positions))
        .where(Sample.project_id == project_id)
        .order_by(desc(Sample.created_at))
    )
    samples = result.scalars().all()
    out = []
    for s in samples:
        d = s.to_dict()
        d["positions"] = [p.to_dict() for p in s.positions]
        out.append(d)
    return {"samples": out}


# === Active Sample (for Dashboard) ===

_ACTIVE_FILE = '/home/khalid/grp-stiffness-test-machine/backend/.active_sample'

def _load_active() -> Optional[int]:
    try:
        with open(_ACTIVE_FILE, 'r') as f:
            return int(f.read().strip())
    except:
        return None

def _save_active(sid: Optional[int]):
    try:
        if sid is not None:
            with open(_ACTIVE_FILE, 'w') as f:
                f.write(str(sid))
        else:
            import os
            os.remove(_ACTIVE_FILE)
    except:
        pass

_active_sample_id: Optional[int] = _load_active()

@router.get("/active")
async def get_active_sample():
    return {"sample_id": _active_sample_id}

@router.post("/active/{sample_id}")
async def set_active_sample(sample_id: int, db: AsyncSession = Depends(get_db)):
    global _active_sample_id
    sample = await db.get(Sample, sample_id)
    if not sample: raise HTTPException(404, "Sample not found")
    _active_sample_id = sample_id
    _save_active(sample_id)
    return {"success": True, "sample_id": sample_id}

@router.post("/active/clear")
async def clear_active_sample():
    global _active_sample_id
    _active_sample_id = None
    _save_active(None)
    return {"success": True}

@router.get("/{sample_id}")
async def get_sample(sample_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Sample).options(selectinload(Sample.positions)).where(Sample.id == sample_id)
    )
    sample = result.scalar_one_or_none()
    if not sample: raise HTTPException(404, "Sample not found")
    d = sample.to_dict()
    d["positions"] = [p.to_dict() for p in sample.positions]
    # Include client and project names
    project = await db.get(Project, sample.project_id)
    if project:
        d["project_name"] = project.name
        d["po_number"] = project.po_number
        client = await db.get(Client, project.client_id)
        if client:
            d["client_name"] = client.name
            d["client_id"] = client.id
    return d

@router.post("/create")
async def create_sample(data: SampleCreate, db: AsyncSession = Depends(get_db)):
    sample = Sample(
        project_id=data.project_id,
        sample_id=data.sample_id,
        operator=data.operator,
        pipe_diameter=data.pipe_diameter,
        pipe_length=data.pipe_length,
        deflection_percent=data.deflection_percent,
        lot_number=data.lot_number,
        product_id=data.product_id,
        nominal_diameter=data.nominal_diameter,
        nominal_weight=data.nominal_weight,
        pressure_class=data.pressure_class,
        stiffness_class=f"SN{data.target_sn_class}" if data.target_sn_class else None,
        target_sn_class=data.target_sn_class,
        num_positions=data.num_positions,
        crack_stage1_percent=data.crack_stage1_percent,
        crack_stage2_percent=data.crack_stage2_percent,
        fracture_max_percent=data.fracture_max_percent,
    )
    db.add(sample)
    await db.flush()

    for p in data.positions:
        pos = SamplePosition(
            sample_id=sample.id,
            position=p.position,
            angle=p.angle,
            h_id=p.h_id,
            v_id=p.v_id,
            wall_thickness=p.wall_thickness,
            ring_length=p.ring_length,
        )
        db.add(pos)

    await db.commit()
    await db.refresh(sample)
    logger.info(f"Sample created: {sample.sample_id} with {len(data.positions)} positions")
    return {"id": sample.id, "sample_id": sample.sample_id}

@router.put("/{sample_id}")
async def update_sample(sample_id: int, data: SampleUpdate, db: AsyncSession = Depends(get_db)):
    """Update sample fields and merge positions. Positions NOT in the request are preserved."""
    sample = await db.get(Sample, sample_id)
    if not sample:
        raise HTTPException(404, "Sample not found")

    # Update scalar fields (only if provided)
    update_fields = data.model_dump(exclude_unset=True, exclude={'positions'})
    for key, value in update_fields.items():
        setattr(sample, key, value)
    if 'target_sn_class' in update_fields and update_fields['target_sn_class']:
        sample.stiffness_class = f"SN{update_fields['target_sn_class']}"

    # Merge positions: update existing rows, insert missing ones, NEVER delete
    if data.positions is not None:
        result = await db.execute(
            select(SamplePosition).where(SamplePosition.sample_id == sample_id)
        )
        existing = {p.position: p for p in result.scalars().all()}
        for p in data.positions:
            if p.position in existing:
                row = existing[p.position]
                row.angle = p.angle
                row.h_id = p.h_id
                row.v_id = p.v_id
                row.wall_thickness = p.wall_thickness
                row.ring_length = p.ring_length
            else:
                db.add(SamplePosition(
                    sample_id=sample_id,
                    position=p.position, angle=p.angle,
                    h_id=p.h_id, v_id=p.v_id,
                    wall_thickness=p.wall_thickness, ring_length=p.ring_length,
                ))

    await db.commit()
    await db.refresh(sample)
    logger.info(f"Sample {sample_id} updated (positions merged, none deleted)")
    return {"id": sample.id, "sample_id": sample.sample_id}


@router.delete("/{sample_id}")
async def delete_sample(sample_id: int, db: AsyncSession = Depends(get_db)):
    sample = await db.get(Sample, sample_id)
    if not sample: raise HTTPException(404, "Sample not found")
    await db.delete(sample)
    await db.commit()
    return {"success": True}
