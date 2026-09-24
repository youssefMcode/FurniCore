from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import require_admin
from app.core.supabase import supabase
from app.schemas.user import UserCreate, UserUpdate


router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


@router.get("")
def list_users(
    current_user: dict = Depends(require_admin),
):
    try:
        response = (
            supabase.table("users")
            .select("id, name, role, is_active, created_at")
            .order("created_at", desc=True)
            .execute()
        )

        return response.data or []

    except Exception as exc:
        print(f"Users list error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load users.",
        )


@router.get("/{user_id}")
def get_user(
    user_id: UUID,
    current_user: dict = Depends(require_admin),
):
    try:
        response = (
            supabase.table("users")
            .select("id, name, role, is_active, created_at")
            .eq("id", str(user_id))
            .limit(1)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        return response.data[0]

    except HTTPException:
        raise

    except Exception as exc:
        print(f"User details error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load user.",
        )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    payload: UserCreate,
    current_user: dict = Depends(require_admin),
):
    auth_user_id = None

    try:
        name = payload.name.strip()
        email = str(payload.email).strip().lower()

        if len(name) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name must contain at least 2 characters.",
            )

        # Create the authentication account.
        auth_response = supabase.auth.admin.create_user(
            {
                "email": email,
                "password": payload.password,
                "email_confirm": True,
            }
        )

        auth_user = auth_response.user

        if not auth_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication account could not be created.",
            )

        auth_user_id = str(auth_user.id)

        # Create FurniCore business profile.
        profile_response = (
            supabase.table("users")
            .insert(
                {
                    "id": auth_user_id,
                    "name": name,
                    "role": payload.role,
                    "is_active": True,
                }
            )
            .execute()
        )

        if not profile_response.data:
            raise Exception(
                "User profile could not be created."
            )

        user = profile_response.data[0]

        try:
            (
                supabase.table("audit_logs")
                .insert(
                    {
                        "user_id": current_user["id"],
                        "action": f"created {payload.role} user",
                        "entity_type": "user",
                        "entity_id": auth_user_id,
                    }
                )
                .execute()
            )
        except Exception as audit_error:
            print(f"User audit error: {audit_error}")

        return user

    except HTTPException:
        # Avoid leaving an Auth account without a business profile.
        if auth_user_id:
            try:
                supabase.auth.admin.delete_user(auth_user_id)
            except Exception:
                pass

        raise

    except Exception as exc:
        # Compensating cleanup if profile creation failed.
        if auth_user_id:
            try:
                supabase.auth.admin.delete_user(auth_user_id)
            except Exception as cleanup_error:
                print(
                    f"Auth cleanup error: {cleanup_error}"
                )

        print(f"Create user error: {exc}")

        message = str(exc).lower()

        if (
            "already" in message
            or "registered" in message
            or "exists" in message
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists.",
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create user.",
        )


@router.patch("/{user_id}")
def update_user(
    user_id: UUID,
    payload: UserUpdate,
    current_user: dict = Depends(require_admin),
):
    try:
        user_id_string = str(user_id)

        existing_response = (
            supabase.table("users")
            .select("id, name, role, is_active")
            .eq("id", user_id_string)
            .limit(1)
            .execute()
        )

        if not existing_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        existing = existing_response.data[0]

        update_data = payload.model_dump(
            exclude_unset=True
        )

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No user changes were provided.",
            )

        if "name" in update_data:
            update_data["name"] = (
                update_data["name"].strip()
            )

            if len(update_data["name"]) < 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Name must contain at least 2 characters.",
                )

        # Protect the currently logged-in administrator.
        if user_id_string == current_user["id"]:
            if update_data.get("is_active") is False:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You cannot deactivate your own account.",
                )

            if (
                "role" in update_data
                and update_data["role"] != "admin"
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You cannot remove your own administrator role.",
                )

        response = (
            supabase.table("users")
            .update(update_data)
            .eq("id", user_id_string)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        try:
            (
                supabase.table("audit_logs")
                .insert(
                    {
                        "user_id": current_user["id"],
                        "action": "updated user",
                        "entity_type": "user",
                        "entity_id": user_id_string,
                    }
                )
                .execute()
            )
        except Exception as audit_error:
            print(f"User audit error: {audit_error}")

        return response.data[0]

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Update user error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update user.",
        )