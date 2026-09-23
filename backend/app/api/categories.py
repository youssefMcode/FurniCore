from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user, require_admin
from app.core.supabase import supabase
from app.schemas.product import CategoryCreate, CategoryUpdate


router = APIRouter(
    prefix="/api/categories",
    tags=["Categories"],
)


@router.get("")
def list_categories(
    current_user: dict = Depends(get_current_user),
):
    try:
        response = (
            supabase.table("categories")
            .select(
                "id, name, description, is_active, created_at"
            )
            .order("name")
            .execute()
        )

        return response.data or []

    except Exception as exc:
        print(f"Categories list error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load categories.",
        )


@router.post("", status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    current_user: dict = Depends(require_admin),
):
    try:
        name = payload.name.strip()

        existing_response = (
            supabase.table("categories")
            .select("id, name")
            .execute()
        )

        duplicate = any(
            category["name"].lower() == name.lower()
            for category in (existing_response.data or [])
        )

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A category with this name already exists.",
            )

        response = (
            supabase.table("categories")
            .insert(
                {
                    "name": name,
                    "description": (
                        payload.description.strip()
                        if payload.description
                        else None
                    ),
                    "is_active": True,
                }
            )
            .execute()
        )

        category = response.data[0]

        supabase.table("audit_logs").insert(
            {
                "user_id": current_user["id"],
                "action": "created category",
                "entity_type": "category",
                "entity_id": category["id"],
            }
        ).execute()

        return category

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Create category error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create category.",
        )


@router.patch("/{category_id}")
def update_category(
    category_id: str,
    payload: CategoryUpdate,
    current_user: dict = Depends(require_admin),
):
    try:
        existing = (
            supabase.table("categories")
            .select("id")
            .eq("id", category_id)
            .single()
            .execute()
        )

        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found.",
            )

        update_data = payload.model_dump(exclude_unset=True)

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No category changes were provided.",
            )

        if "name" in update_data:
            name = update_data["name"].strip()

            categories_response = (
                supabase.table("categories")
                .select("id, name")
                .execute()
            )

            duplicate = any(
                category["id"] != category_id
                and category["name"].lower() == name.lower()
                for category in (categories_response.data or [])
            )

            if duplicate:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A category with this name already exists.",
                )

            update_data["name"] = name

        if (
            "description" in update_data
            and update_data["description"]
        ):
            update_data["description"] = (
                update_data["description"].strip()
            )

        response = (
            supabase.table("categories")
            .update(update_data)
            .eq("id", category_id)
            .execute()
        )

        supabase.table("audit_logs").insert(
            {
                "user_id": current_user["id"],
                "action": "updated category",
                "entity_type": "category",
                "entity_id": category_id,
            }
        ).execute()

        return response.data[0]

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Update category error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update category.",
        )