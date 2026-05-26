from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole

router = APIRouter()

_UNIVERSITY_DOMAINS = {
    "utoronto.ca", "uwo.ca", "queensu.ca", "uwaterloo.ca", "uoguelph.ca",
    "mcmaster.ca", "yorku.ca", "uottawa.ca", "carleton.ca", "torontomu.ca",
    "ryerson.ca", "laurentian.ca", "uwindsor.ca", "lakheadu.ca", "nipissingu.ca",
    "algomau.ca", "trent.ca", "brocku.ca", "georgiancollege.ca", "flemingcollege.ca",
    "humber.ca", "senecapolytechnic.ca", "durhamcollege.ca", "loyalistcollege.com",
    "saultcollege.ca", "northernc.on.ca", "confederation.on.ca",
}
_SCHOOL_BOARD_SUFFIXES = (".edu.on.ca", ".on.ca")
_SCHOOL_BOARD_KNOWN = {
    "tdsb.on.ca", "ocdsb.ca", "hwdsb.on.ca", "wrdsb.ca", "dsbn.edu.on.ca",
    "pvnccdsb.ca", "scdsb.on.ca", "ugdsb.on.ca", "tvdsb.ca", "yrdsb.ca",
    "peelschools.org", "ddsb.ca", "hcdsb.org", "ocsb.ca",
}
_GOVERNMENT_SUFFIXES = (".gc.ca", ".ontario.ca", ".gov.on.ca")
_PERSONAL_DOMAINS = {
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.ca", "hotmail.com",
    "hotmail.ca", "outlook.com", "outlook.ca", "icloud.com", "me.com",
    "live.com", "live.ca", "protonmail.com", "proton.me",
}


def _flag_email_domain(email: str) -> list[str]:
    domain = email.split("@")[-1].lower()
    flags: list[str] = []
    if domain in _UNIVERSITY_DOMAINS:
        flags.append("university")
    elif domain in _SCHOOL_BOARD_KNOWN or any(domain.endswith(s) for s in _SCHOOL_BOARD_SUFFIXES):
        flags.append("school_board")
    if any(domain.endswith(s) for s in _GOVERNMENT_SUFFIXES):
        flags.append("government")
    return flags


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.VISITOR
    onboarding_answers: list[str] = []


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    name: str
    roles: list[str] = []
    email_flags: list[str] = []


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest) -> AuthResponse:
    if await User.find_one(User.email == body.email):
        raise HTTPException(status_code=409, detail="Email already registered")

    email_flags = _flag_email_domain(body.email)

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        role=body.role,
        email_flags=email_flags,
        onboarding_answers=body.onboarding_answers,
    )
    await user.insert()

    token = create_access_token(str(user.id), user.role)
    return AuthResponse(
        access_token=token, user_id=str(user.id), role=user.role, name=user.name,
        roles=user.roles, email_flags=user.email_flags,
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest) -> AuthResponse:
    user = await User.find_one(User.email == body.email)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(str(user.id), user.role)
    return AuthResponse(
        access_token=token, user_id=str(user.id), role=user.role, name=user.name,
        roles=user.roles, email_flags=user.email_flags,
    )


class ProfileUpdate(BaseModel):
    name: str | None = None
    bio: str | None = None
    phone: str | None = None


@router.patch("/me", status_code=200)
async def update_me(body: ProfileUpdate, user: User = Depends(get_current_user)) -> dict:
    if body.name is not None:
        user.name = body.name
    if body.bio is not None:
        user.bio = body.bio
    if body.phone is not None:
        user.phone = body.phone
    await user.save()
    return {"id": str(user.id), "name": user.name, "bio": user.bio, "phone": user.phone}


class RoleAdd(BaseModel):
    role: str  # citizen_scientist | educator | creator | prospector | researcher


@router.post("/me/roles", status_code=200)
async def add_role(body: RoleAdd, user: User = Depends(get_current_user)) -> dict:
    allowed = {"citizen_scientist", "educator", "creator", "prospector", "researcher"}
    if body.role not in allowed:
        raise HTTPException(status_code=400, detail=f"Unknown role: {body.role}")
    if body.role not in user.roles:
        user.roles.append(body.role)
        await user.save()
    return {"roles": user.roles}


