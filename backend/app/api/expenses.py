from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.auth import get_current_user, require_admin
from app.core.supabase import supabase
from app.schemas.expense import ExpenseCreate, ExpenseUpdate


router = APIRouter(
    prefix="/api/expenses",
    tags=["Expenses"],
)


@router.get("")
def list_expenses(
    category: str | None = Query(default=None),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    try:
        if start_date and end_date and start_date > end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start date cannot be after end date.",
            )

        query = (
            supabase.table("expenses")
            .select(
                "id, category, amount, description, "
                "expense_date, receipt_url, created_by, created_at"
            )
            .order("expense_date", desc=True)
        )

        if category:
            query = query.eq("category", category)

        if start_date:
            query = query.gte(
                "expense_date",
                start_date.isoformat(),
            )

        if end_date:
            query = query.lte(
                "expense_date",
                end_date.isoformat(),
            )

        response = query.execute()

        return response.data or []

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Expenses list error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load expenses.",
        )


@router.get("/{expense_id}")
def get_expense(
    expense_id: UUID,
    current_user: dict = Depends(get_current_user),
):
    try:
        response = (
            supabase.table("expenses")
            .select(
                "id, category, amount, description, "
                "expense_date, receipt_url, created_by, created_at"
            )
            .eq("id", str(expense_id))
            .limit(1)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found.",
            )

        return response.data[0]

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Expense details error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load expense.",
        )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def create_expense(
    payload: ExpenseCreate,
    current_user: dict = Depends(require_admin),
):
    try:
        if payload.expense_date > date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expense date cannot be in the future.",
            )

        description = payload.description.strip()

        if len(description) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expense description is required.",
            )

        response = (
            supabase.table("expenses")
            .insert(
                {
                    "category": payload.category,
                    "amount": float(payload.amount),
                    "description": description,
                    "expense_date": payload.expense_date.isoformat(),
                    "created_by": current_user["id"],
                }
            )
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Expense could not be created.",
            )

        expense = response.data[0]

        try:
            (
                supabase.table("audit_logs")
                .insert(
                    {
                        "user_id": current_user["id"],
                        "action": "created expense",
                        "entity_type": "expense",
                        "entity_id": expense["id"],
                    }
                )
                .execute()
            )
        except Exception as audit_error:
            print(f"Expense audit error: {audit_error}")

        return expense

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Create expense error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create expense.",
        )


@router.patch("/{expense_id}")
def update_expense(
    expense_id: UUID,
    payload: ExpenseUpdate,
    current_user: dict = Depends(require_admin),
):
    try:
        existing = (
            supabase.table("expenses")
            .select("id")
            .eq("id", str(expense_id))
            .limit(1)
            .execute()
        )

        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found.",
            )

        update_data = payload.model_dump(
            exclude_unset=True,
            mode="json",
        )

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No expense changes were provided.",
            )

        if "expense_date" in update_data:
            expense_date = date.fromisoformat(
                update_data["expense_date"]
            )

            if expense_date > date.today():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Expense date cannot be in the future.",
                )

        if "description" in update_data:
            description = update_data["description"].strip()

            if len(description) < 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Expense description is required.",
                )

            update_data["description"] = description

        response = (
            supabase.table("expenses")
            .update(update_data)
            .eq("id", str(expense_id))
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found.",
            )

        try:
            (
                supabase.table("audit_logs")
                .insert(
                    {
                        "user_id": current_user["id"],
                        "action": "updated expense",
                        "entity_type": "expense",
                        "entity_id": str(expense_id),
                    }
                )
                .execute()
            )
        except Exception as audit_error:
            print(f"Expense audit error: {audit_error}")

        return response.data[0]

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Update expense error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update expense.",
        )