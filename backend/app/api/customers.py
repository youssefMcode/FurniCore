from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user
from app.core.supabase import supabase
from app.schemas.customer import CustomerCreate, CustomerUpdate


router = APIRouter(
    prefix="/api/customers",
    tags=["Customers"],
)


def get_customer_or_404(customer_id: str) -> dict:
    response = (
        supabase.table("customers")
        .select(
            "id, name, phone, address, notes, created_at"
        )
        .eq("id", customer_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    return response.data[0]


def write_audit_log(
    user_id: str,
    action: str,
    customer_id: str,
) -> None:
    try:
        (
            supabase.table("audit_logs")
            .insert(
                {
                    "user_id": user_id,
                    "action": action,
                    "entity_type": "customer",
                    "entity_id": customer_id,
                }
            )
            .execute()
        )
    except Exception as exc:
        # The customer operation should not be reported as failed
        # after it already succeeded only because audit logging failed.
        print(f"Customer audit log error: {exc}")


@router.get("")
def get_customers(
    current_user: dict = Depends(get_current_user),
):
    try:
        response = (
            supabase.table("customers")
            .select(
                "id, name, phone, address, notes, created_at"
            )
            .order("created_at", desc=True)
            .execute()
        )

        return response.data or []

    except Exception as exc:
        print(f"Customers fetch error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load customers.",
        )


@router.get("/{customer_id}")
def get_customer(
    customer_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        return get_customer_or_404(customer_id)

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Customer fetch error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load customer.",
        )


@router.post("", status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    current_user: dict = Depends(get_current_user),
):
    try:
        customer_data = payload.model_dump()

        response = (
            supabase.table("customers")
            .insert(customer_data)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to create customer.",
            )

        customer = response.data[0]

        write_audit_log(
            current_user["id"],
            "created customer",
            customer["id"],
        )

        return customer

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Customer creation error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create customer.",
        )


@router.patch("/{customer_id}")
def update_customer(
    customer_id: str,
    payload: CustomerUpdate,
    current_user: dict = Depends(get_current_user),
):
    try:
        get_customer_or_404(customer_id)

        changes = payload.model_dump(exclude_unset=True)

        if not changes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No changes were provided.",
            )

        response = (
            supabase.table("customers")
            .update(changes)
            .eq("id", customer_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to update customer.",
            )

        write_audit_log(
            current_user["id"],
            "updated customer",
            customer_id,
        )

        return response.data[0]

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Customer update error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update customer.",
        )