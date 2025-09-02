from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert, select, func
from typing import List

from app.db.session import get_session
from app.db import models
from app.db.schemas import GeolocationCreate, GeolocationResponse, GeolocationListResponse

router = APIRouter(prefix="/geolocation", tags=["geolocation"])

@router.post("/capture", response_model=GeolocationResponse)
async def capture_geolocation(
    payload: GeolocationCreate,
    session: AsyncSession = Depends(get_session)
):
    """Capture geolocation data for a claim"""

    # Verify claim exists
    result = await session.execute(
        select(models.Claim).where(models.Claim.id == payload.claim_id)
    )
    claim = result.scalar_one_or_none()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )

    # Insert geolocation data
    stmt = insert(models.Geolocation).values(
        claim_id=payload.claim_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        accuracy=payload.accuracy,
        source=payload.source,
        geo_metadata=payload.geo_metadata
    ).returning(models.Geolocation.id)

    result = await session.execute(stmt)
    new_id = result.scalar_one()
    await session.commit()

    # Retrieve the created geolocation
    result = await session.execute(
        select(models.Geolocation).where(models.Geolocation.id == new_id)
    )
    geolocation = result.scalar_one()

    return GeolocationResponse.from_orm(geolocation)

@router.get("/claim/{claim_id}", response_model=GeolocationListResponse)
async def get_geolocations_by_claim(
    claim_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Get all geolocation data for a specific claim"""

    # Verify claim exists
    result = await session.execute(
        select(models.Claim).where(models.Claim.id == claim_id)
    )
    claim = result.scalar_one_or_none()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )

    # Get geolocations for the claim
    result = await session.execute(
        select(models.Geolocation)
        .where(models.Geolocation.claim_id == claim_id)
        .order_by(models.Geolocation.timestamp.desc())
    )
    geolocations = result.scalars().all()

    # Get total count
    count_result = await session.execute(
        select(func.count(models.Geolocation.id))
        .where(models.Geolocation.claim_id == claim_id)
    )
    total_count = count_result.scalar()

    return GeolocationListResponse(
        geolocations=[GeolocationResponse.from_orm(geo) for geo in geolocations],
        total_count=total_count
    )

@router.get("/{geolocation_id}", response_model=GeolocationResponse)
async def get_geolocation(
    geolocation_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Get a specific geolocation entry"""

    result = await session.execute(
        select(models.Geolocation).where(models.Geolocation.id == geolocation_id)
    )
    geolocation = result.scalar_one_or_none()

    if not geolocation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Geolocation entry not found"
        )

    return GeolocationResponse.from_orm(geolocation)

@router.get("/claim/{claim_id}/latest", response_model=GeolocationResponse)
async def get_latest_geolocation(
    claim_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Get the most recent geolocation entry for a claim"""

    # Verify claim exists
    result = await session.execute(
        select(models.Claim).where(models.Claim.id == claim_id)
    )
    claim = result.scalar_one_or_none()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )

    # Get the latest geolocation
    result = await session.execute(
        select(models.Geolocation)
        .where(models.Geolocation.claim_id == claim_id)
        .order_by(models.Geolocation.timestamp.desc())
        .limit(1)
    )
    geolocation = result.scalar_one_or_none()

    if not geolocation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No geolocation data found for this claim"
        )

    return GeolocationResponse.from_orm(geolocation)
