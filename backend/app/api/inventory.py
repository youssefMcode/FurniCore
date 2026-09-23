from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user, require_admin
from app.core.supabase import supabase
from app.schemas.inventory import StockAdjustment


router = APIRouter(
    prefix="/api/inventory",
    tags=["Inventory"],
)


@router.get("")
def get_inventory(
    current_user: dict = Depends(get_current_user),
):
    try:
        response = (
            supabase.table("products")
            .select(
                "id, name, sku, category_id, stock_quantity, "
                "minimum_stock, is_active, "
                "categories(id, name), "
                "product_images(id, image_url, storage_path, "
                "is_primary, sort_order)"
            )
            .order("name")
            .execute()
        )

        return response.data or []

    except Exception as exc:
        print(f"Inventory fetch error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load inventory.",
        )


@router.patch("/{product_id}/adjust")
def adjust_stock(
    product_id: str,
    payload: StockAdjustment,
    current_user: dict = Depends(require_admin),
):
    try:
        response = (
            supabase.table("products")
            .select(
                "id, name, sku, stock_quantity, minimum_stock"
            )
            .eq("id", product_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found.",
            )

        product = response.data[0]

        current_stock = int(product["stock_quantity"])

        if payload.adjustment_type == "add":
            new_stock = current_stock + payload.quantity
            signed_change = payload.quantity

        else:
            if payload.quantity > current_stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Cannot remove more stock than is "
                        "currently available."
                    ),
                )

            new_stock = current_stock - payload.quantity
            signed_change = -payload.quantity

        update_response = (
            supabase.table("products")
            .update({"stock_quantity": new_stock})
            .eq("id", product_id)
            .execute()
        )

        if not update_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to update stock.",
            )

        # Keep an auditable summary without adding an unnecessary
        # inventory-movement table to the project.
        supabase.table("audit_logs").insert(
            {
                "user_id": current_user["id"],
                "action": (
                    f"manual stock adjustment: "
                    f"{signed_change:+d}; "
                    f"{current_stock} -> {new_stock}; "
                    f"reason: {payload.reason.strip()}"
                ),
                "entity_type": "product",
                "entity_id": product_id,
            }
        ).execute()

        return {
            "message": "Stock updated successfully.",
            "product_id": product_id,
            "previous_stock": current_stock,
            "stock_quantity": new_stock,
            "adjustment": signed_change,
        }

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Stock adjustment error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to adjust stock.",
        )