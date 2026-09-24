from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from app.core.auth import (
    get_current_user,
    require_admin,
)
from app.core.supabase import supabase
from app.schemas.supplier import (
    SupplierCreate,
    SupplierUpdate,
)


router = APIRouter(
    prefix="/api/suppliers",
    tags=["Suppliers"],
)


@router.get("")
def get_suppliers(
    current_user: dict = Depends(get_current_user),
):
    try:
        response = (
            supabase.table("suppliers")
            .select(
                "id, name, phone, address, notes, "
                "is_active, created_at"
            )
            .order("created_at", desc=True)
            .execute()
        )

        return response.data or []

    except Exception as exc:
        print(f"Suppliers fetch error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load suppliers.",
        )


@router.get("/{supplier_id}")
def get_supplier(
    supplier_id: UUID,
    current_user: dict = Depends(get_current_user),
):
    try:
        response = (
            supabase.table("suppliers")
            .select(
                "id, name, phone, address, notes, "
                "is_active, created_at"
            )
            .eq("id", str(supplier_id))
            .limit(1)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found.",
            )

        return response.data[0]

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Supplier details error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load supplier.",
        )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def create_supplier(
    payload: SupplierCreate,
    current_user: dict = Depends(require_admin),
):
    try:
        name = payload.name.strip()

        if not name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier name is required.",
            )

        response = (
            supabase.table("suppliers")
            .insert(
                {
                    "name": name,
                    "phone": (
                        payload.phone.strip()
                        if payload.phone
                        else None
                    ),
                    "address": (
                        payload.address.strip()
                        if payload.address
                        else None
                    ),
                    "notes": (
                        payload.notes.strip()
                        if payload.notes
                        else None
                    ),
                    "is_active": True,
                }
            )
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supplier could not be created.",
            )

        supplier = response.data[0]

        try:
            (
                supabase.table("audit_logs")
                .insert(
                    {
                        "user_id": current_user["id"],
                        "action": "created supplier",
                        "entity_type": "supplier",
                        "entity_id": supplier["id"],
                    }
                )
                .execute()
            )
        except Exception as audit_error:
            print(
                f"Supplier audit error: {audit_error}"
            )

        return supplier

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Create supplier error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create supplier.",
        )


@router.patch("/{supplier_id}")
def update_supplier(
    supplier_id: UUID,
    payload: SupplierUpdate,
    current_user: dict = Depends(require_admin),
):
    try:
        existing = (
            supabase.table("suppliers")
            .select("id")
            .eq("id", str(supplier_id))
            .limit(1)
            .execute()
        )

        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found.",
            )

        updates = payload.model_dump(
            exclude_unset=True,
        )

        if "name" in updates:
            name = updates["name"].strip()

            if not name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Supplier name is required.",
                )

            updates["name"] = name

        for field in [
            "phone",
            "address",
            "notes",
        ]:
            if (
                field in updates
                and isinstance(updates[field], str)
            ):
                cleaned = updates[field].strip()
                updates[field] = cleaned or None

        if not updates:
            return get_supplier(
                supplier_id,
                current_user,
            )

        response = (
            supabase.table("suppliers")
            .update(updates)
            .eq("id", str(supplier_id))
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found.",
            )

        try:
            (
                supabase.table("audit_logs")
                .insert(
                    {
                        "user_id": current_user["id"],
                        "action": "updated supplier",
                        "entity_type": "supplier",
                        "entity_id": str(supplier_id),
                    }
                )
                .execute()
            )
        except Exception as audit_error:
            print(
                f"Supplier audit error: {audit_error}"
            )

        return response.data[0]

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Update supplier error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update supplier.",
        )