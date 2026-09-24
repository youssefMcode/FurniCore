from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.auth import get_current_user, require_admin
from app.core.supabase import supabase
from app.schemas.purchase import PurchaseCreate


router = APIRouter(
    prefix="/api/purchases",
    tags=["Purchases"],
)


def load_purchase(purchase_id: str):
    response = (
        supabase.table("purchases")
        .select(
            "id, supplier_id, created_by, purchase_date, "
            "total, receipt_url, notes, status, created_at, "
            "suppliers(id, name, phone), "
            "purchase_items("
            "id, product_id, quantity, unit_cost, line_total, "
            "products(id, name, sku)"
            ")"
        )
        .eq("id", purchase_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase not found.",
        )

    return response.data[0]


@router.get("")
def list_purchases(
    supplier_id: UUID | None = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    try:
        query = (
            supabase.table("purchases")
            .select(
                "id, supplier_id, purchase_date, total, "
                "status, created_at, suppliers(id, name)"
            )
            .order("created_at", desc=True)
        )

        if supplier_id:
            query = query.eq(
                "supplier_id",
                str(supplier_id),
            )

        response = query.execute()

        return response.data or []

    except Exception as exc:
        print(f"Purchases list error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load purchases.",
        )


@router.get("/{purchase_id}")
def get_purchase(
    purchase_id: UUID,
    current_user: dict = Depends(get_current_user),
):
    try:
        return load_purchase(str(purchase_id))

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Purchase details error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load purchase.",
        )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def create_purchase(
    payload: PurchaseCreate,
    current_user: dict = Depends(require_admin),
):
    try:
        if not payload.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase must contain at least one item.",
            )

        product_ids = [
            str(item.product_id)
            for item in payload.items
        ]

        if len(product_ids) != len(set(product_ids)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A product cannot appear more than once.",
            )

        rpc_response = supabase.rpc(
            "create_purchase_transaction",
            {
                "p_supplier_id": str(payload.supplier_id),
                "p_created_by": current_user["id"],
                "p_purchase_date": payload.purchase_date.isoformat(),
                "p_notes": (
                    payload.notes.strip()
                    if payload.notes
                    else None
                ),
                "p_items": [
                    {
                        "product_id": str(item.product_id),
                        "quantity": item.quantity,
                        "unit_cost": float(item.unit_cost),
                    }
                    for item in payload.items
                ],
            },
        ).execute()

        purchase_id = rpc_response.data

        if not purchase_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Purchase could not be created.",
            )

        return load_purchase(str(purchase_id))

    except HTTPException:
        raise

    except Exception as exc:
        message = str(exc)
        print(f"Create purchase error: {message}")

        known_errors = [
            "Admin access required",
            "Active supplier not found",
            "Purchase date cannot be in the future",
            "Purchase must contain at least one item",
            "Duplicate products are not allowed",
            "Quantity must be greater than zero",
            "Unit cost cannot be negative",
            "Product not found",
            "Inactive products cannot be purchased",
            "Invalid purchase item",
        ]

        for known_error in known_errors:
            if known_error in message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=known_error,
                )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create purchase.",
        )


@router.post("/{purchase_id}/cancel")
def cancel_purchase(
    purchase_id: UUID,
    current_user: dict = Depends(require_admin),
):
    try:
        supabase.rpc(
            "cancel_purchase_transaction",
            {
                "p_purchase_id": str(purchase_id),
                "p_user_id": current_user["id"],
            },
        ).execute()

        return load_purchase(str(purchase_id))

    except HTTPException:
        raise

    except Exception as exc:
        message = str(exc)
        print(f"Cancel purchase error: {message}")

        known_errors = [
            "Purchase not found",
            "Purchase is already cancelled",
            "Purchase product no longer exists",
            "Purchase cannot be cancelled because some stock has already been used",
        ]

        for known_error in known_errors:
            if known_error in message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=known_error,
                )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to cancel purchase.",
        )