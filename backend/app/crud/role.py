from typing import Any, Dict, Union, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.role import Role
from app.schemas.role import RoleCreateRequestBody, RoleUpdate


def get_by_id(db: Session, role_id: int) -> Role | None:
    """Get role by ID"""
    return db.query(Role).filter(Role.role_id == role_id).first()


def get_by_name(db: Session, role_name: str) -> Role | None:
    """Get role by name"""
    return db.query(Role).filter(Role.role_name == role_name).first()


def get_multi(db: Session, *, skip: int = 0, limit: int = 100) -> List[Role]:
    """Get multiple roles"""
    return db.query(Role).offset(skip).limit(limit).all()


def get_all(db: Session) -> List[Role]:
    """Get all roles (for simple dropdown lists)"""
    return db.query(Role).all()


def create_role(db: Session, *, obj_in: RoleCreateRequestBody) -> Role:
    """Create new role"""
    # Check if role name already exists
    existing = get_by_name(db, role_name=obj_in.role_name)
    if existing:
        raise ValueError(f"Role with name '{obj_in.role_name}' already exists")
    
    db_obj = Role()
    db_obj.role_name = obj_in.role_name
    db_obj.description = obj_in.description

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_role(db: Session, *, db_obj: Role, obj_in: Union[RoleUpdate, Dict[str, Any]]) -> Role:
    """Update existing role"""
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.model_dump(exclude_unset=True)
    
    # Check if role name already exists (if updating name)
    if "role_name" in update_data and update_data["role_name"] != db_obj.role_name:
        existing = get_by_name(db, role_name=update_data["role_name"])
        if existing:
            raise ValueError(f"Role with name '{update_data['role_name']}' already exists")
    
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_role(db: Session, *, role_id: int) -> bool:
    """Delete role by ID"""
    role = get_by_id(db, role_id=role_id)
    if not role:
        return False
    
    # Check if role has users assigned
    user_count = get_user_count(db, role_id=role_id)
    if user_count > 0:
        raise ValueError(f"Cannot delete role '{role.role_name}' because it has {user_count} users assigned")
    
    db.delete(role)
    db.commit()
    return True


def get_user_count(db: Session, role_id: int) -> int:
    """Get count of users with this role"""
    from app.models.user import User
    return db.query(func.count(User.user_id)).filter(User.role_id == role_id).scalar() or 0


def search_roles(db: Session, *, search_term: str) -> List[Role]:
    """Search roles by name or description"""
    search_filter = Role.role_name.ilike(f"%{search_term}%")
    if search_term:
        # Also search in description if it exists
        search_filter = search_filter | Role.description.ilike(f"%{search_term}%")
    
    return db.query(Role).filter(search_filter).all()


def get_roles_with_user_counts(db: Session) -> List[Dict[str, Any]]:
    """Get all roles with their user counts"""
    from app.models.user import User
    
    # Join roles with user count
    query = db.query(
        Role.role_id,
        Role.role_name,
        Role.description,
        func.count(User.user_id).label('user_count')
    ).outerjoin(User, Role.role_id == User.role_id).group_by(
        Role.role_id, Role.role_name, Role.description
    )
    
    results = query.all()
    
    role_details = []
    for result in results:
        role_details.append({
            "role_id": result.role_id,
            "role_name": result.role_name,
            "description": result.description,
            "user_count": result.user_count or 0,
        })
    
    return role_details 