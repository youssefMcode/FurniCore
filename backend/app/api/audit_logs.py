from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.core.auth import require_admin
from app.core.supabase import supabase


router = APIRouter(
    prefix="/api/audit-logs",
    tags=["Audit Logs"],
)


@router.get("")
def list_audit_logs(
    limit: int = Query(default=100, ge=1, le=200),
    current_user: dict = Depends(require_admin),
):
    try:
        response = (
            supabase.table("audit_logs")
            .select(
                "id, action, entity_type, entity_id, created_at, "
                "users(id, name, role)"
            )
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )

        return response.data or []

    except Exception as exc:
        print(f"Audit log error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load audit log.",
        )