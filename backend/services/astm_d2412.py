"""
ASTM D2412-02 Calculations
Pipe Stiffness / Parallel-Plate Loading
"""
import math
import logging

logger = logging.getLogger(__name__)


def calculate_position_results(
    force_n: float,
    h_id: float,
    v_id: float,
    wall_thickness: float,
    ring_length: float,
    deflection_percent: float,
) -> dict:
    """Calculate ASTM D2412 results for a single test position.
    
    Args:
        force_n: Force at target deflection (Newtons)
        h_id: Horizontal Inside Diameter (mm)
        v_id: Vertical Inside Diameter (mm)
        wall_thickness: Average wall thickness (mm)
        ring_length: Sample ring length (mm)
        deflection_percent: Target deflection percentage
    
    Returns:
        Dict with all calculated values
    """
    if v_id <= 0 or ring_length <= 0 or deflection_percent <= 0:
        logger.warning(f"Invalid inputs: v_id={v_id}, ring_length={ring_length}, defl%={deflection_percent}")
        return _empty_results()
    
    # Step 1: Initial Deflection (ovality)
    avg_id = (h_id + v_id) / 2
    initial_deflection = ((h_id - v_id) / avg_id) * 100 if avg_id > 0 else 0
    
    # Step 2: Deflection at test percentage
    deflection_mm = (deflection_percent / 100) * v_id
    
    # Step 3: Correction Factor (C-Factor)
    c_factor = (1 + (deflection_percent / 100) / 2) ** 3
    
    # Step 4: EI/R³
    ei_over_r3 = 0.0
    if deflection_mm > 0 and ring_length > 0:
        ei_over_r3 = 0.149 * force_n * c_factor / (deflection_mm * ring_length)
    
    # Step 5: STIS (N/m²)
    stis = ei_over_r3 * 1_000_000 / 8
    
    # Step 6: E-modulus (N/mm²)
    r = v_id / 2  # inner radius
    e_modulus = 0.0
    if wall_thickness > 0 and r > 0:
        e_modulus = ei_over_r3 * 12 * (r ** 3) / (wall_thickness ** 3)
    
    # Step 7: Simple Pipe Stiffness PS (N/mm/mm)
    ps = 0.0
    if ring_length > 0 and deflection_mm > 0:
        ps = (force_n / ring_length) / deflection_mm
    
    # Step 8: Stiffness Factor SF
    mean_radius = (v_id + wall_thickness) / 2  # approximate
    sf = 0.149 * (mean_radius ** 3) * ps if mean_radius > 0 else 0
    
    return {
        "initial_deflection": round(initial_deflection, 4),
        "deflection_mm": round(deflection_mm, 2),
        "c_factor": round(c_factor, 6),
        "ei_over_r3": round(ei_over_r3, 6),
        "stis": round(stis, 1),
        "e_modulus": round(e_modulus, 1),
        "pipe_stiffness_ps": round(ps, 6),
        "stiffness_factor_sf": round(sf, 2),
    }


def calculate_group_averages(position_results: list) -> dict:
    """Calculate averaged results across all positions.
    
    Args:
        position_results: List of dicts from calculate_position_results()
    
    Returns:
        Dict with averaged values
    """
    if not position_results:
        return {}
    
    n = len(position_results)
    
    return {
        "avg_stis": round(sum(r.get("stis", 0) for r in position_results) / n, 1),
        "avg_ei_over_r3": round(sum(r.get("ei_over_r3", 0) for r in position_results) / n, 6),
        "avg_e_modulus": round(sum(r.get("e_modulus", 0) for r in position_results) / n, 1),
    }


def classify_sn(avg_stis: float) -> int:
    """Classify SN based on average STIS (same thresholds as ISO 9969)."""
    if avg_stis >= 12500: return 12500
    if avg_stis >= 10000: return 10000
    if avg_stis >= 5000: return 5000
    if avg_stis >= 2500: return 2500
    if avg_stis >= 1250: return 1250
    return 0


def _empty_results() -> dict:
    return {
        "initial_deflection": 0, "deflection_mm": 0, "c_factor": 0,
        "ei_over_r3": 0, "stis": 0, "e_modulus": 0,
        "pipe_stiffness_ps": 0, "stiffness_factor_sf": 0,
    }
