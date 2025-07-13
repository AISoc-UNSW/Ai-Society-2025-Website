from typing import Any

from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import (
    DiscordUserCreateRequestBody,
    UserCreateRequestBody,
    UserUpdate,
    UserSelfUpdate,
)


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_by_id(db: Session, id: int) -> User | None:
    return db.query(User).filter(User.user_id == id).first()


def get_by_discord_id(db: Session, discord_id: str) -> User | None:
    return db.query(User).filter(User.discord_id == discord_id).first()


def create_user(db: Session, *, obj_in: UserCreateRequestBody) -> User:
    db_obj = User()
    db_obj.email = obj_in.email
    db_obj.username = obj_in.username
    db_obj.hashed_password = get_password_hash(obj_in.password)
    db_obj.role_id = 1

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def create_discord_user(db: Session, *, obj_in: DiscordUserCreateRequestBody) -> User:
    db_obj = User()
    db_obj.email = obj_in.email
    db_obj.username = obj_in.username
    db_obj.discord_id = obj_in.discord_id
    db_obj.role_id = 1

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_user(db: Session, *, db_obj: User, obj_in: UserUpdate | dict[str, Any]) -> User:
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.model_dump(exclude_unset=True)
    if update_data.get("password"):
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        update_data["hashed_password"] = hashed_password
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def authenticate(db: Session, *, email: str, password: str) -> User | None:
    user = get_by_email(db, email=email)
    if not user:
        return None
    if not user.hashed_password:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_users_by_portfolio(db: Session, portfolio_id: int) -> list[User]:
    """Get all users belonging to a specific portfolio"""
    return db.query(User).filter(User.portfolio_id == portfolio_id).all()


def search_users(db: Session, *, search_term: str, limit: int = 10) -> list[User]:
    """Search users by username or email with fuzzy matching"""
    from sqlalchemy import or_

    search_filter = or_(
        User.username.ilike(f"%{search_term}%"), User.email.ilike(f"%{search_term}%")
    )

    return db.query(User).filter(search_filter).limit(limit).all()


def get_all_users(db: Session, *, skip: int = 0, limit: int = 100) -> list[User]:
    """Get all users with pagination support"""
    return db.query(User).offset(skip).limit(limit).all()


def update_user_self(db: Session, *, db_obj: User, obj_in: UserSelfUpdate) -> User:
    """Update user's own information with business logic validation"""
    from fastapi import HTTPException
    
    update_data = obj_in.model_dump(exclude_unset=True)
    
    # Business logic: portfolio can only be modified once
    if "portfolio_id" in update_data:
        if db_obj.portfolio_id is not None:
            raise HTTPException(
                status_code=400,
                detail="Portfolio can only be modified once. Your portfolio has already been set."
            )
    
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
