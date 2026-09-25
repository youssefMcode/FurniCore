from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user, require_admin
from app.core.supabase import supabase
from app.schemas.business_settings import BusinessSettingsUpdate
from uuid import uuid4

from fastapi import File, UploadFile


router = APIRouter(
    prefix="/api/business-settings",
    tags=["Business Settings"],
)


def load_settings():
    response = (
        supabase.table("business_settings")
        .select(
            "id, business_name, phone, address, "
            "logo_url, currency"
        )
        .limit(1)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business settings not found.",
        )

    return response.data[0]


@router.get("")
def get_business_settings(
    current_user: dict = Depends(get_current_user),
):
    try:
        return load_settings()

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Business settings error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load business settings.",
        )


@router.patch("")
def update_business_settings(
    payload: BusinessSettingsUpdate,
    current_user: dict = Depends(require_admin),
):
    try:
        existing = load_settings()

        business_name = payload.business_name.strip()

        if len(business_name) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Business name is required.",
            )

        currency = payload.currency.strip().upper()

        if len(currency) != 3 or not currency.isalpha():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Currency must be a 3-letter code.",
            )

        update_data = {
            "business_name": business_name,
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
            "currency": currency,
        }

        response = (
            supabase.table("business_settings")
            .update(update_data)
            .eq("id", existing["id"])
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Business settings could not be updated.",
            )

        try:
            (
                supabase.table("audit_logs")
                .insert(
                    {
                        "user_id": current_user["id"],
                        "action": "updated business settings",
                        "entity_type": "business_settings",
                        "entity_id": existing["id"],
                    }
                )
                .execute()
            )
        except Exception as audit_error:
            print(
                f"Business settings audit error: {audit_error}"
            )

        return response.data[0]

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Update business settings error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update business settings.",
        )


ALLOWED_LOGO_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}

MAX_LOGO_SIZE = 5 * 1024 * 1024


@router.post("/logo")
async def upload_business_logo(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin),
):
    try:
        if file.content_type not in ALLOWED_LOGO_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Logo must be a JPG, PNG, or WebP image.",
            )

        contents = await file.read()

        if not contents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Logo file is empty.",
            )

        if len(contents) > MAX_LOGO_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Logo must be 5 MB or smaller.",
            )

        settings = load_settings()

        extension = ALLOWED_LOGO_TYPES[file.content_type]
        storage_path = f"logos/{uuid4()}.{extension}"

        supabase.storage.from_("business-assets").upload(
            storage_path,
            contents,
            {
                "content-type": file.content_type,
                "upsert": "false",
            },
        )

        public_url_response = (
            supabase.storage
            .from_("business-assets")
            .get_public_url(storage_path)
        )

        logo_url = public_url_response

        if not logo_url:
            raise Exception(
                "Could not generate logo URL."
            )

        response = (
            supabase.table("business_settings")
            .update({"logo_url": logo_url})
            .eq("id", settings["id"])
            .execute()
        )

        if not response.data:
            raise Exception(
                "Could not update business logo."
            )

        try:
            (
                supabase.table("audit_logs")
                .insert(
                    {
                        "user_id": current_user["id"],
                        "action": "updated business logo",
                        "entity_type": "business_settings",
                        "entity_id": settings["id"],
                    }
                )
                .execute()
            )
        except Exception as audit_error:
            print(
                f"Business logo audit error: {audit_error}"
            )

        return response.data[0]

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Business logo error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to upload business logo.",
        )