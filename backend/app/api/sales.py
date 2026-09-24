from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from app.core.auth import get_current_user , require_admin
from app.core.supabase import supabase
from app.schemas.sale import ( SaleCreate, PaymentCreate , ReturnCreate,)


router = APIRouter(
    prefix="/api/sales",
    tags=["Sales"],
)


def payment_summary(
    total: float,
    payments: list[dict],
) -> dict:
    paid = sum(
        float(payment.get("amount") or 0)
        for payment in payments
    )

    balance = max(float(total) - paid, 0)

    if paid <= 0:
        payment_status = "unpaid"
    elif balance > 0:
        payment_status = "partial"
    else:
        payment_status = "paid"

    return {
        "paid_amount": round(paid, 2),
        "balance": round(balance, 2),
        "payment_status": payment_status,
    }


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def create_sale(
    payload: SaleCreate,
    current_user: dict = Depends(get_current_user),
):
    try:
        rpc_payload = {
            "p_customer_id": (
                str(payload.customer_id)
                if payload.customer_id
                else None
            ),
            "p_created_by": current_user["id"],
            "p_discount": payload.discount,
            "p_payment_amount": payload.payment_amount,
            "p_payment_method": payload.payment_method,
            "p_payment_notes": payload.payment_notes,
            "p_items": [
                {
                    "product_id": str(item.product_id),
                    "quantity": item.quantity,
                    "discount": item.discount,
                    "customization": item.customization,
                }
                for item in payload.items
            ],
        }

        response = (
            supabase.rpc(
                "create_sale_transaction",
                rpc_payload,
            )
            .execute()
        )

        sale_id = response.data

        if not sale_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Sale could not be created.",
            )

        return get_sale_details(
            UUID(str(sale_id)),
            current_user,
        )

    except HTTPException:
        raise

    except Exception as exc:
        message = str(exc)
        print(f"Create sale error: {message}")

        known_messages = [
            "Sale must contain at least one item",
            "Customer not found",
            "Active user not found",
            "Product not found",
            "Inactive products cannot be sold",
            "Insufficient stock",
            "Item quantity must be greater than zero",
            "Item discount cannot exceed item value",
            "Sale discount cannot exceed subtotal",
            "Payment cannot exceed sale total",
            "Invalid sale item values",
        ]

        if any(
            known in message
            for known in known_messages
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=next(
                    known
                    for known in known_messages
                    if known in message
                ),
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to complete sale.",
        )


@router.get("")
def get_sales(
    current_user: dict = Depends(get_current_user),
):
    try:
        response = (
            supabase.table("sales")
            .select(
                "id, invoice_number, customer_id, "
                "created_by, subtotal, discount, total, "
                "status, created_at, "
                "customers(id, name, phone), "
                "payments(id, amount, payment_method, "
                "paid_at)"
            )
            .order("created_at", desc=True)
            .execute()
        )

        sales = response.data or []

        for sale in sales:
            sale.update(
                payment_summary(
                    float(sale["total"]),
                    sale.get("payments") or [],
                )
            )

        return sales

    except Exception as exc:
        print(f"Sales fetch error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load sales.",
        )


@router.get("/{sale_id}")
def get_sale_details(
    sale_id: UUID,
    current_user: dict = Depends(get_current_user),
):
    try:
        response = (
            supabase.table("sales")
.select(
    "id, invoice_number, customer_id, "
    "created_by, subtotal, discount, total, "
    "status, created_at, "
    "customers(id, name, phone, address), "
    "users!sales_created_by_fkey(id, name), "
    "sale_items("
    "id, product_id, quantity, unit_price, "
    "discount, customization, line_total, "
    "products(id, name, sku)"
    "), "
    "payments("
    "id, amount, payment_method, paid_at, "
    "recorded_by, notes"
    "), "
    "returns("
    "id, refund_amount, reason, created_at, "
    "return_items("
    "id, sale_item_id, quantity, amount, restock"
    ")"
    ")"
)
            .eq("id", str(sale_id))
            .limit(1)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sale not found.",
            )

        sale = response.data[0]

        sale.update(
            payment_summary(
                float(sale["total"]),
                sale.get("payments") or [],
            )
        )

        return sale

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Sale details error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load sale.",
        )

@router.post("/{sale_id}/payments")
def add_payment(
    sale_id: UUID,
    payload: PaymentCreate,
    current_user: dict = Depends(get_current_user),
):
    try:
        sale_response = (
            supabase.table("sales")
            .select("id, total, status")
            .eq("id", str(sale_id))
            .limit(1)
            .execute()
        )

        if not sale_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sale not found.",
            )

        sale = sale_response.data[0]

        if sale["status"] == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot add payment to a cancelled sale.",
            )

        payments_response = (
            supabase.table("payments")
            .select("amount")
            .eq("sale_id", str(sale_id))
            .execute()
        )

        paid = sum(
            float(payment["amount"])
            for payment in (payments_response.data or [])
        )

        balance = max(float(sale["total"]) - paid, 0)

        if balance <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This sale is already fully paid.",
            )

        if payload.amount > balance:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment cannot exceed the remaining balance.",
            )

        response = (
            supabase.table("payments")
            .insert(
                {
                    "sale_id": str(sale_id),
                    "amount": payload.amount,
                    "payment_method": payload.payment_method,
                    "recorded_by": current_user["id"],
                    "notes": payload.notes,
                }
            )
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to record payment.",
            )

        try:
            (
                supabase.table("audit_logs")
                .insert(
                    {
                        "user_id": current_user["id"],
                        "action": "recorded sale payment",
                        "entity_type": "sale",
                        "entity_id": str(sale_id),
                    }
                )
                .execute()
            )
        except Exception as audit_error:
            print(f"Payment audit error: {audit_error}")

        return get_sale_details(sale_id, current_user)

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Add payment error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to record payment.",
        )

@router.post("/{sale_id}/cancel")
def cancel_sale(
    sale_id: UUID,
    current_user: dict = Depends(require_admin),
):
    try:
        (
            supabase.rpc(
                "cancel_sale_transaction",
                {
                    "p_sale_id": str(sale_id),
                    "p_user_id": current_user["id"],
                },
            )
            .execute()
        )

        return get_sale_details(
            sale_id,
            current_user,
        )

    except HTTPException:
        raise

    except Exception as exc:
        message = str(exc)
        print(f"Cancel sale error: {message}")

        if "Sale not found" in message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sale not found.",
            )

        if "Sale is already cancelled" in message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sale is already cancelled.",
            )

        if "Sale with returns cannot be cancelled" in message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A sale with processed returns cannot be cancelled.",
            )

        if "Admin access required" in message:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required.",
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to cancel sale.",
        )

@router.post("/{sale_id}/returns")
def create_return(
    sale_id: UUID,
    payload: ReturnCreate,
    current_user: dict = Depends(require_admin),
):
    try:
        response = (
            supabase.rpc(
                "create_return_transaction",
                {
                    "p_sale_id": str(sale_id),
                    "p_processed_by": current_user["id"],
                    "p_reason": payload.reason,
                    "p_items": [
                        {
                            "sale_item_id": str(
                                item.sale_item_id
                            ),
                            "quantity": item.quantity,
                            "restock": item.restock,
                        }
                        for item in payload.items
                    ],
                },
            )
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Return could not be processed.",
            )

        return get_sale_details(
            sale_id,
            current_user,
        )

    except HTTPException:
        raise

    except Exception as exc:
        message = str(exc)
        print(f"Create return error: {message}")

        known_messages = [
            "Return must contain at least one item",
            "Sale not found",
            "Cancelled sale cannot be returned",
            "Admin access required",
            "Duplicate return item",
            "Invalid return item values",
            "Return quantity must be greater than zero",
            "Sale item not found",
            "Return quantity exceeds remaining returnable quantity",
        ]

        for known in known_messages:
            if known in message:
                code = (
                    status.HTTP_404_NOT_FOUND
                    if known in [
                        "Sale not found",
                        "Sale item not found",
                    ]
                    else status.HTTP_403_FORBIDDEN
                    if known == "Admin access required"
                    else status.HTTP_400_BAD_REQUEST
                )

                raise HTTPException(
                    status_code=code,
                    detail=known,
                )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process return.",
        )