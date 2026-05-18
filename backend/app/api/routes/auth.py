from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole

router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.VISITOR


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    name: str


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest) -> AuthResponse:
    if await User.find_one(User.email == body.email):
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        role=body.role,
    )
    await user.insert()

    token = create_access_token(str(user.id), user.role)
    return AuthResponse(access_token=token, user_id=str(user.id), role=user.role, name=user.name)


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest) -> AuthResponse:
    user = await User.find_one(User.email == body.email)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(str(user.id), user.role)
    return AuthResponse(access_token=token, user_id=str(user.id), role=user.role, name=user.name)


@router.get("/me")
async def me(user: User = None) -> dict:
    from app.api.deps import get_current_user
    from fastapi import Depends
    # Handled inline in main — see /api/auth/me route in main.py
    return {}
