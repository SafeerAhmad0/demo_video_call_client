import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete
from typing import List

from app.db.session import get_session
from app.db.models import Claim, User
from app.db.schemas import ClaimCreate, ClaimResponse

router = APIRouter(prefix="/claims", tags=["claims"])

@router.post("/", response_model=ClaimResponse, status_code=201)
async def create_claim(
    claim: ClaimCreate, 
    session: AsyncSession = Depends(get_session)
    # current_user: User = Depends(get_current_user)  # TODO: Add authentication
):
    # For now, we'll use a dummy user_id = 1
    # In production, this should come from the authenticated user
    user_id = 1
    
    # Check if claim number already exists
    result = await session.execute(select(Claim).where(Claim.claim_number == claim.claim_number))
    existing_claim = result.scalar_one_or_none()
    
    if existing_claim:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Claim with this number already exists"
        )
    
    # Create new claim
    stmt = insert(Claim).values(
        claim_number=claim.claim_number,
        patient_mobile=claim.patient_mobile,
        hospital_city=claim.hospital_city,
        hospital_state=claim.hospital_state,
        language=claim.language,
        user_id=user_id
    ).returning(Claim)
    
    result = await session.execute(stmt)
    new_claim = result.scalar_one()
    await session.commit()
    
    return new_claim

@router.get("/", response_model=List[ClaimResponse])
async def get_claims(
    session: AsyncSession = Depends(get_session)
    # current_user: User = Depends(get_current_user)  # TODO: Add authentication
):
    # For now, get all claims
    # In production, filter by current_user.id
    result = await session.execute(select(Claim).order_by(Claim.created_at.desc()))
    claims = result.scalars().all()
    return claims

@router.get("/{claim_id}", response_model=ClaimResponse)
async def get_claim(
    claim_id: int,
    session: AsyncSession = Depends(get_session)
    # current_user: User = Depends(get_current_user)  # TODO: Add authentication
):
    result = await session.execute(select(Claim).where(Claim.id == claim_id))
    claim = result.scalar_one_or_none()
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    return claim

@router.put("/{claim_id}", response_model=ClaimResponse)
async def update_claim(
    claim_id: int,
    claim_update: ClaimCreate,
    session: AsyncSession = Depends(get_session)
    # current_user: User = Depends(get_current_user)  # TODO: Add authentication
):
    # Check if claim exists
    result = await session.execute(select(Claim).where(Claim.id == claim_id))
    existing_claim = result.scalar_one_or_none()
    
    if not existing_claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # Update claim
    stmt = update(Claim).where(Claim.id == claim_id).values(
        claim_number=claim_update.claim_number,
        patient_mobile=claim_update.patient_mobile,
        hospital_city=claim_update.hospital_city,
        hospital_state=claim_update.hospital_state,
        language=claim_update.language
    ).returning(Claim)
    
    result = await session.execute(stmt)
    updated_claim = result.scalar_one()
    await session.commit()
    
    return updated_claim

@router.delete("/{claim_id}")
async def delete_claim(
    claim_id: int,
    session: AsyncSession = Depends(get_session)
    # current_user: User = Depends(get_current_user)  # TODO: Add authentication
):
    # Check if claim exists
    result = await session.execute(select(Claim).where(Claim.id == claim_id))
    existing_claim = result.scalar_one_or_none()
    
    if not existing_claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # Delete claim
    await session.execute(delete(Claim).where(Claim.id == claim_id))
    await session.commit()
    
    return {"message": "Claim deleted successfully"}
